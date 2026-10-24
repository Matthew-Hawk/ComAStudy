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

export default function Home() {
  const [exam, setExam] = useState("220-1201");
  const [search, setSearch] = useState("");
  const { progress } = useStudy();
  const chapters = domains.filter(
    (d) =>
      d.exam === exam &&
      `${d.title} ${d.description} ${d.objectives.map((o) => o.title).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const total = domains
    .flatMap((d) => d.objectives)
    .filter((o) => objectiveCompletion(o, progress).finished).length;
  return (
    <div className="home">
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE PROGRESS, EVERY DAY</div>
          <h1>Your next chapter starts here.</h1>
          <p>Build the knowledge. Practice the skills. Find your confidence.</p>
        </div>
        <span className="open-label">
          <span className="local-dot" /> No account needed
        </span>
      </div>
      <LearningDashboard />
      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="pill">YOUR IT STUDY WORKSPACE</span>
          <h2>
            Understand it.
            <br />
            Then make it stick.
          </h2>
          <p>
            Short lessons and hands-on practice for Core 1 and Core 2. Start
            anywhere. Keep learning at your pace.
          </p>
          <a href="#chapters" className="primary">
            Explore chapters <ArrowRight size={17} />
          </a>
        </div>
        <WorkspaceSketch />
      </section>
      <div className="library-meta">
        <span>
          <BookOpen size={17} />
          <strong>9 chapters</strong> across two exams
        </span>
        <span>
          <CheckCircle2 size={17} />
          <strong>{total} of 18</strong> seed sections completed
        </span>
        <Link to="/guide">
          A calmer way to study <ArrowUpRight size={15} />
        </Link>
      </div>
      <section id="chapters">
        <div className="section-heading">
          <div>
            <h2>The study library</h2>
            <p>Pick a chapter. Every section is open to you.</p>
          </div>
          <label className="search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Find a chapter…"
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
              Core {i + 1} <span>{e}</span>
              <span className="tab-count">{i === 0 ? 5 : 4} chapters</span>
            </button>
          ))}
        </div>
        <div className="chapter-grid">
          {chapters.map((d) => {
            const completion = domainCompletion(d, progress);
            const count = completion.completedSections;
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
                  <ArrowUpRight className="card-arrow" size={19} />
                  <MasteryRing domain={d} />
                </div>
                <h3>{d.title}</h3>
                <p>{d.description}</p>
                <div className="completion-summary">
                  <strong>{completion.percent}% complete</strong>
                  <span>Available seed content</span>
                </div>
                <div className="card-bottom">
                  <span>
                    {d.objectives.length} seed sections{" "}
                    <span className="dot-separator">·</span> {d.weight}% of exam
                  </span>
                  <span>
                    {count === d.objectives.length ? (
                      <>
                        <Check size={14} />
                        Completed
                      </>
                    ) : count ? (
                      `${count}/${d.objectives.length} completed`
                    ) : (
                      <>
                        Explore <ChevronRight size={14} />
                      </>
                    )}
                  </span>
                </div>
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
              </Link>
            );
          })}
        </div>
        {chapters.length === 0 && (
          <div className="empty-state">
            <Search size={24} />
            <h3>No chapters found</h3>
            <p>Try a topic such as networking, hardware, or security.</p>
            <button className="secondary" onClick={() => setSearch("")}>
              Clear search
            </button>
          </div>
        )}
        <div className="seed-note">
          <CircleHelp size={17} />
          <p>
            This is a growing library. Each chapter includes two original seed
            sections; the full exam curriculum will be added over time.
          </p>
        </div>
      </section>
    </div>
  );
}
