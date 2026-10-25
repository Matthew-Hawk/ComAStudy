import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
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

export default function Chapter() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => {
      const target = document.getElementById(hash.slice(1));
      target?.focus({ preventScroll: true });
      target?.scrollIntoView?.({ block: "center" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hash]);
  const [query] = useSearchParams();
  const { domainId } = useParams();
  const d = domains.find((d) => d.id === domainId);
  const { progress } = useStudy();
  if (!d) return <NotFound />;
  const saved = progress.resume[d.id];
  const resume =
    saved && d.objectives.some((o) => o.id === saved.start) ? saved : undefined;
  const session = resume ? buildChapterSession(d, resume.start) : [];
  return (
    <div className="chapter-page">
      <Link className="back-link" to="/">
        ← Study library
      </Link>
      <div className="eyebrow">
        CORE {d.exam === "220-1201" ? 1 : 2} · {d.exam} · CHAPTER {d.number}
      </div>
      <div className="chapter-title">
        <span className="domain-icon large">
          <DomainIcon domain={d} size={30} />
        </span>
        <div>
          <h1>{d.title}</h1>
          <p>{d.description}</p>
        </div>
      </div>
      <div className="chapter-facts">
        <MasteryRing domain={d} />
        <strong>
          {domainCompletion(d, progress).percent}% complete · available lessons
        </strong>
        <span>{d.weight}% of exam</span>
        <span>{d.objectives.length} lessons</span>
        <span>All sections unlocked</span>
      </div>
      {query.get("finished") && (
        <div className="resume-banner">
          <div>
            <strong>You reached the end of this chapter.</strong>
            <p>
              Your progress is saved.{" "}
              {
                earlierDueItems(
                  d,
                  query.get("finished")!,
                  progress.schedules,
                  Date.now(),
                ).length
              }{" "}
              earlier items are due for an optional review.
            </p>
          </div>
          {earlierDueItems(
            d,
            query.get("finished")!,
            progress.schedules,
            Date.now(),
          ).length > 0 && (
            <Link
              className="secondary"
              to={`/review?chapter=${d.id}&before=${query.get("finished")}`}
            >
              Review earlier sections
            </Link>
          )}
        </div>
      )}
      {resume && session[resume.cursor] && (
        <div className="resume-banner">
          <div>
            <strong>Your place is saved.</strong>
            <p>
              Pick up at{" "}
              {
                d.objectives.find(
                  (o) => o.id === session[resume.cursor].objectiveId,
                )?.title
              }
              .
            </p>
          </div>
          <Link
            className="primary"
            to={itemPath(d, session[resume.cursor], resume.start)}
          >
            Resume <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div className="section-heading">
        <div>
          <h2>Choose your starting point</h2>
          <p>
            Start at any section, then continue through the rest of this
            chapter.
          </p>
        </div>
      </div>
      <ol className="section-map">
        {d.objectives.map((o, i) => {
          const completion = objectiveCompletion(o, progress);
          const done = completion.completed;
          return (
            <li key={o.id} id={o.id} tabIndex={-1}>
              <span
                className={`map-node ${done === o.activities.length ? "done" : ""}`}
              >
                {done === o.activities.length ? (
                  <Check size={19} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <div>
                <span className="eyebrow">OBJECTIVE {o.number}</span>
                <h3>{o.title}</h3>
                <p>{o.summary}</p>
                <span className="section-status">
                  <strong>{objectiveMastery(o, progress.schedules)}</strong> ·{" "}
                  {completion.percent}% complete ·{" "}
                  {done === o.activities.length
                    ? "Completed"
                    : done
                      ? "In progress"
                      : "Not started"}{" "}
                  · {done}/{o.activities.length} activities completed
                </span>
              </div>
              <Link
                className="secondary"
                to={`/chapters/${d.id}/sections/${o.id}/lesson?start=${o.id}`}
              >
                {done ? "Revisit" : "Start section"}
                <ArrowRight size={16} />
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="seed-note">
        <CircleHelp size={18} />
        <p>
          Completion tracks finished activities immediately. Mastery grows
          through independent recall and spaced reviews, so it can remain at 0%
          after a first pass. Both describe available lessons. This chapter
          covers {d.objectives.length} of {d.objectiveCount} exam objectives.
        </p>
      </div>
    </div>
  );
}
export function itemPath(d: Domain, item: SessionItem, start: string) {
  return `/chapters/${d.id}/sections/${item.objectiveId}/${item.kind === "lesson" ? "lesson" : `activities/${item.itemId}`}?start=${start}`;
}
