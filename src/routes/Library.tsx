import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Search,
} from "lucide-react";
import { domains } from "../content/load";
import { useStudy } from "../storage";
import { domainCompletion } from "../engine/completion";
import { LearningDashboard } from "../components/LearningDashboard";
import { DomainIcon } from "../components/ChapterBits";

const capabilities: Record<string, string> = {
  "mobile-devices":
    "Identify laptop components and choose the right device connections.",
  networking:
    "Connect common network services with the ports and protocols they use.",
  hardware: "Understand workstation components, storage, and their roles.",
  "virtualization-cloud":
    "Explain virtual machines and common cloud service models.",
  "hardware-troubleshooting":
    "Use symptoms and evidence to reason through hardware and drive problems.",
  "operating-systems":
    "Work with operating system tools and everyday support tasks.",
  security: "Recognize common threats and choose appropriate protections.",
  "software-troubleshooting":
    "Diagnose application and operating system problems.",
  "operational-procedures":
    "Follow safe support procedures and document your work clearly.",
};

export default function Library() {
  const [exam, setExam] = useState("220-1201");
  const [search, setSearch] = useState("");
  const { progress } = useStudy();
  const chapters = domains.filter(
    (d) =>
      d.exam === exam &&
      `${d.title} ${d.description} ${capabilities[d.id] ?? ""} ${d.objectives.map((o) => o.title).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const lessonCount = domains.reduce((sum, d) => sum + d.objectives.length, 0);
  return (
    <div className="home">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR IT LEARNING WORKSPACE</span>
          <h1>Choose a skill. Start building it.</h1>
          <p>Pick a topic below, or continue where you left off.</p>
        </div>
      </div>
      <LearningDashboard />
      <section id="chapters">
        <div className="section-heading">
          <div>
            <h2>What will you learn next?</h2>
            <p>
              {lessonCount} lessons across {domains.length} IT topics. Start
              with a skill you want to build.
            </p>
          </div>
          <label className="search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Find a topic or skill…"
              aria-label="Find a chapter"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="exam-tabs" aria-label="Choose exam">
          {["220-1201", "220-1202"].map((e, i) => (
            <button
              key={e}
              aria-pressed={exam === e}
              onClick={() => setExam(e)}
            >
              <strong>Core {i + 1}</strong>
              <span className="core-description">
                {i === 0
                  ? "Hardware & networks"
                  : "Systems, security & support"}
              </span>
              <span className="tab-count">{e}</span>
            </button>
          ))}
        </div>
        <div className="chapter-grid">
          {chapters.map((d) => {
            const completion = domainCompletion(d, progress);
            const started =
              completion.percent > 0 ||
              d.objectives.some(
                (o) =>
                  progress.lessons.includes(o.id) ||
                  o.activities.some((a) => progress.attempts[a.id]),
              );
            return (
              <Link
                to={`/chapters/${d.id}`}
                className="chapter-card"
                key={d.id}
              >
                <div className="card-top">
                  <span className="domain-icon">
                    <DomainIcon domain={d} />
                  </span>
                  <span className="domain-number">
                    CHAPTER {String(d.number).padStart(2, "0")}
                  </span>
                  <ArrowUpRight
                    className="card-arrow"
                    size={19}
                    aria-hidden="true"
                  />
                </div>
                <h3>{d.title}</h3>
                <p>{capabilities[d.id] ?? d.description}</p>
                {started && (
                  <div className="completion-summary">
                    <strong>{completion.percent}% complete</strong>
                    <span>Available lessons</span>
                  </div>
                )}
                <div className="card-bottom">
                  <span>{d.objectives.length} lessons · guided practice</span>
                  <span>
                    {completion.percent === 100 ? (
                      <>
                        <Check size={14} aria-hidden="true" /> Completed
                      </>
                    ) : (
                      <>
                        View lessons{" "}
                        <ChevronRight size={14} aria-hidden="true" />
                      </>
                    )}
                  </span>
                </div>
                {started && (
                  <div
                    className="card-progress"
                    role="progressbar"
                    aria-label={`${d.title} completion of available sections`}
                    aria-valuenow={completion.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${completion.percent}%` }} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
        {chapters.length === 0 && (
          <div className="empty-state">
            <Search size={24} aria-hidden="true" />
            <h3>No chapters found</h3>
            <p>Try a topic such as networking, hardware, or security.</p>
            <button className="secondary" onClick={() => setSearch("")}>
              Clear search
            </button>
          </div>
        )}
        <div className="seed-note">
          <CircleHelp size={17} aria-hidden="true" />
          <p>
            A growing library covering selected CompTIA A+ topics, not the full
            exam curriculum. Completion reflects the lessons available here; it
            does not establish exam or job readiness.{" "}
            <Link className="inline-link" to="/guide">
              How learning works
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
