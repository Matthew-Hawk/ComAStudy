import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Cpu,
  Network,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import SampleQuestion from "../components/SampleQuestion";
import { domains } from "../content/load";

export default function Landing() {
  const lessons = domains.reduce((n, d) => n + d.objectives.length, 0);
  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <span className="eyebrow">
            <span className="local-dot" /> YOUR NEXT STEP INTO IT
          </span>
          <h1 id="landing-title">
            Understand the tech.
            <br />
            <span>Build the skill.</span>
          </h1>
          <p className="landing-lede">
            StudyBench is a free study workspace for building IT support skills.
            Understand devices and networks, practice troubleshooting, and learn
            the reasoning behind the answer.
          </p>
          <div className="intro-actions">
            <Link className="primary landing-cta" to="/study">
              Choose your study topics{" "}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a className="browse-link" href="#sample-question">
              Try a sample question <ArrowDown size={15} aria-hidden="true" />
            </a>
          </div>
          <ul className="intro-reassurance" aria-label="Learning access">
            <li>
              <CheckCircle2 size={15} aria-hidden="true" /> Free to explore
            </li>
            <li>No account needed</li>
            <li>Learn at your pace</li>
          </ul>
        </div>
        <div
          className="landing-workbench"
          aria-label="An example of the learning journey"
        >
          <div className="workbench-caption">
            <span>THE STUDYBENCH APPROACH</span>
            <span>A CLEAR PATH</span>
          </div>
          <div className="workbench-object">
            <Cpu size={70} strokeWidth={1.25} aria-hidden="true" />
            <div>
              <span className="eyebrow">THE COMPONENT</span>
              <strong>
                Small part.
                <br />
                Bigger understanding.
              </strong>
            </div>
          </div>
          <div className="workbench-path">
            <span className="workbench-number">01</span>
            <div>
              <strong>Learn what it does.</strong>
              <p>Connect an idea to a real IT task.</p>
            </div>
            <BookOpen size={20} aria-hidden="true" />
          </div>
          <div className="workbench-path">
            <span className="workbench-number">02</span>
            <div>
              <strong>Think it through.</strong>
              <p>Practice with feedback that explains why.</p>
            </div>
            <Check size={20} aria-hidden="true" />
          </div>
          <div className="workbench-path">
            <span className="workbench-number">03</span>
            <div>
              <strong>Make it stick.</strong>
              <p>Revisit what you’ve learned over time.</p>
            </div>
            <RotateCcw size={19} aria-hidden="true" />
          </div>
          <span className="workbench-footnote">
            Less guessing. More understanding.
          </span>
        </div>
      </section>
      <section
        className="landing-topics"
        aria-label="IT skills you can explore"
      >
        <p>
          REAL FOUNDATIONS.
          <br />
          <strong>USEFUL EVERY DAY.</strong>
        </p>
        <span>
          <Cpu size={19} aria-hidden="true" /> Hardware
        </span>
        <span>
          <Network size={19} aria-hidden="true" /> Networking
        </span>
        <span>
          <ShieldCheck size={19} aria-hidden="true" /> Security
        </span>
        <span>
          <Wrench size={19} aria-hidden="true" /> Troubleshooting
        </span>
      </section>
      <section
        id="how-it-works"
        className="landing-how"
        aria-labelledby="how-title"
      >
        <div className="landing-section-heading">
          <span className="eyebrow">HOW IT WORKS</span>
          <h2 id="how-title">
            One concept.
            <br />
            Three ways to make it yours.
          </h2>
          <p>
            You don’t need to know everything before you begin. Pick a topic and
            build your understanding one lesson at a time.
          </p>
        </div>
        <ol className="landing-steps">
          <li>
            <span className="step-index">01 / LEARN</span>
            <BookOpen size={25} strokeWidth={1.6} aria-hidden="true" />
            <h3>Start with the idea.</h3>
            <p>
              Short lessons explain the concept and connect it to everyday IT
              support. Build a foundation before testing yourself.
            </p>
          </li>
          <li>
            <span className="step-index">02 / PRACTICE</span>
            <CheckCircle2 size={25} strokeWidth={1.6} aria-hidden="true" />
            <h3>Work through the why.</h3>
            <p>
              Put your knowledge to use with questions, matching, and recall. A
              wrong answer brings an explanation, then another try.
            </p>
          </li>
          <li>
            <span className="step-index">03 / REVIEW</span>
            <RotateCcw size={25} strokeWidth={1.6} aria-hidden="true" />
            <h3>Come back stronger.</h3>
            <p>
              Spaced review helps you revisit what you’ve learned. Your place
              and progress stay saved in this browser.
            </p>
          </li>
        </ol>
      </section>
      <SampleQuestion />
      <section className="landing-next" aria-labelledby="next-title">
        <div>
          <span className="eyebrow">START WITH WHAT MAKES YOU CURIOUS</span>
          <h2 id="next-title">
            Your next skill is
            <br />a topic away.
          </h2>
        </div>
        <div>
          <p>
            Explore {domains.length} IT topics and {lessons} available lessons,
            organized around CompTIA A+. Choose a starting point and make it
            your own.
          </p>
          <Link className="landing-next-link" to="/study">
            Explore the study library{" "}
            <ArrowRight size={22} aria-hidden="true" />
          </Link>
          <small>
            A growing collection covering selected A+ topics, not the full exam
            curriculum. Practice progress does not establish exam or job
            readiness.
          </small>
        </div>
      </section>
    </div>
  );
}
