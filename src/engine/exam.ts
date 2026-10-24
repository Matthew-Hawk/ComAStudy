import type { Activity, Domain } from "../content/schema";
import { EXAM_WEIGHTS, type ExamCode } from "../exam-config";
import { isCorrect, type Answer } from "./retry";
export type ExamQuestion = {
  domainId: string;
  objectiveId: string;
  itemId: string;
};
export type ExamSession = {
  id: string;
  exam: ExamCode;
  requested: number;
  questions: ExamQuestion[];
  answers: Record<string, Answer>;
  flags: string[];
  cursor: number;
  startedAt: number;
  timerOn: boolean;
  timerHidden: boolean;
  seed: number;
};
export type DomainScore = { domainId: string; correct: number; total: number };
export type ExamResult = {
  id: string;
  date: number;
  exam: ExamCode;
  requested: number;
  length: number;
  correct: number;
  score: number;
  domainScores: DomainScore[];
  missedIds: string[];
  questions: ExamQuestion[];
  answers: Record<string, Answer>;
  timerOn: boolean;
  elapsedMs: number;
  reviewAttempts: Record<string, import("./retry").AttemptState>;
};
export function randomSource(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(1664525, n) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
export function randomShuffle<T>(values: T[], random: () => number) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
// Largest-remainder allocation, then redistribution only when a bank cannot supply its quota.
export function allocateQuestions(
  weights: Record<string, number>,
  available: Record<string, number>,
  requested: number,
) {
  const ids = Object.keys(weights);
  const count = Math.min(
    Math.max(0, Math.floor(requested)),
    ids.reduce((n, id) => n + (available[id] ?? 0), 0),
  );
  const totalWeight = ids.reduce((n, id) => n + weights[id], 0);
  const quotas = Object.fromEntries(
    ids.map((id) => [id, (count * weights[id]) / totalWeight]),
  );
  const allocation = Object.fromEntries(
    ids.map((id) => [id, Math.min(Math.floor(quotas[id]), available[id] ?? 0)]),
  );
  while (Object.values(allocation).reduce((n, v) => n + v, 0) < count) {
    const next = ids
      .filter((id) => allocation[id] < (available[id] ?? 0))
      .sort(
        (a, b) =>
          quotas[b] - allocation[b] - (quotas[a] - allocation[a]) ||
          ids.indexOf(a) - ids.indexOf(b),
      )[0];
    if (!next) break;
    allocation[next]++;
  }
  return allocation;
}
export function buildExam(
  domains: Domain[],
  exam: ExamCode,
  requested: number,
  seed: number,
): ExamQuestion[] {
  const bank = domains.filter((d) => d.exam === exam);
  const eligible = Object.fromEntries(
    bank.map((d) => [
      d.id,
      d.objectives.flatMap((o) =>
        o.activities
          .filter((a) => a.type !== "flashcard")
          .map((a) => ({ domainId: d.id, objectiveId: o.id, itemId: a.id })),
      ),
    ]),
  );
  const allocation = allocateQuestions(
    EXAM_WEIGHTS[exam],
    Object.fromEntries(
      Object.entries(eligible).map(([id, items]) => [id, items.length]),
    ),
    requested,
  );
  const random = randomSource(seed);
  return randomShuffle(
    Object.entries(allocation).flatMap(([id, count]) =>
      randomShuffle(eligible[id] ?? [], random).slice(0, count),
    ),
    random,
  );
}
export function answerExam(
  session: ExamSession,
  id: string,
  answer: Answer,
): ExamSession {
  if (!session.questions.some((q) => q.itemId === id)) return session;
  return { ...session, answers: { ...session.answers, [id]: answer } };
}
export function flagExam(session: ExamSession, id: string) {
  return {
    ...session,
    flags: session.flags.includes(id)
      ? session.flags.filter((v) => v !== id)
      : [...session.flags, id],
  };
}
export function hasAnswer(answer: Answer | undefined) {
  return typeof answer === "string"
    ? answer.trim().length > 0
    : Array.isArray(answer)
      ? answer.length > 0
      : !!answer && Object.keys(answer).length > 0;
}
export function scoreExam(
  session: ExamSession,
  domains: Domain[],
  now: number,
): ExamResult {
  const bank = new Map(
    domains.flatMap((d) =>
      d.objectives.flatMap((o) => o.activities.map((a) => [a.id, a] as const)),
    ),
  );
  const scores: Record<string, DomainScore> = {};
  const missedIds: string[] = [];
  let correct = 0;
  for (const q of session.questions) {
    const item = bank.get(q.itemId);
    if (!item) throw new Error(`Exam content is missing: ${q.itemId}`);
    const right = isCorrect(item, session.answers[q.itemId] ?? "");
    const s = (scores[q.domainId] ??= {
      domainId: q.domainId,
      correct: 0,
      total: 0,
    });
    s.total++;
    if (right) {
      s.correct++;
      correct++;
    } else missedIds.push(q.itemId);
  }
  return {
    id: session.id,
    date: now,
    exam: session.exam,
    requested: session.requested,
    length: session.questions.length,
    correct,
    score: session.questions.length
      ? Math.round((correct / session.questions.length) * 100)
      : 0,
    domainScores: Object.values(scores),
    missedIds,
    questions: session.questions,
    answers: session.answers,
    timerOn: session.timerOn,
    elapsedMs: Math.max(0, now - session.startedAt),
    reviewAttempts: {},
  };
}
export function findExamItem(
  domains: Domain[],
  question: ExamQuestion,
): Activity | undefined {
  return domains
    .find((d) => d.id === question.domainId)
    ?.objectives.find((o) => o.id === question.objectiveId)
    ?.activities.find((a) => a.id === question.itemId);
}
