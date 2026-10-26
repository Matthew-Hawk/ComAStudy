import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Cpu,
  Database,
  Layers3,
  LockKeyhole,
  Network,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { domains } from "../content/load";
import SampleQuestion from "../components/SampleQuestion";
import "./neon-landing.css";

const layers = [
  "sheen",
  "sweep",
  "sweep-bloom",
  "shine corner-a",
  "shine corner-b",
  "glow corner-a",
  "glow corner-b",
  "glow-bright corner-a",
  "glow-bright corner-b",
];
function Glass({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`ng-glass ${className}`}
      style={{ "--fx-base": `${delay}s` } as CSSProperties}
    >
      {layers.map((layer, i) => (
        <span
          key={layer}
          aria-hidden="true"
          className={`ng-fx ng-${layer.replaceAll(" ", " ng-")}`}
          style={{ "--fx-d": `${i * 0.035}s` } as CSSProperties}
        />
      ))}
      <div className="ng-glass-content">{children}</div>
    </div>
  );
}
function Diagram({ kind }: { kind: number }) {
  // Stable, seeded point cloud: the illustration never changes on rerender.
  let seed = 47;
  const points = Array.from({ length: 32 }, () => {
    seed = (seed * 16807) % 2147483647;
    const x = 125 + (seed % 140);
    seed = (seed * 16807) % 2147483647;
    return [x, 18 + (seed % 88)];
  });
  return (
    <svg
      className="ng-diagram"
      viewBox="0 0 300 130"
      fill="none"
      aria-hidden="true"
    >
      {kind === 0 ? (
        <>
          <path
            d="M40 35H110L155 65H260M40 95H110L155 65"
            stroke="#3c78ca"
            strokeDasharray="3 5"
          />
          <rect x="22" y="20" width="40" height="30" rx="8" stroke="#699be9" />
          <rect x="22" y="80" width="40" height="30" rx="8" stroke="#699be9" />
          <rect
            x="195"
            y="45"
            width="66"
            height="40"
            rx="10"
            fill="#153970"
            stroke="#8ab8ff"
          />
          <text x="210" y="70" fill="#cfe3ff" fontSize="12">
            idea
          </text>
          <circle
            className="ng-flow-dot"
            r="3"
            cx="130"
            cy="48"
            fill="#a7ddff"
          />
          <circle r="3" cx="110" cy="95" fill="#669bff" />
        </>
      ) : kind === 1 ? (
        <>
          <rect x="35" y="17" width="65" height="95" rx="7" stroke="#6a9eea" />
          <path
            d="M49 39H85M49 52H85M49 65H75"
            stroke="#416caa"
            strokeWidth="3"
          />
          <path
            className="ng-scan"
            d="M25 80H110"
            stroke="#8ecfff"
            strokeWidth="2"
          />
          {points.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i % 3 === 0 ? 2 : 1}
              fill={i % 3 === 0 ? "#83b8ff" : "#34598d"}
            />
          ))}
        </>
      ) : (
        <>
          <rect
            x="30"
            y="14"
            width="240"
            height="101"
            rx="10"
            stroke="#30588f"
          />
          <path
            d="M48 38H118M48 60H175M48 82H145"
            stroke="#5a85c1"
            strokeWidth="3"
          />
          <circle cx="245" cy="37" r="5" stroke="#87b7ff" />
          <path d="M48 101H250" stroke="#152b4d" strokeWidth="3" />
          <path
            className="ng-progress-line"
            d="M48 101H218"
            stroke="#5a9bff"
            strokeWidth="3"
          />
        </>
      )}
    </svg>
  );
}
export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState(false);
  const navigate = useNavigate();
  const lessons = domains.reduce((n, d) => n + d.objectives.length, 0);
  const activities = domains.reduce(
    (n, d) => n + d.objectives.reduce((sum, o) => sum + o.activities.length, 0),
    0,
  );
  const matches = domains.filter((d) =>
    `${d.title} ${d.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    const elements = root.current?.querySelectorAll(".ng-reveal");
    if (!elements) return;
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="ng-page" data-paused={paused} ref={root}>
      <section className="ng-hero ng-reveal" aria-labelledby="landing-title">
        <span className="ng-pill">
          <span /> a little practice. a clearer picture.{" "}
          <ChevronRight size={13} />
        </span>
        <h1 id="landing-title">
          Understand the tech.
          <br />
          <span>Build the skill.</span>
        </h1>
        <p className="ng-lede">
          Your next step into IT, without the overwhelm.
          <br className="ng-desktop-break" /> Short lessons, guided practice,
          and the space to make it stick.
        </p>
        <div className="ng-actions">
          <Link className="ng-button" to="/study">
            Choose your study topics <ArrowRight size={16} />
          </Link>
          <a className="ng-text-link" href="#sample-question">
            Try a sample question <ArrowDown size={15} />
          </a>
        </div>
        <p className="ng-reassurance">
          <Check size={13} /> free to explore <span>·</span> no account needed{" "}
          <span>·</span> your own pace
        </p>
        <form
          className="ng-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (matches.length) navigate(`/chapters/${matches[0].id}`);
            else setSearchError(true);
          }}
        >
          <div className="ng-search-icons" aria-hidden="true">
            <Cpu />
            <Network />
            <ShieldCheck />
            <Wrench />
          </div>
          <Search className="ng-search-plus" size={20} aria-hidden="true" />
          <label className="sr-only" htmlFor="ng-topic">
            Find a study topic
          </label>
          <input
            id="ng-topic"
            required
            placeholder="what do you want to understand?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchError(false);
            }}
          />
          <button type="submit" aria-label="Open matching study topic">
            <ArrowRight size={19} />
          </button>
        </form>
        {query.trim() && (
          <div className="ng-search-results" aria-live="polite">
            {matches.length ? (
              matches.map((d) => (
                <Link key={d.id} to={`/chapters/${d.id}`}>
                  {d.title} <ChevronRight size={12} />
                </Link>
              ))
            ) : (
              <p>
                {searchError
                  ? "No matching topic. Try hardware, networking, or security."
                  : "No matching topics yet. Try networking or security."}
              </p>
            )}
          </div>
        )}
        <div
          className="ng-product"
          aria-label="The StudyBench learning approach"
        >
          <Glass className="ng-widget ng-widget-learn" delay={0.1}>
            <div className="ng-widget-label">
              <BookOpen size={15} /> 01 / understand <span>lesson preview</span>
            </div>
            <div className="ng-chip-art">
              <div className="ng-chip">
                <Cpu size={40} strokeWidth={1} />
              </div>
              <span className="ng-orbit-line" />
            </div>
            <h3>
              Small part.
              <br />
              Bigger understanding.
            </h3>
            <p>Connect the component to the job it does.</p>
            <Link to="/chapters/hardware">
              explore hardware <ArrowRight size={13} />
            </Link>
          </Glass>
          <Glass className="ng-widget ng-widget-focus" delay={0.25}>
            <div className="ng-widget-label">
              <Sparkles size={15} /> a moment of clarity
            </div>
            <div className="ng-orb" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <i />
              <b />
              <em />
            </div>
            <h3>
              Less guessing.
              <br />
              <span>More “I get it.”</span>
            </h3>
            <p>Learn the reasoning behind the answer.</p>
            <a href="#sample-question">
              try guided practice <ArrowRight size={13} />
            </a>
          </Glass>
          <Glass className="ng-widget ng-widget-review" delay={0.4}>
            <div className="ng-widget-label">
              <RotateCcw size={15} /> 03 / remember{" "}
              <span>the learning loop</span>
            </div>
            <div className="ng-review-list">
              {[
                ["Learn the idea", "build a foundation"],
                ["Practice the skill", "get feedback that helps"],
                ["Return for review", "strengthen your recall"],
              ].map(([title, desc], i) => (
                <div key={title}>
                  <span className="ng-check">
                    {i < 2 ? <Check size={13} /> : <RotateCcw size={13} />}
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </div>
                  {i === 2 && <span className="ng-mini-pill">repeat</span>}
                </div>
              ))}
            </div>
            <h3>
              Make room
              <br />
              for what sticks.
            </h3>
            <p>Spaced review brings ideas back over time.</p>
            <Link to="/guide">
              see how learning works <ArrowRight size={13} />
            </Link>
          </Glass>
        </div>
        <button
          className="ng-motion-toggle"
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "resume visual effects" : "pause visual effects"}
        </button>
        <div className="ng-topics">
          <span>real foundations. useful every day.</span>
          <div>
            <span>
              <Cpu /> hardware
            </span>
            <span>
              <Network /> networking
            </span>
            <span>
              <ShieldCheck /> security
            </span>
            <span>
              <Wrench /> troubleshooting
            </span>
          </div>
        </div>
      </section>
      <section
        className="ng-section ng-reveal"
        id="features"
        aria-labelledby="ng-features-title"
      >
        <div className="ng-section-intro">
          <span className="ng-kicker">
            built for the way understanding happens
          </span>
          <h2 id="ng-features-title">
            A study session.
            <br />
            <span>Not a guessing game.</span>
          </h2>
          <p>Start small. Find the why. Leave with something you can use.</p>
        </div>
        <div className="ng-feature-grid">
          {[
            [
              BookOpen,
              "Understand before you answer.",
              "Short lessons connect technical ideas to everyday IT support.",
            ],
            [
              Layers3,
              "More than multiple choice.",
              "Recall, matching, sorting, and sequencing give you different ways to practice.",
            ],
            [
              RotateCcw,
              "A wrong answer is a starting point.",
              "Explanations and another try help you work through the reasoning.",
            ],
            [
              ShieldCheck,
              "Your progress stays yours.",
              "No account or cloud sync. Your learning progress is saved in this browser.",
            ],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof BookOpen;
            return (
              <article key={String(title)}>
                <I size={22} strokeWidth={1.5} />
                <h3>{String(title)}</h3>
                <p>{String(copy)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section
        className="ng-section ng-reveal"
        id="how-it-works"
        aria-labelledby="ng-how-title"
      >
        <div className="ng-section-intro">
          <span className="ng-kicker">a clear path forward</span>
          <h2 id="ng-how-title">
            One concept.
            <br />
            <span>Three ways to make it yours.</span>
          </h2>
        </div>
        <div className="ng-step-grid">
          {[
            [
              "01",
              "learn",
              "Start with the idea.",
              "Pick a topic and read a short lesson. Get the context before the question.",
            ],
            [
              "02",
              "practice",
              "Work through the why.",
              "Put the idea to work. Get an explanation, useful help, and another try.",
            ],
            [
              "03",
              "review",
              "Come back stronger.",
              "Revisit ideas with spaced review. Keep building on what you remember.",
            ],
          ].map(([n, label, title, copy], i) => (
            <Glass key={n} delay={i * 0.15}>
              <div className="ng-step-top">
                <span>{n}</span>
                <span>{label}</span>
              </div>
              <Diagram kind={i} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </Glass>
          ))}
        </div>
      </section>
      <div className="ng-reveal">
        <SampleQuestion />
      </div>
      <section
        className="ng-stats ng-reveal"
        aria-label="Available study content"
      >
        <div>
          <strong>{domains.length}</strong>
          <span>study domains</span>
        </div>
        <div>
          <strong>{lessons}</strong>
          <span>available lessons</span>
        </div>
        <div>
          <strong>{activities}</strong>
          <span>practice activities</span>
        </div>
        <div>
          <strong>0</strong>
          <span>accounts required</span>
        </div>
        <p>
          A growing collection of selected CompTIA A+ topics. Available content
          does not cover the full exam curriculum.
        </p>
      </section>
      <section
        className="ng-section ng-local ng-reveal"
        aria-labelledby="ng-local-title"
      >
        <div>
          <span className="ng-kicker">your browser. your workbench.</span>
          <h2 id="ng-local-title">
            Pick up where
            <br />
            <span>you left off.</span>
          </h2>
          <p>
            Your lessons, review schedule, and practice history stay in this
            browser. Export your progress in preferences to keep a copy or move
            it to another device.
          </p>
          <Link className="ng-text-link" to="/settings">
            manage your preferences <ArrowRight size={15} />
          </Link>
        </div>
        <Glass className="ng-code">
          <div className="ng-code-title">
            <Terminal size={15} />
            <span>Local storage overview</span>
            <span className="ng-code-dots">● ● ●</span>
          </div>
          <div className="ng-local-log">
            <p>
              <Check /> lessons & practice <span>on-device</span>
            </p>
            <p>
              <Check /> review schedule <span>on-device</span>
            </p>
            <p>
              <Check /> exam history <span>on-device</span>
            </p>
            <p>
              <Database /> progress export{" "}
              <Link to="/settings">available ↗</Link>
            </p>
            <div>
              <LockKeyhole size={13} /> No progress uploaded. No account
              required.
            </div>
          </div>
        </Glass>
      </section>
      <section
        className="ng-access ng-section ng-reveal"
        id="access"
        aria-labelledby="ng-access-title"
      >
        <div className="ng-section-intro">
          <span className="ng-kicker">less friction. more learning.</span>
          <h2 id="ng-access-title">
            A place to start.
            <br />
            <span>Free to make it yours.</span>
          </h2>
        </div>
        <Glass>
          <div className="ng-free-plan">
            <div>
              <span className="ng-pill">open access</span>
              <h3>
                $0<span> / no subscription</span>
              </h3>
              <p>Explore every available study topic.</p>
            </div>
            <ul>
              {[
                "Short lessons & guided practice",
                "Spaced review & saved progress",
                "Practice exams & learning stats",
                "Progress export & import",
              ].map((t) => (
                <li key={t}>
                  <Check size={15} />
                  {t}
                </li>
              ))}
            </ul>
            <Link className="ng-button" to="/study">
              open your workbench <ArrowRight size={16} />
            </Link>
          </div>
        </Glass>
      </section>
      <section
        className="ng-faq ng-section ng-reveal"
        aria-labelledby="ng-faq-title"
      >
        <div>
          <span className="ng-kicker">a few things to know</span>
          <h2 id="ng-faq-title">
            Good questions.
            <br />
            <span>Clear answers.</span>
          </h2>
        </div>
        <div>
          {[
            [
              "Do I need an account?",
              "No. StudyBench works in your browser without signing up. Progress is saved on this browser and device.",
            ],
            [
              "Does this cover the whole A+ curriculum?",
              "Not yet. This is a growing collection of selected topics for 220-1201 and 220-1202. Practice performance does not establish exam or job readiness. StudyBench is independent and is not affiliated with or endorsed by CompTIA.",
            ],
            [
              "Can I move my progress to another device?",
              "Yes. Export a JSON backup from Preferences, then import it in StudyBench on the other device. Browser cleanup or private browsing can affect saved progress, so keep a backup.",
            ],
            [
              "What happens when I get an answer wrong?",
              "During guided practice, you get feedback that explains the concept, with more help and another try. Practice exams hold feedback until you explicitly submit.",
            ],
            [
              "Does it work offline?",
              "There is no offline guarantee. Lessons load when you open them, so you need a connection to load the app and content.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="ng-closing ng-reveal">
        <div className="ng-closing-icon">
          <Layers3 size={30} strokeWidth={1.3} />
        </div>
        <span className="ng-kicker">start with what makes you curious</span>
        <h2>
          Your next skill is
          <br />
          <span>a topic away.</span>
        </h2>
        <p>No big leap. Just your next small step.</p>
        <Link className="ng-button" to="/study">
          explore the study library <ArrowRight size={16} />
        </Link>
        <a className="ng-back-top" href="#landing-title">
          back to the beginning ↑
        </a>
      </section>
    </div>
  );
}
