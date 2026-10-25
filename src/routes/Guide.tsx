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

export default function Guide() {
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
      <Link to="/study" className="primary">
        Open the study library <ArrowRight size={17} />
      </Link>
    </div>
  );
}
