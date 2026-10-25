import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { domains, loadDomain } from "../content/load";
import type { Activity } from "../content/schema";

type ChoiceQuestion = Extract<Activity, { type: "multiple_choice" }>;
type Sample = {
  item: ChoiceQuestion;
  topic: string;
  lessonTitle: string;
  lessonPath: string;
};
const candidates = domains.flatMap((domain) =>
  domain.objectives.flatMap((objective) =>
    objective.activities
      .filter((item) => item.type === "multiple_choice")
      .map((item) => ({
        domainId: domain.id,
        topic: domain.title,
        objectiveId: objective.id,
        lessonTitle: objective.title,
        itemId: item.id,
      })),
  ),
);

export default function SampleQuestion() {
  const [sample, setSample] = useState<Sample | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [request, setRequest] = useState(0);
  const [previousId, setPreviousId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setSelected(null);
    const available = candidates.filter((item) => item.itemId !== previousId);
    const choice = available[Math.floor(Math.random() * available.length)];
    if (!choice) {
      setError(true);
      setLoading(false);
      return;
    }
    void loadDomain(choice.domainId)
      .then((domain) => {
        const item = domain.objectives
          .find((o) => o.id === choice.objectiveId)
          ?.activities.find((a) => a.id === choice.itemId);
        if (!active) return;
        if (!item || item.type !== "multiple_choice")
          throw new Error("Sample unavailable");
        setSample({
          item,
          topic: choice.topic,
          lessonTitle: choice.lessonTitle,
          lessonPath: `/chapters/${choice.domainId}/sections/${choice.objectiveId}/lesson?start=${choice.objectiveId}`,
        });
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [request, previousId]);

  const answer = sample?.item.options.find((option) => option.id === selected);
  const correct = selected === sample?.item.correct;
  function another() {
    setPreviousId(sample?.item.id ?? null);
    setRequest((n) => n + 1);
  }
  return (
    <section
      id="sample-question"
      className="sample-stage"
      aria-labelledby="sample-title"
    >
      <div className="sample-context">
        <span className="eyebrow">A QUESTION IS A GOOD PLACE TO START</span>
        <h2 id="sample-title">
          Try a little
          <br />
          IT thinking.
        </h2>
        <p>
          Get a feel for the way you’ll learn. Pick an answer, understand the
          reasoning, and try again when you need to.
        </p>
        <span className="sample-privacy">
          No score. No signup. Just a chance to learn.
        </span>
      </div>
      <div className="learning-preview random-preview" aria-busy={loading}>
        <div className="preview-heading">
          <span className="eyebrow">RANDOM SAMPLE QUESTION</span>
          <span className="sample-live-label">From the study library</span>
        </div>
        {loading ? (
          <div className="sample-loading" role="status">
            Finding a question for you…
          </div>
        ) : error || !sample ? (
          <div className="sample-loading">
            <p role="status">
              We couldn’t load a question. You can try again or explore the
              topics.
            </p>
            <button className="secondary" onClick={another}>
              Try again
            </button>
            <Link className="inline-link" to="/study">
              Explore study topics
            </Link>
          </div>
        ) : (
          <>
            <p className="sample-topic">{sample.topic}</p>
            <fieldset className="preview-options">
              <legend>{sample.item.prompt}</legend>
              {sample.item.options.map((option, index) => (
                <button
                  type="button"
                  key={option.id}
                  aria-pressed={selected === option.id}
                  onClick={() => setSelected(option.id)}
                >
                  <span className="preview-option-mark" aria-hidden="true">
                    {selected === option.id ? (
                      <Check size={16} />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </span>
                  {option.text}
                </button>
              ))}
            </fieldset>
            <div
              className="preview-feedback"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {answer ? (
                <>
                  <strong>
                    {correct
                      ? "That’s right. Here’s why."
                      : "Not quite. Let’s work through it."}
                  </strong>
                  <p>
                    {correct ? sample.item.explanation : answer.whyWrong}
                    {!correct && " Try another answer."}
                  </p>
                </>
              ) : (
                <p>
                  Choose an answer to see the explanation. Your study progress
                  won’t change.
                </p>
              )}
            </div>
            <div className="sample-actions">
              <button className="sample-refresh" onClick={another}>
                <RotateCcw size={15} aria-hidden="true" /> Try another question
              </button>
              <Link className="preview-lesson-link" to={sample.lessonPath}>
                Read the lesson <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
