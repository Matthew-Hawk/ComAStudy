import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Cpu,
  Layers3,
  Monitor,
  Moon,
  Network,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sun,
  Wrench,
  X,
} from "lucide-react";
import { APP_NAME } from "./config";
import { domains } from "./content/load";
import type { Domain } from "./content/schema";
import { getAttempt, useStudy } from "./storage";
import { buildChapterSession, type SessionItem } from "./engine/session";
import { Activity } from "./components/Activity";
import { Lesson } from "./components/Lesson";
const icons = [
  Smartphone,
  Network,
  Cpu,
  Layers3,
  Wrench,
  Monitor,
  ShieldCheck,
  Wrench,
  BookOpen,
];
function DomainIcon({ domain, size = 23 }: { domain: Domain; size?: number }) {
  const Icon = icons[domains.indexOf(domain)] ?? BookOpen;
  return <Icon size={size} strokeWidth={1.6} />;
}
function completedSections(
  domain: Domain,
  attempts: ReturnType<typeof useStudy.getState>["progress"]["attempts"],
) {
  return domain.objectives.filter((o) =>
    o.activities.every((a) => attempts[a.id]?.completed),
  ).length;
}
function WorkspaceSketch() {
  return (
    <svg
      className="workspace-sketch"
      viewBox="0 0 370 220"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 43H350M20 87H350M20 131H350M20 175H350M53 15V205M97 15V205M141 15V205M185 15V205M229 15V205M273 15V205M317 15V205"
        stroke="currentColor"
        opacity=".09"
      />
      <path
        d="M85 158V65a9 9 0 0 1 9-9h170a9 9 0 0 1 9 9v93"
        fill="var(--hero)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="97"
        y="68"
        width="164"
        height="82"
        rx="3"
        stroke="currentColor"
        opacity=".5"
      />
      <path
        d="M65 159h229l-13 15H80l-15-15Z"
        fill="var(--hero)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M143 174h72" stroke="currentColor" strokeWidth="3" />
      <rect
        x="140"
        y="89"
        width="37"
        height="37"
        rx="6"
        stroke="currentColor"
      />
      <path
        d="m149 107 6 6 14-15M190 96h48M190 107h35M190 118h40"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="282"
        y="29"
        width="52"
        height="55"
        rx="8"
        fill="var(--surface)"
        stroke="currentColor"
      />
      <path
        d="M295 46h25M295 54h25M295 62h14M307 84v26h-34M50 106h24M50 106v33"
        stroke="currentColor"
        strokeDasharray="3 4"
      />
      <circle
        cx="50"
        cy="147"
        r="9"
        fill="var(--surface)"
        stroke="currentColor"
      />
      <path d="m46 147 3 3 5-6" stroke="currentColor" />
    </svg>
  );
}
function Layout() {
  const { progress, update, storageError } = useStudy();
  const location = useLocation();
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const change = () => setSystemDark(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const dark =
    progress.theme === "dark" || (progress.theme === "system" && systemDark);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.dataset.motion = String(progress.motion);
    document.title = APP_NAME + " · Your study workspace";
  }, [dark, progress.motion]);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label={`${APP_NAME} home`}>
          <span className="brand-mark">
            <Layers3 size={22} />
          </span>
          {APP_NAME}
          <span className="beta">BETA</span>
        </Link>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            <BookOpen size={19} /> Study library
          </NavLink>
          <NavLink to="/guide">
            <CircleHelp size={19} /> How it works
          </NavLink>
          <NavLink to="/settings">
            <Settings2 size={19} /> Preferences
          </NavLink>
        </nav>
        <div className="sidebar-course">
          <span className="eyebrow">THE LEARNING PATH</span>
          <h3>
            Small steps.
            <br />
            Solid understanding.
          </h3>
          <p>Read a little. Put it into practice. Make it stick.</p>
          <div className="tiny-path">
            <span>
              <Check size={12} />
            </span>
            <i />
            <span>2</span>
            <i />
            <span>3</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <span className="local-dot" /> Open access. Your own pace.
          <p>Progress saved on this device</p>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <span className="breadcrumb">
            Your workspace <ChevronRight size={14} />
            <strong>
              {location.pathname === "/"
                ? "Study library"
                : location.pathname === "/settings"
                  ? "Preferences"
                  : location.pathname === "/guide"
                    ? "How it works"
                    : "Chapter workspace"}
            </strong>
          </span>
          <button
            className="icon-button theme-button"
            aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
            onClick={() =>
              update((p) => ({ ...p, theme: dark ? "light" : "dark" }))
            }
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </header>
        <main id="main" ref={mainRef} tabIndex={-1}>
          {storageError && (
            <div className="feedback learning" role="status">
              This browser could not save progress. You can keep studying, but
              progress may be lost when this tab closes.
            </div>
          )}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chapters/:domainId" element={<Chapter />} />
            <Route
              path="/chapters/:domainId/sections/:objectiveId/lesson"
              element={<Flow />}
            />
            <Route
              path="/chapters/:domainId/sections/:objectiveId/activities/:itemId"
              element={<Flow />}
            />
            <Route path="/settings" element={<Preferences />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="page-footer">
          <span>Built for understanding, one concept at a time.</span>
          <span>Independent study material · Phase 1</span>
        </footer>
      </div>
    </>
  );
}
function Home() {
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
    .filter((o) =>
      o.activities.every((a) => progress.attempts[a.id]?.completed),
    ).length;
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
            const count = completedSections(d, progress.attempts);
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
                </div>
                <h3>{d.title}</h3>
                <p>{d.description}</p>
                <div className="card-bottom">
                  <span>
                    {d.objectives.length} seed sections{" "}
                    <span className="dot-separator">·</span> {d.weight}% of exam
                  </span>
                  <span>
                    {count === 2 ? (
                      <>
                        <Check size={14} />
                        Completed
                      </>
                    ) : count ? (
                      `${count}/2 completed`
                    ) : (
                      <>
                        Explore <ChevronRight size={14} />
                      </>
                    )}
                  </span>
                </div>
                <div className="card-progress">
                  <span style={{ width: `${(count / 2) * 100}%` }} />
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
function Chapter() {
  const { domainId } = useParams();
  const d = domains.find((d) => d.id === domainId);
  const { progress } = useStudy();
  if (!d) return <NotFound />;
  const resume = progress.resume[d.id];
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
        <span>{d.weight}% of exam</span>
        <span>{d.objectives.length} seed sections</span>
        <span>All sections unlocked</span>
      </div>
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
          const done = o.activities.filter(
            (a) => progress.attempts[a.id]?.completed,
          ).length;
          return (
            <li key={o.id}>
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
                  {done === o.activities.length
                    ? "Completed"
                    : done
                      ? "In progress"
                      : "Not started"}{" "}
                  · Lesson + {o.activities.length} activities
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
          Phase 1 shows completion only. Learning / Familiar / Mastered ratings
          arrive with spaced repetition in Phase 2. This chapter seeds{" "}
          {d.objectives.length} of {d.objectiveCount} exam objectives.
        </p>
      </div>
    </div>
  );
}
function itemPath(d: Domain, item: SessionItem, start: string) {
  return `/chapters/${d.id}/sections/${item.objectiveId}/${item.kind === "lesson" ? "lesson" : `activities/${item.itemId}`}?start=${start}`;
}
function Flow() {
  const { domainId, objectiveId, itemId } = useParams();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const { progress, update } = useStudy();
  const d = domains.find((d) => d.id === domainId);
  const o = d?.objectives.find((o) => o.id === objectiveId);
  const start = query.get("start") ?? objectiveId ?? "";
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
      }));
    const cursor = index + 1;
    update((p) => ({
      ...p,
      resume: { ...p.resume, [d!.id]: { start, cursor } },
    }));
    if (session[cursor]) navigate(itemPath(d!, session[cursor], start));
    else navigate(`/chapters/${d!.id}`);
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
              resume: { ...p.resume, [d.id]: { start, cursor: index } },
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
                update((p) => ({
                  ...p,
                  attempts: { ...p.attempts, [activity.id]: state },
                  resume: { ...p.resume, [d.id]: { start, cursor: index } },
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
function Preferences() {
  const { progress, update } = useStudy();
  return (
    <div className="narrow-page">
      <div className="eyebrow">MAKE ROOM FOR FOCUS</div>
      <h1>Your preferences</h1>
      <p>Make this workspace comfortable for you.</p>
      <section className="preference-card">
        <h2>Appearance</h2>
        <label htmlFor="theme">Theme</label>
        <select
          id="theme"
          value={progress.theme}
          onChange={(e) =>
            update((p) => ({ ...p, theme: e.target.value as typeof p.theme }))
          }
        >
          <option value="system">Match system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <label className="toggle-row">
          <span>
            <strong>Animated illustrations</strong>
            <small>
              Show gentle motion in lesson visuals. Your system’s reduced-motion
              preference always takes priority.
            </small>
          </span>
          <input
            type="checkbox"
            checked={progress.motion}
            onChange={(e) =>
              update((p) => ({ ...p, motion: e.target.checked }))
            }
          />
        </label>
      </section>
      <div className="seed-note">
        <CircleHelp size={17} />
        <p>
          Progress is stored in this browser behind a replaceable storage
          interface. Export/import and account sync are outside Phase 1. Sound
          is not used in this phase.
        </p>
      </div>
    </div>
  );
}
function Guide() {
  return (
    <div className="narrow-page">
      <div className="eyebrow">LEARN WITH UNDERSTANDING</div>
      <h1>A calmer way to study.</h1>
      <p>Every activity starts with an idea worth understanding.</p>
      {[
        [
          "01",
          "Start anywhere",
          "Open any chapter and choose a section. You’ll continue through the remaining sections in order. Nothing earlier is locked.",
        ],
        [
          "02",
          "Read, then practice",
          "Each short lesson leads into activities that help you explain and apply the concept. All six activity formats use the same supportive retry loop.",
        ],
        [
          "03",
          "Work it through",
          "A miss brings an explanation and a fresh arrangement. A second miss adds a hint and highlights the lesson. After three misses, a walkthrough helps you reason through the answer. Keep trying until it clicks.",
        ],
        [
          "04",
          "Come back when you’re ready",
          "Exit to the map whenever you need a break. Resume from your saved place on this device. First-attempt performance is recorded separately from eventual completion.",
        ],
      ].map(([n, title, body]) => (
        <section className="guide-step" key={n}>
          <span>{n}</span>
          <div>
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
        </section>
      ))}
      <Link to="/" className="primary">
        Open the study library <ArrowRight size={17} />
      </Link>
    </div>
  );
}
function NotFound() {
  return (
    <div className="empty-state">
      <h1>That page isn’t in the library.</h1>
      <p>
        The link may be incomplete. All chapters are available from the library.
      </p>
      <Link to="/" className="primary">
        Return to library
      </Link>
    </div>
  );
}
export default Layout;
