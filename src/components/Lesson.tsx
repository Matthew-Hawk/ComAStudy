import type { Objective } from "../content/schema";
import { Visual } from "../visuals";
// Deliberately small markdown subset: paragraphs and inline emphasis. No raw HTML is executed.
function Markdown({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((p, i) => (
        <p key={i}>
          {p
            .split(/(\*\*.*?\*\*)/g)
            .map((part, j) =>
              part.startsWith("**") ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                part
              ),
            )}
        </p>
      ))}
    </>
  );
}
export function Lesson({
  objective,
  highlight,
  compact = false,
}: {
  objective: Objective;
  highlight?: string;
  compact?: boolean;
}) {
  return (
    <div className={`lesson ${compact ? "compact" : ""}`}>
      {!compact && objective.visual && <Visual id={objective.visual} />}
      <div className="prose">
        {objective.lesson.passages.map((p) => (
          <section
            key={p.id}
            id={p.id}
            className={highlight === p.id ? "highlighted" : ""}
          >
            {compact ? <h4>{p.heading}</h4> : <h2>{p.heading}</h2>}
            <Markdown text={p.markdown} />
          </section>
        ))}
      </div>
    </div>
  );
}
