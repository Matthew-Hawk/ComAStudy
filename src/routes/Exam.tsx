import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { domains, loadExam, cachedDomain } from "../content/load";
import type { Domain } from "../content/schema";
import { useStudy } from "../storage";
import { EXAM_LENGTHS, type ExamCode } from "../exam-config";
import {
  buildExam,
  answerExam,
  flagExam,
  hasAnswer,
  findExamItem,
  type ExamResult,
} from "../engine/exam";
import ExamQuestion from "../components/ExamQuestion";
import { Activity } from "../components/Activity";
import { initialAttempt } from "../engine/retry";
import { useNow } from "../components/LearningDashboard";
function useBank(code: ExamCode) {
  const [bank, setBank] = useState<Domain[]>(() =>
    domains
      .filter((d) => d.exam === code)
      .flatMap((d) => cachedDomain(d.id) ?? []),
  );
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    void loadExam(code)
      .then((value) => {
        if (active) setBank(value);
      })
      .catch(() => {
        if (active)
          setError(
            "Exam content could not be loaded. Check your connection and reload.",
          );
      });
    return () => {
      active = false;
    };
  }, [code]);
  return { bank: bank.filter((d) => d.exam === code), error };
}
export default function Exam() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { progress, update, submitExam } = useStudy();
  const [code, setCode] = useState<ExamCode>("220-1201");
  const [length, setLength] = useState<keyof typeof EXAM_LENGTHS>("Short");
  const [timer, setTimer] = useState(progress.examTimerDefault);
  const [review, setReview] = useState(false);
  const [resume, setResume] = useState(false);
  const confirm = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const now = useNow();
  const result = progress.examHistory.find((e) => e.id === resultId);
  const activeCode = result?.exam ?? progress.examSession?.exam ?? code;
  const { bank, error } = useBank(activeCode);
  const session = progress.examSession;
  const ready =
    bank.length === domains.filter((d) => d.exam === activeCode).length;
  const current = session?.questions[session.cursor];
  const item = current && findExamItem(bank, current);
  const change = useCallback(
    (value: import("../engine/retry").Answer) => {
      if (!current) return;
      update((p) => ({
        ...p,
        examSession: p.examSession
          ? answerExam(p.examSession, current.itemId, value)
          : null,
      }));
    },
    [current?.itemId, update],
  );
  useEffect(() => {
    heading.current?.focus();
  }, [session?.cursor, review, resultId, resume]);
  function begin() {
    const seed = Date.now() >>> 0;
    const questions = buildExam(bank, code, EXAM_LENGTHS[length], seed);
    if (!questions.length) return;
    update((p) => ({
      ...p,
      examSession: {
        id: `exam-${Date.now()}-${seed}`,
        exam: code,
        requested: EXAM_LENGTHS[length],
        questions,
        answers: {},
        flags: [],
        cursor: 0,
        startedAt: Date.now(),
        timerOn: timer,
        timerHidden: false,
        seed,
      },
    }));
    setResume(true);
    setReview(false);
  }
  if (resultId) {
    if (!result)
      return (
        <div className="narrow-page">
          <h1>That practice result is unavailable.</h1>
          <Link to="/exam">Practice exams</Link>
        </div>
      );
    return <ExamResults result={result} bank={bank} error={error} />;
  }
  if (session && resume) {
    if (error) return <p role="status">{error}</p>;
    if (!ready) return <p role="status">Loading saved exam…</p>;
    if (!item || session.questions.some((q) => !findExamItem(bank, q)))
      return (
        <div className="narrow-page">
          <h1>This saved question is unavailable</h1>
          <p>
            The question bank may have changed. You can start a fresh practice
            exam.
          </p>
          <button
            className="secondary"
            onClick={() => update((p) => ({ ...p, examSession: null }))}
          >
            Discard saved exam
          </button>
        </div>
      );
    return (
      <div className="exam-page">
        <div className="flow-top">
          <Link to="/study" className="back-link">
            Save & exit exam
          </Link>
          <span>
            Core {session.exam === "220-1201" ? 1 : 2} ·{" "}
            {session.questions.length} questions
          </span>
        </div>
        <h1 ref={heading} tabIndex={-1}>
          {review
            ? "Review your answers"
            : `Question ${session.cursor + 1} of ${session.questions.length}`}
        </h1>
        {session.timerOn && (
          <div className="exam-timer">
            {!session.timerHidden && (
              <span>
                Elapsed:{" "}
                {Math.floor(Math.max(0, now - session.startedAt) / 60000)} min
              </span>
            )}
            <button
              className="secondary"
              onClick={() =>
                update((p) => ({
                  ...p,
                  examSession: p.examSession
                    ? {
                        ...p.examSession,
                        timerHidden: !p.examSession.timerHidden,
                      }
                    : null,
                }))
              }
            >
              {session.timerHidden ? "Show timer" : "Hide timer"}
            </button>
            <small>
              Display only. Your exam will never submit automatically.
            </small>
          </div>
        )}
        {review ? (
          <>
            <p>
              No answers have been scored yet. You can return to any question.
            </p>
            <ol className="exam-review-list">
              {session.questions.map((q, i) => (
                <li key={q.itemId}>
                  <button
                    onClick={() => {
                      update((p) => ({
                        ...p,
                        examSession: p.examSession
                          ? { ...p.examSession, cursor: i }
                          : null,
                      }));
                      setReview(false);
                    }}
                  >
                    Question {i + 1} ·{" "}
                    {hasAnswer(session.answers[q.itemId])
                      ? "Answered"
                      : "Unanswered"}
                    {session.flags.includes(q.itemId) ? " · Flagged" : ""}
                  </button>
                </li>
              ))}
            </ol>
            <button
              className="primary"
              onClick={() => confirm.current?.showModal()}
            >
              Submit practice exam
            </button>
          </>
        ) : (
          <>
            <ExamQuestion
              key={item.id}
              item={item}
              answer={session.answers[item.id]}
              onChange={change}
              seed={session.seed}
            />
            <label className="exam-flag">
              <input
                type="checkbox"
                checked={session.flags.includes(item.id)}
                onChange={() =>
                  update((p) => ({
                    ...p,
                    examSession: p.examSession
                      ? flagExam(p.examSession!, item.id)
                      : null,
                  }))
                }
              />{" "}
              Flag this question for review
            </label>
            <div className="button-row">
              <button
                className="secondary"
                disabled={session.cursor === 0}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    examSession: p.examSession
                      ? { ...p.examSession, cursor: p.examSession.cursor - 1 }
                      : null,
                  }))
                }
              >
                Previous question
              </button>
              {session.cursor < session.questions.length - 1 && (
                <button
                  className="primary"
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      examSession: p.examSession
                        ? { ...p.examSession, cursor: p.examSession.cursor + 1 }
                        : null,
                    }))
                  }
                >
                  Next question
                </button>
              )}
              <button className="secondary" onClick={() => setReview(true)}>
                Review all questions
              </button>
            </div>
          </>
        )}
        <dialog ref={confirm} aria-labelledby="exam-submit-title">
          <h2 id="exam-submit-title">Submit these practice answers?</h2>
          <p>
            {
              session.questions.filter(
                (q) => !hasAnswer(session.answers[q.itemId]),
              ).length
            }{" "}
            unanswered questions will count as misses. This records the result
            and schedules reviews. You can keep editing until you confirm.
          </p>
          <div className="button-row">
            <button
              autoFocus
              className="secondary"
              onClick={() => confirm.current?.close()}
            >
              Keep editing
            </button>
            <button
              className="primary"
              onClick={() => {
                const scored = submitExam(bank, Date.now());
                if (scored) {
                  confirm.current?.close();
                  navigate(`/exam/results/${scored.id}`);
                }
              }}
            >
              Confirm submission
            </button>
          </div>
        </dialog>
      </div>
    );
  }
  const available = bank.flatMap((d) =>
    d.objectives.flatMap((o) =>
      o.activities.filter((a) => a.type !== "flashcard"),
    ),
  ).length;
  return (
    <div className="narrow-page">
      <div className="eyebrow">PRACTICE, AT YOUR PACE</div>
      <h1>Practice exam</h1>
      <p>
        Practice performance only. This activity does not predict a
        certification outcome. There are no hints, correctness checks, or
        retries until submission.
      </p>
      {session && (
        <section className="preference-card">
          <h2>Your exam is saved</h2>
          <div className="button-row">
            <button className="primary" onClick={() => setResume(true)}>
              Resume exam
            </button>
            <button
              className="secondary"
              onClick={() => update((p) => ({ ...p, examSession: null }))}
            >
              Discard saved exam
            </button>
          </div>
        </section>
      )}
      <div className="preference-card">
        <label>
          Exam
          <select
            value={code}
            onChange={(e) => setCode(e.target.value as ExamCode)}
            disabled={!!session}
          >
            <option value="220-1201">Core 1 · 220-1201</option>
            <option value="220-1202">Core 2 · 220-1202</option>
          </select>
        </label>
        <label>
          Length
          <select
            value={length}
            onChange={(e) =>
              setLength(e.target.value as keyof typeof EXAM_LENGTHS)
            }
          >
            {Object.keys(EXAM_LENGTHS).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="toggle-row">
          <span>Show an elapsed timer (optional)</span>
          <input
            type="checkbox"
            checked={timer}
            onChange={(e) => setTimer(e.target.checked)}
          />
        </label>
        <p className="helper">
          {ready
            ? `${Math.min(EXAM_LENGTHS[length], available)} questions will be drawn. ${available < EXAM_LENGTHS[length] ? `The current question bank has only ${available} eligible questions, fewer than the requested ${EXAM_LENGTHS[length]}.` : ""} Domain proportions are approximated when a domain has too few available questions.`
            : "Loading question bank…"}
        </p>
        {error && <p role="status">{error}</p>}
        <button
          className="primary"
          disabled={!ready || !available || !!session}
          onClick={begin}
        >
          Start practice exam
        </button>
      </div>
      <Link to="/stats">View past practice results</Link>
    </div>
  );
}
function ExamResults({
  result,
  bank,
  error,
}: {
  result: ExamResult;
  bank: Domain[];
  error: string;
}) {
  const { answer, update } = useStudy();
  const [miss, setMiss] = useState<string | null>(null);
  const q = result.questions.find((q) => q.itemId === miss);
  const item = q && findExamItem(bank, q);
  const objective =
    q &&
    bank
      .find((d) => d.id === q.domainId)
      ?.objectives.find((o) => o.id === q.objectiveId);
  if (item && objective)
    return (
      <div className="review-page">
        <button className="secondary" onClick={() => setMiss(null)}>
          Back to results
        </button>
        <h1>Work through this concept</h1>
        <Activity
          key={`${result.id}:${item.id}`}
          item={item}
          objective={objective}
          state={result.reviewAttempts[item.id] ?? initialAttempt()}
          onHint={(hint) =>
            update((p) => ({
              ...p,
              examHistory: p.examHistory.map((e) =>
                e.id === result.id
                  ? {
                      ...e,
                      reviewAttempts: { ...e.reviewAttempts, [item.id]: hint },
                    }
                  : e,
              ),
            }))
          }
          onAttempt={(next) =>
            answer(item.id, objective.id, next, Date.now(), false, result.id)
          }
          onNext={() => setMiss(null)}
        />
      </div>
    );
  return (
    <div className="exam-results">
      <h1>Your practice results</h1>
      <p className="score-summary">
        {result.correct} of {result.length} correct · {result.score}%
      </p>
      <p>
        These results describe this practice session only. They do not predict a
        real-exam outcome.
      </p>
      {result.timerOn && (
        <p>
          Time taken: {Math.floor(result.elapsedMs / 60000)} min{" "}
          {Math.floor(result.elapsedMs / 1000) % 60} sec
        </p>
      )}
      <h2>By domain</h2>
      {result.domainScores.map((d) => (
        <div className="domain-score" key={d.domainId}>
          <span>
            {domains.find((x) => x.id === d.domainId)?.title} · {d.correct}/
            {d.total} correct
          </span>
          <progress
            max={d.total}
            value={d.correct}
            aria-label={`${d.domainId}: ${d.correct} of ${d.total} correct`}
          />
        </div>
      ))}
      <h2>Concepts to revisit</h2>
      {result.missedIds.length ? (
        <ul className="miss-list">
          {result.missedIds.map((id) => {
            const q = result.questions.find((q) => q.itemId === id)!;
            const o = domains
              .flatMap((d) => d.objectives)
              .find((o) => o.id === q.objectiveId);
            return (
              <li key={id}>
                <span>
                  {o?.title ?? id} ·{" "}
                  {result.reviewAttempts[id]?.completed
                    ? "Reviewed"
                    : "Ready to review"}
                </span>
                <button
                  className="secondary"
                  disabled={!bank.length}
                  onClick={() => setMiss(id)}
                >
                  Review missed question
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No missed questions in this practice session.</p>
      )}
      {error && <p role="status">{error}</p>}
      <div className="button-row">
        <Link className="primary" to="/exam">
          Another practice exam
        </Link>
        <Link className="secondary" to="/stats">
          Your learning stats
        </Link>
      </div>
    </div>
  );
}
