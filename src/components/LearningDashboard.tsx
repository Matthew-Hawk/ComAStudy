import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, ArrowRight, CalendarCheck, Sparkles, X } from "lucide-react";
import { domains } from "../content/load";
import { useStudy } from "../storage";
import { buildDailyReview, buildChapterSession } from "../engine/session";
import { domainMastery } from "../engine/mastery";
import type { DomainIndex as Domain } from "../content/index-types";
export function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, []);
  return now;
}
export function MasteryRing({ domain }: { domain: Domain }) {
  const schedules = useStudy((s) => s.progress.schedules);
  const state = domainMastery(domain, schedules);
  return (
    <div className="mastery-meter">
      <span
        className="mastery-ring"
        role="img"
        aria-label={`${domain.title}: ${state.percent}% mastery across available sections`}
        style={{ "--progress": `${state.percent}%` } as React.CSSProperties}
      >
        <span>{state.percent}%</span>
      </span>
      <small>Mastery</small>
    </div>
  );
}
export function LearningDashboard() {
  const { progress } = useStudy();
  const now = useNow();
  const due = buildDailyReview(
    domains,
    progress.schedules,
    now,
    Number.MAX_SAFE_INTEGER,
  ).length;
  const pending = domains.filter((d) => {
    const position = progress.resume[d.id];
    return (
      position &&
      d.objectives.some((o) => o.id === position.start) &&
      buildChapterSession(d, position.start)[position.cursor]
    );
  });
  const d =
    pending.find((d) => d.id === progress.lastChapter) ??
    pending.sort(
      (a, b) =>
        (progress.resume[b.id].updatedAt ?? 0) -
        (progress.resume[a.id].updatedAt ?? 0),
    )[0];
  const resume = d && progress.resume[d.id];
  const session =
    d && resume && d.objectives.some((o) => o.id === resume.start)
      ? buildChapterSession(d, resume.start)
      : [];
  const item = resume && session[resume.cursor];
  const hasReview = due > 0 || (progress.review && !progress.review.completed);
  if (!item && !hasReview && progress.xp === 0 && progress.lessons.length === 0)
    return null;
  return (
    <section className="learning-dashboard" aria-label="Your learning today">
      {d && resume && item && (
        <Link
          className="resume-mini primary"
          to={`/chapters/${d.id}/sections/${item.objectiveId}/${item.kind === "lesson" ? "lesson" : `activities/${item.itemId}`}?start=${resume.start}`}
        >
          <span>RESUME CHAPTER</span>
          <strong>{d.title}</strong>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      )}
      {hasReview && (
        <div>
          <CalendarCheck size={19} aria-hidden="true" />
          <strong>{due} reviews due</strong>
          <Link className={item ? "secondary" : "primary"} to="/review">
            {progress.review && !progress.review.completed
              ? "Resume review"
              : "Start review"}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}
      {progress.xp > 0 && (
        <div>
          <Sparkles size={18} aria-hidden="true" />
          <strong>{progress.xp.toLocaleString()} XP</strong>
          <span>Earned through practice</span>
        </div>
      )}
      <div>
        <strong>Keep building your skills</strong>
        <Link className="inline-link" to="/stats">
          View your learning progress{" "}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export function RewardFeedback() {
  const { xpTick, notifications, dismissBadge, progress } = useStudy();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!xpTick) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [xpTick, progress.xp]);
  return (
    <div className="reward-feedback">
      {visible && (
        <div className="xp-tick" role="status">
          +{xpTick} XP
        </div>
      )}
      {notifications.slice(0, 2).map((b) => (
        <div className="badge-toast" role="status" key={b.id}>
          <Award size={21} />
          <div>
            <strong>{b.title}</strong>
            <p>{b.description}</p>
          </div>
          <button
            className="icon-button"
            aria-label={`Dismiss ${b.title}`}
            onClick={() => dismissBadge(b.id)}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
