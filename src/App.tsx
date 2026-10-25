import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  BookOpen,
  Check,
  CheckCircle2,
  CircleHelp,
  Layers3,
  Moon,
  Sun,
  Settings2,
  ChevronRight,
  ClipboardList,
  ChartNoAxesColumn,
} from "lucide-react";
import { APP_NAME } from "./config";
import { useStudy } from "./storage";
import { RewardFeedback } from "./components/LearningDashboard";
const testRoutes =
  import.meta.env.MODE === "test"
    ? import.meta.glob("./routes/*.tsx", { eager: true })
    : {};
const routeModules = import.meta.glob("./routes/*.tsx");
function view(name: string) {
  return import.meta.env.MODE === "test"
    ? (
        testRoutes["./routes/" + name + ".tsx"] as {
          default: React.ComponentType;
        }
      ).default
    : lazy(
        () =>
          routeModules["./routes/" + name + ".tsx"]() as Promise<{
            default: React.ComponentType;
          }>,
      );
}
const Home = view("Library"),
  Chapter = view("Chapter"),
  Flow = view("Flow"),
  Preferences = view("Preferences"),
  Guide = view("Guide"),
  NotFound = view("NotFound"),
  Exam = view("Exam"),
  Stats = view("Stats"),
  DailyReview = view("Review");
export default function Layout() {
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
    const root = document.documentElement;
    root.classList.add("theme-changing");
    root.dataset.theme = dark ? "dark" : "light";
    void root.offsetHeight;
    const frame = requestAnimationFrame(() =>
      root.classList.remove("theme-changing"),
    );
    document.documentElement.dataset.motion = String(
      progress.motion && progress.animationMode === "on",
    );
    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove("theme-changing");
    };
  }, [dark, progress.motion, progress.animationMode]);
  const pageName =
    location.pathname === "/"
      ? "Study library"
      : location.pathname.startsWith("/exam/results")
        ? "Practice results"
        : location.pathname.startsWith("/exam")
          ? "Practice exam"
          : location.pathname === "/stats"
            ? "Learning stats"
            : location.pathname === "/review"
              ? "Daily review"
              : location.pathname === "/settings"
                ? "Preferences"
                : location.pathname === "/guide"
                  ? "How it works"
                  : "Chapter workspace";
  useEffect(() => {
    document.title = `${pageName} · ${APP_NAME}`;
  }, [pageName]);
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
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Layers3 size={22} />
          </span>
          {APP_NAME}
          <span className="beta">BETA</span>
          <span className="sr-only"> home</span>
        </Link>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            <BookOpen size={19} /> Study library
          </NavLink>
          <NavLink to="/guide">
            <CircleHelp size={19} /> How it works
          </NavLink>
          <NavLink to="/review">
            <CheckCircle2 size={19} /> Daily review
          </NavLink>
          <NavLink to="/settings">
            <Settings2 size={19} /> Preferences
          </NavLink>
          <NavLink to="/exam">
            <ClipboardList size={19} /> Practice exam
          </NavLink>
          <NavLink to="/stats">
            <ChartNoAxesColumn size={19} /> Learning stats
          </NavLink>
        </nav>
        <div className="sidebar-course">
          <span className="eyebrow">THE LEARNING PATH</span>
          <p className="sidebar-motto">
            Learn the idea.
            <br />
            Practice the skill.
          </p>
          <p>Short lessons. Guided practice. Spaced review.</p>
          <div className="learning-stages">
            <span>Learn</span>
            <ChevronRight size={12} aria-hidden="true" />
            <span>Practice</span>
            <ChevronRight size={12} aria-hidden="true" />
            <span>Review</span>
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
            <strong>{pageName}</strong>
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
          <Suspense fallback={<div role="status">Loading workspace…</div>}>
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
              <Route path="/review" element={<DailyReview />} />
              <Route path="/exam" element={<Exam />} />
              <Route path="/exam/results/:resultId" element={<Exam />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="page-footer">
          <span>Built for understanding, one concept at a time.</span>
          <span>Independent CompTIA A+ study material</span>
        </footer>
      </div>
      <RewardFeedback />
    </>
  );
}
