import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Search,
} from "lucide-react";
import { domains } from "../content/load";
import { useStudy } from "../storage";
import { domainCompletion } from "../engine/completion";
import { LearningDashboard } from "../components/LearningDashboard";
import { DomainIcon } from "../components/ChapterBits";
import sampleLesson from "../../content/220-1201/mobile-devices/1.1.json";

const firstLesson =
  "/chapters/mobile-devices/sections/220-1201-1.1/lesson?start=220-1201-1.1";
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

function LearningPreview() {
  const [selected, setSelected] = useState<string | null>(null);
  const question = sampleLesson.activities.find(
    (item) => item.type === "multiple_choice",
  )!;
  const option = question.options!.find((item) => item.id === selected);
  const correct = selected === question.correct;
  return (
    <section className="learning-preview" aria-labelledby="preview-title">
      <div className="preview-heading">
        <span className="eyebrow">TRY A PRACTICE QUESTION</span>
        <BookOpen size={18} aria-hidden="true" />
      </div>
      <h2 id="preview-title">A small step toward understanding.</h2>
      <fieldset className="preview-options">
        <legend>{question.prompt}</legend>
        {question.options!.map((answer) => (
          <button
            type="button"
            key={answer.id}
            aria-pressed={selected === answer.id}
            onClick={() => setSelected(answer.id)}
          >
            <span className="preview-option-mark" aria-hidden="true">
              {selected === answer.id ? (
                <Check size={15} />
              ) : (
                answer.id.toUpperCase()
              )}
            </span>
            {answer.text}
          </button>
        ))}
      </fieldset>
      <div
        className="preview-feedback"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {option ? (
          <>
            <strong>
              {correct
                ? "That’s right. RAM holds active work."
                : "Not quite. Here’s the difference."}
            </strong>
            <p>
              {correct
                ? "An SSD keeps files after shutdown. RAM holds the data running applications are using right now."
                : option.whyWrong}{" "}
              {!correct && "Try another answer."}
            </p>
          </>
        ) : (
          <p>
            Choose an answer to see the explanation. This preview won’t change
            your progress.
          </p>
        )}
      </div>
      <Link className="preview-lesson-link" to={firstLesson}>
        Learn how laptop components work{" "}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </section>
  );
}

export default function Home() {
  const [exam, setExam] = useState("220-1201");
  const [search, setSearch] = useState("");
  const { progress } = useStudy();
  const returning =
    progress.lessons.length > 0 ||
    progress.xp > 0 ||
    Object.keys(progress.resume).length > 0;
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
      <LearningDashboard />
      <div className="learning-intro">
        <section className="learning-promise" aria-labelledby="home-title">
          <span className="eyebrow">IT SKILLS, BUILT THROUGH PRACTICE</span>
          <h1 id="home-title">Build the IT skills to solve real problems.</h1>
          <p>
            Learn hardware, networking, operating systems, security, and
            troubleshooting through short lessons, guided practice, and spaced
            review.
          </p>
          <p className="curriculum-note">
            IT support fundamentals, organized around CompTIA A+.
          </p>
          <div className="intro-actions">
            <Link
              className={returning ? "secondary" : "primary"}
              to={firstLesson}
            >
              {returning
                ? "Revisit the first lesson"
                : "Start your first lesson"}{" "}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <a className="browse-link" href="#chapters">
              Browse IT topics <ChevronRight size={16} aria-hidden="true" />
            </a>
          </div>
          <p className="first-lesson-note">
            Start with laptop components: what RAM, storage, and batteries do.
          </p>
          <ul className="intro-reassurance" aria-label="Learning access">
            <li>
              <CheckCircle2 size={15} aria-hidden="true" /> Free to explore
            </li>
            <li>No account needed</li>
            <li>Progress saved in this browser</li>
          </ul>
        </section>
        <LearningPreview />
      </div>
      <section
        className="learning-method"
        aria-label="How you build your skills"
      >
        <div>
          <span>01</span>
          <div>
            <h2>Understand the idea</h2>
            <p>Read a short lesson grounded in everyday IT support.</p>
          </div>
        </div>
        <div>
          <span>02</span>
          <div>
            <h2>Put it into practice</h2>
            <p>Answer questions and learn from clear explanations.</p>
          </div>
        </div>
        <div>
          <span>03</span>
          <div>
            <h2>Remember what you learn</h2>
            <p>Return for spaced review as your knowledge grows.</p>
          </div>
        </div>
      </section>
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
