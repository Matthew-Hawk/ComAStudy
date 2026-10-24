import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { Activity } from "./Activity";
import { domains } from "../content/load";
import { useStudy } from "../storage";
import { buildDailyReview } from "../engine/session";
import { initialAttempt } from "../engine/retry";
import { LEARNING } from "../learning-config";
import { useNow } from "./LearningDashboard";
export function DailyReview() {
  const { progress, update, answer } = useStudy();
  const [query] = useSearchParams();
  const now = useNow();
  const scope = query.get("chapter");
  const start = query.get("before");
  const domain = domains.find((d) => d.id === scope);
  const allowed =
    domain && start
      ? domain.objectives
          .slice(
            0,
            domain.objectives.findIndex((o) => o.id === start),
          )
          .flatMap((o) => o.activities.map((a) => a.id))
      : undefined;
  const queue = buildDailyReview(
    domains,
    progress.schedules,
    now,
    LEARNING.reviewLimit,
    allowed,
  );
  const session = progress.review;
  if (
    scope &&
    session &&
    !session.completed &&
    session.scopeKey !== `${scope}:${start}`
  )
    return (
      <div className="narrow-page">
        <h1>You have a saved review.</h1>
        <p>
          You can resume it, or replace its remaining queue with {queue.length}{" "}
          due items from earlier sections. Your answered items stay saved.
        </p>
        <Link className="primary" to="/review">
          Resume saved review
        </Link>
        {queue.length > 0 && (
          <button className="secondary" onClick={begin}>
            Start earlier-section review instead
          </button>
        )}
      </div>
    );
  function begin() {
    update((p) => ({
      ...p,
      review: {
        id: `review-${Date.now()}`,
        queue,
        cursor: 0,
        attempts: {},
        completed: false,
        source: scope ? "chapter" : "daily",
        scopeKey: scope ? `${scope}:${start}` : undefined,
      },
    }));
  }
  if (!session || session.completed)
    return (
      <div className="narrow-page">
        <Link className="back-link" to="/">
          ← Study library
        </Link>
        <div className="eyebrow">DAILY REVIEW</div>
        <h1>
          {session?.completed
            ? "Review complete. Nicely done."
            : queue.length
              ? "A little recall goes a long way."
              : "Nothing due right now."}
        </h1>
        <p>
          {queue.length
            ? `${queue.length} due items, mixed across lessons. Work at your own pace; every item uses the same supportive retry loop.`
            : "Your next reviews will appear here when they’re ready. You can keep learning with any chapter."}
        </p>
        {queue.length > 0 && (
          <button className="primary" onClick={begin}>
            Start {queue.length}-item review <ArrowRight size={17} />
          </button>
        )}
        <Link className="secondary" to="/">
          Continue a chapter <BookOpen size={17} />
        </Link>
      </div>
    );
  const current = session.queue[session.cursor];
  const objective = domains
    .flatMap((d) => d.objectives)
    .find((o) => o.id === current?.objectiveId);
  const item = objective?.activities.find((a) => a.id === current.itemId);
  if (!item || !objective)
    return (
      <div className="narrow-page">
        <h1>This review needs a fresh start.</h1>
        <p>A saved item may have changed in the content library.</p>
        <button
          className="primary"
          onClick={() => update((p) => ({ ...p, review: null }))}
        >
          Return to review
        </button>
      </div>
    );
  const state = session.attempts[item.id] ?? initialAttempt();
  return (
    <div className="review-page">
      <div className="flow-top">
        <Link className="back-link" to="/">
          Save & exit review
        </Link>
        <span>
          {session.cursor + 1} of {session.queue.length} items
        </span>
      </div>
      <div className="eyebrow">DAILY REVIEW · OBJECTIVE {objective.number}</div>
      <h1>{objective.title}</h1>
      <Activity
        key={`${session.id}:${item.id}`}
        item={item}
        objective={objective}
        state={state}
        onAttempt={(next) =>
          answer(item.id, objective.id, next, Date.now(), true)
        }
        onHint={(hint) =>
          update((p) => ({
            ...p,
            review: p.review
              ? {
                  ...p.review,
                  attempts: { ...p.review.attempts, [item.id]: hint },
                }
              : null,
          }))
        }
        onNext={() =>
          update((p) => ({
            ...p,
            review: p.review
              ? {
                  ...p.review,
                  cursor: p.review.cursor + 1,
                  completed: p.review.cursor + 1 >= p.review.queue.length,
                }
              : null,
          }))
        }
      />
    </div>
  );
}
