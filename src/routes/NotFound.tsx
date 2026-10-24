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

export default function NotFound() {
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
