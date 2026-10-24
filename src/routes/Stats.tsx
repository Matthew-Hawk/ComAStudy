import { Link } from "react-router-dom";
import { domains } from "../content/load";
import { useStudy } from "../storage";
import { calculateStats } from "../engine/stats";
import { objectiveMastery } from "../engine/mastery";
import { SmallChart } from "../components/SmallChart";
import { MasteryRing, useNow } from "../components/LearningDashboard";
export default function Stats() {
  const progress = useStudy((s) => s.progress);
  const now = useNow();
  const stats = calculateStats(progress, domains, new Date(now));
  return (
    <div className="stats-page">
      <div className="eyebrow">YOUR LEARNING, IN CONTEXT</div>
      <h1>Learning stats</h1>
      <p>
        Completion records what you’ve finished. Mastery reflects independent
        recall over time. All figures describe the available seed content.
      </p>
      <dl className="stats-overview">
        {[
          ["Items seen", stats.itemsSeen],
          [
            "First-attempt accuracy",
            stats.hasAccuracy ? `${stats.accuracy}%` : "No answers yet",
          ],
          ["Total XP", stats.xp],
          ["Current streak", `${stats.currentStreak} days`],
          ["Longest streak", `${stats.bestStreak} days`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {!stats.itemsSeen && (
        <div className="empty-state">
          <h2>Your learning history starts here.</h2>
          <p>
            Read a lesson and finish an activity to begin building a picture of
            your progress.
          </p>
          <Link className="primary" to="/">
            Explore the library
          </Link>
        </div>
      )}
      <section>
        <h2>Mastery by chapter and section</h2>
        {domains.map((d) => {
          const counts = { Learning: 0, Familiar: 0, Mastered: 0 };
          d.objectives.forEach(
            (o) => counts[objectiveMastery(o, progress.schedules)]++,
          );
          return (
            <details className="mastery-details" key={d.id}>
              <summary>
                <MasteryRing domain={d} />
                <strong>{d.title}</strong>
                <span>
                  {counts.Learning} Learning · {counts.Familiar} Familiar ·{" "}
                  {counts.Mastered} Mastered
                </span>
              </summary>
              <ul>
                {d.objectives.map((o) => (
                  <li key={o.id}>
                    <Link to={`/chapters/${d.id}#${o.id}`}>
                      {o.number} · {o.title}
                    </Link>
                    <span>{objectiveMastery(o, progress.schedules)}</span>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </section>
      <section>
        <h2>Useful places to revisit</h2>
        {stats.weakest.length ? (
          <ul className="weakest-list">
            {stats.weakest.map((o) => (
              <li key={o.objectiveId}>
                <Link to={`/chapters/${o.domainId}#${o.objectiveId}`}>
                  {o.number} · {o.title}
                </Link>
                <span>
                  {Math.round(o.accuracy * 100)}% independent first-attempt
                  accuracy · {o.lapses} lapses
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Suggestions will appear after you’ve answered a few activities.</p>
        )}
      </section>
      <p className="helper">
        Daily completion history is collected from version 0.3 onward. Older
        progress is preserved, but earlier daily totals cannot be reconstructed.
      </p>
      <SmallChart
        title="Activity over the last 30 days"
        rows={stats.activity}
        unit="completions"
      />
      <SmallChart
        title="Review forecast for the next 7 days"
        rows={stats.forecast}
        unit="due items"
      />
      <section>
        <h2>Practice exam history</h2>
        {progress.examHistory.length ? (
          <>
            <SmallChart
              title="Recent practice scores"
              unit="percent"
              rows={progress.examHistory
                .slice(0, 10)
                .reverse()
                .map((e, i) => ({
                  day: `${new Date(e.date).toLocaleDateString()} #${i + 1}`,
                  value: e.score,
                }))}
            />
            {progress.examHistory.map((e) => (
              <details className="mastery-details" key={e.id}>
                <summary>
                  Core {e.exam === "220-1201" ? 1 : 2} ·{" "}
                  {new Date(e.date).toLocaleDateString()} · {e.correct}/
                  {e.length} correct ({e.score}%)
                </summary>
                <p>
                  Requested {e.requested} questions; bank supplied {e.length}.
                  Practice performance only.
                </p>
                <ul>
                  {e.domainScores.map((s) => (
                    <li key={s.domainId}>
                      {domains.find((d) => d.id === s.domainId)?.title}:{" "}
                      {s.correct}/{s.total} correct
                    </li>
                  ))}
                </ul>
                <Link className="secondary" to={`/exam/results/${e.id}`}>
                  Open practice results
                </Link>
              </details>
            ))}
          </>
        ) : (
          <p>
            No practice exam history yet.{" "}
            <Link className="inline-link" to="/exam">
              Try a practice exam
            </Link>{" "}
            when you’re ready.
          </p>
        )}
      </section>
    </div>
  );
}
