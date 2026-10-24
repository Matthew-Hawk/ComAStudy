import { itemPath } from "./Chapter";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Search,
  X,
} from "lucide-react";
import { domains } from "../content/load";
import type { DomainIndex as Domain } from "../content/index-types";
import { useStudy, getAttempt } from "../storage";
import {
  buildChapterSession,
  earlierDueItems,
  type SessionItem,
} from "../engine/session";
import { domainCompletion, objectiveCompletion } from "../engine/completion";
import { objectiveMastery } from "../engine/mastery";
import {
  LearningDashboard,
  MasteryRing,
} from "../components/LearningDashboard";
import { DomainIcon, WorkspaceSketch } from "../components/ChapterBits";
import { Activity } from "../components/Activity";
import { Lesson } from "../components/Lesson";
import { useDomain } from "../content/use-domain";
import NotFound from "./NotFound";

export default function Flow() {
  const { domainId, objectiveId, itemId } = useParams();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const { progress, update, answer } = useStudy();
  const { domain: d, error } = useDomain(domainId);
  const o = d?.objectives.find((o) => o.id === objectiveId);
  const start = query.get("start") ?? objectiveId ?? "";
  useEffect(() => {
    if (!d || !o || !d.objectives.some((section) => section.id === start))
      return;
    const items = buildChapterSession(d, start);
    const cursor = items.findIndex(
      (i) => i.objectiveId === o.id && i.itemId === (itemId ?? "lesson"),
    );
    if (
      cursor < 0 ||
      items
        .slice(0, cursor)
        .some((i) =>
          i.kind === "lesson"
            ? !progress.lessons.includes(i.objectiveId)
            : !progress.attempts[i.itemId]?.completed,
        )
    )
      return;
    update((p) => ({
      ...p,
      lastChapter: d.id,
      resume: { ...p.resume, [d.id]: { start, cursor, updatedAt: Date.now() } },
    }));
  }, [domainId, objectiveId, itemId, start, d]);
  if (!d && domains.some((d) => d.id === domainId))
    return <div role="status">{error || "Loading lesson…"}</div>;
  if (!d || !o || !d.objectives.some((o) => o.id === start))
    return <NotFound />;
  const session = buildChapterSession(d, start);
  const index = session.findIndex(
    (i) => i.objectiveId === o.id && i.itemId === (itemId ?? "lesson"),
  );
  if (index < 0) return <NotFound />;
  const missing = session
    .slice(0, index)
    .find((i) =>
      i.kind === "lesson"
        ? !progress.lessons.includes(i.objectiveId)
        : !progress.attempts[i.itemId]?.completed,
    );
  if (missing) return <Navigate replace to={itemPath(d, missing, start)} />;
  function next() {
    if (!itemId)
      update((p) => ({
        ...p,
        lessons: p.lessons.includes(o!.id) ? p.lessons : [...p.lessons, o!.id],
        objectives: {
          ...p.objectives,
          [o!.id]: {
            lessonRead: true,
            completedItems: p.objectives[o!.id]?.completedItems ?? [],
            updatedAt: Date.now(),
          },
        },
      }));
    const cursor = index + 1;
    update((p) => ({
      ...p,
      resume: {
        ...p.resume,
        [d!.id]: { start, cursor, updatedAt: Date.now() },
      },
      lastChapter: d!.id,
    }));
    if (session[cursor]) navigate(itemPath(d!, session[cursor], start));
    else navigate(`/chapters/${d!.id}?finished=${start}`);
  }
  const activity = o.activities.find((a) => a.id === itemId);
  return (
    <div className="flow-page">
      <div className="flow-top">
        <Link
          className="back-link"
          to={`/chapters/${d.id}`}
          onClick={() =>
            update((p) => ({
              ...p,
              resume: {
                ...p.resume,
                [d.id]: { start, cursor: index, updatedAt: Date.now() },
              },
              lastChapter: d.id,
            }))
          }
        >
          <X size={17} /> Save & exit
        </Link>
        <span>
          {index + 1} of {session.length} steps
        </span>
      </div>
      <div
        className="flow-progress"
        role="progressbar"
        aria-label="Chapter session progress"
        aria-valuenow={index}
        aria-valuemin={0}
        aria-valuemax={session.length}
      >
        <span style={{ width: `${(index / session.length) * 100}%` }} />
      </div>
      <div className="flow-layout">
        <div>
          <div className="eyebrow">
            {d.title} / OBJECTIVE {o.number}
          </div>
          <h1>{o.title}</h1>
          <p className="flow-subtitle">{o.summary}</p>
          {activity ? (
            <Activity
              key={activity.id}
              item={activity}
              objective={o}
              state={getAttempt(progress, activity.id)}
              onAttempt={(state) =>
                answer(activity.id, o.id, state, Date.now())
              }
              onHint={(hint) =>
                update((p) => ({
                  ...p,
                  attempts: { ...p.attempts, [activity.id]: hint },
                }))
              }
              onNext={next}
            />
          ) : (
            <>
              <div className="lesson-label">
                <BookOpen size={17} /> THE LESSON <span>3 min read</span>
              </div>
              <Lesson objective={o} />
              <div className="lesson-end">
                <div>
                  <strong>Ready to put it into practice?</strong>
                  <p>No timer. Take all the time you need.</p>
                </div>
                <button className="primary" onClick={next}>
                  Start practice <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
        </div>
        <aside className="session-outline">
          <span className="eyebrow">IN THIS SESSION</span>
          {d.objectives
            .slice(d.objectives.findIndex((o) => o.id === start))
            .map((section) => (
              <div
                className={section.id === o.id ? "current" : ""}
                key={section.id}
              >
                <span>{section.number}</span>
                <strong>{section.title}</strong>
                <small>
                  {section.id === o.id ? "You are here" : "Lesson + practice"}
                </small>
              </div>
            ))}
          <p>
            <CircleHelp size={16} /> Complete each activity to continue. You can
            return to the map at any time.
          </p>
        </aside>
      </div>
    </div>
  );
}
