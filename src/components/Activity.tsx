import { Children, useEffect, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Check,
  Lightbulb,
  BookOpen,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import type { Activity as Item, Objective } from "../content/schema";
import {
  attempt,
  assistance,
  isCorrect,
  itemSeed,
  shuffled,
  variantPrompt,
  type Answer,
  type AttemptState,
} from "../engine/retry";
import { Visual } from "../visuals";
import { Lesson } from "./Lesson";
function Token({
  id,
  children,
  selected,
  onSelect,
}: {
  id: string;
  children: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });
  return (
    <div
      className={`token ${selected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0)`
          : undefined,
      }}
      ref={setNodeRef}
    >
      <button
        type="button"
        className="drag-handle"
        aria-label={`Drag ${
          Children.toArray(children)
            .filter((c) => typeof c === "string")
            .join("") || "item"
        }`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={17} />
      </button>
      <button type="button" aria-pressed={selected} onClick={onSelect}>
        {children}
      </button>
    </div>
  );
}
function Target({
  id,
  label,
  children,
  onPlace,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  onPlace: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`drop-target ${isOver ? "over" : ""}`}>
      <button
        type="button"
        className="target-label"
        onClick={onPlace}
        aria-label={`Place selected item in ${label}`}
      >
        {label}
        <span>Place here ↓</span>
      </button>
      {children}
    </div>
  );
}
function Placement({
  item,
  seed,
  onChange,
}: {
  item: Extract<Item, { type: "drag_match" | "drag_sort" | "drag_order" }>;
  seed: number;
  onChange: (a: Answer) => void;
}) {
  const [selected, select] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[]>(
    item.type === "drag_order"
      ? shuffled(
          item.steps.map((s) => s.id),
          seed + 1,
        )
      : [],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor),
  );
  useEffect(() => {
    onChange(item.type === "drag_order" ? order : placed);
  }, [order, placed, item.type, onChange]);
  const tokens =
    item.type === "drag_order"
      ? item.steps
      : item.type === "drag_match"
        ? item.pairs.map((p) => ({ id: p.id, text: p.left }))
        : item.items;
  const targets =
    item.type === "drag_order"
      ? []
      : item.type === "drag_match"
        ? item.pairs.map((p) => ({ id: p.id, label: p.right }))
        : item.categories;
  function place(token: string | null, target: string) {
    if (!token) return;
    if (item.type === "drag_order") {
      setOrder((previous) => {
        if (token === target) return previous;
        const next = previous.filter((s) => s !== token);
        next.splice(next.indexOf(target), 0, token);
        return next;
      });
    } else
      setPlaced((previous) => {
        const next = { ...previous };
        if (item.type === "drag_match")
          for (const [id, p] of Object.entries(next))
            if (p === target) delete next[id];
        next[token] = target;
        return next;
      });
    select(null);
  }
  return (
    <DndContext
      sensors={sensors}
      onDragEnd={(e) => e.over && place(String(e.active.id), String(e.over.id))}
    >
      <p className="helper">
        Drag the handles, or select an item and then a destination. Use the
        arrow buttons to reorder steps.
      </p>
      {item.type === "drag_order" ? (
        <ol className="order-list">
          {order.map((id, i) => (
            <OrderRow
              key={id}
              id={id}
              index={i}
              text={tokens.find((t) => t.id === id)!.text}
              selected={selected === id}
              select={() => select(id)}
              place={() => place(selected, id)}
              move={(delta) =>
                setOrder((previous) => {
                  const next = [...previous];
                  [next[i], next[i + delta]] = [next[i + delta], next[i]];
                  return next;
                })
              }
              last={i === order.length - 1}
            />
          ))}
        </ol>
      ) : (
        <div className="placement">
          <div className="token-bank">
            {shuffled(tokens, seed).map((t) => (
              <Token
                key={t.id}
                id={t.id}
                selected={selected === t.id}
                onSelect={() => select(t.id)}
              >
                {t.text}
                {placed[t.id]
                  ? ` → ${targets.find((g) => g.id === placed[t.id])?.label}`
                  : ""}
              </Token>
            ))}
          </div>
          <div className="target-bank">
            {shuffled(targets, seed + 1).map((t) => (
              <Target
                key={t.id}
                id={t.id}
                label={t.label}
                onPlace={() => place(selected, t.id)}
              >
                <span>
                  {Object.entries(placed)
                    .filter(([, target]) => target === t.id)
                    .map(([id]) => tokens.find((t) => t.id === id)?.text)
                    .join(", ") || "No items placed"}
                </span>
              </Target>
            ))}
          </div>
        </div>
      )}
      <p role="status" className="helper">
        {selected
          ? `Selected: ${tokens.find((t) => t.id === selected)?.text}. Choose a destination.`
          : item.type === "drag_order"
            ? "Steps are shown from first to last."
            : `${Object.keys(placed).length} of ${tokens.length} placed`}
      </p>
    </DndContext>
  );
}
function OrderRow({
  id,
  index,
  text,
  selected,
  select,
  place,
  move,
  last,
}: {
  id: string;
  index: number;
  text: string;
  selected: boolean;
  select: () => void;
  place: () => void;
  move: (n: number) => void;
  last: boolean;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <li ref={setNodeRef}>
      <span className="step-number">{index + 1}</span>
      <Token id={id} selected={selected} onSelect={select}>
        {text}
      </Token>
      <button
        className="icon-button"
        type="button"
        onClick={() => move(-1)}
        disabled={index === 0}
        aria-label={`Move ${text} up`}
      >
        <ArrowUp size={17} />
      </button>
      <button
        className="icon-button"
        type="button"
        onClick={() => move(1)}
        disabled={last}
        aria-label={`Move ${text} down`}
      >
        <ArrowDown size={17} />
      </button>
      <button type="button" className="place-before" onClick={place}>
        Place before
      </button>
    </li>
  );
}
export function Activity({
  item,
  objective,
  state,
  onAttempt,
  onNext,
}: {
  item: Item;
  objective: Objective;
  state: AttemptState;
  onAttempt: (s: AttemptState) => void;
  onNext: () => void;
}) {
  const [answer, setAnswer] = useState<Answer>("");
  const [revealed, reveal] = useState(false);
  const [review, setReview] = useState(false);
  const [wrong, setWrong] = useState("");
  const [showRetry, setRetry] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (showRetry || state.completed) feedbackRef.current?.focus();
  }, [showRetry, state.completed]);
  const help = assistance(state.misses);
  const arrangement = itemSeed(item.id) + state.misses;
  const prompt =
    item.type === "flashcard"
      ? [
          item.front,
          ...(item.variants ?? [`Explain in your own words: ${item.front}`]),
        ][state.misses % (1 + (item.variants?.length ?? 1))]
      : item.type === "fill_in_blank"
        ? variantPrompt(item, state.misses)
        : item.prompt;
  function submit(value: Answer = answer) {
    if (state.completed || showRetry) return;
    const correct = isCorrect(item, value);
    const next = attempt(state, correct);
    if (!correct) {
      const context =
        item.type === "drag_match"
          ? "At least one pairing connects different functions. "
          : item.type === "drag_sort"
            ? "At least one item is grouped under the wrong type. "
            : item.type === "drag_order"
              ? "The steps do not follow their dependency order yet. "
              : "";
      setWrong(
        item.type === "multiple_choice"
          ? (item.options.find((o) => o.id === value)?.whyWrong ??
              item.explanation)
          : context + item.explanation,
      );
      setRetry(true);
    }
    onAttempt(next);
  }
  function retry() {
    setRetry(false);
    setAnswer("");
    reveal(false);
    headingRef.current?.focus();
  }
  const label = item.type.replaceAll("_", " ");
  return (
    <section className="activity-panel" aria-label="Practice activity">
      <div className="eyebrow">PRACTICE · {label}</div>
      <h2 ref={headingRef} tabIndex={-1}>
        {prompt.replace("{{blank}}", "_____")}
      </h2>
      {item.visual && <Visual id={item.visual} />}
      {!showRetry && !state.completed && (
        <div key={state.misses}>
          {item.type === "multiple_choice" && (
            <fieldset className="choices">
              <legend className="sr-only">Choose an answer</legend>
              {shuffled(item.options, arrangement).map((o, i) => (
                <label
                  className={`choice ${answer === o.id ? "selected" : ""}`}
                  key={o.id}
                >
                  <input
                    type="radio"
                    name={item.id}
                    checked={answer === o.id}
                    onChange={() => setAnswer(o.id)}
                  />
                  <span className="option-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{o.text}</span>
                </label>
              ))}
            </fieldset>
          )}
          {item.type === "fill_in_blank" && (
            <label className="answer-label">
              Your answer
              <input
                autoComplete="off"
                value={typeof answer === "string" ? answer : ""}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && String(answer).trim()) submit();
                }}
                placeholder="Type the missing term"
              />
            </label>
          )}
          {item.type === "flashcard" && (
            <div className="flashcard">
              <p>Recall the answer before turning the card.</p>
              {revealed ? (
                <>
                  <div className="card-answer">{item.back}</div>
                  <div className="button-row">
                    <button
                      className="secondary"
                      onClick={() => submit("unknown")}
                    >
                      Still learning
                    </button>
                    <button className="primary" onClick={() => submit("known")}>
                      I knew this <Check size={17} />
                    </button>
                  </div>
                </>
              ) : (
                <button className="secondary" onClick={() => reveal(true)}>
                  Turn card
                </button>
              )}
            </div>
          )}
          {(item.type === "drag_match" ||
            item.type === "drag_sort" ||
            item.type === "drag_order") && (
            <Placement item={item} seed={arrangement} onChange={setAnswer} />
          )}
          {item.type !== "flashcard" && (
            <button
              className="primary check-answer"
              disabled={
                typeof answer === "string"
                  ? !answer.trim()
                  : Array.isArray(answer)
                    ? answer.length === 0
                    : Object.keys(answer).length === 0
              }
              onClick={() => submit()}
            >
              Check answer <Check size={17} />
            </button>
          )}
        </div>
      )}
      <div ref={feedbackRef} tabIndex={-1} role="status" aria-live="polite">
        {showRetry && (
          <div className="feedback learning">
            <div className="feedback-title">
              <Lightbulb size={20} />{" "}
              {item.type === "flashcard"
                ? "A little more practice"
                : "Let’s look at the idea again"}
            </div>
            <p>{wrong}</p>
            {help.hint && (
              <p>
                <strong>Hint:</strong>{" "}
                {item.type === "fill_in_blank"
                  ? item.hint
                  : "Identify the purpose of each choice and compare it to the requirement. The relevant lesson passage is highlighted below."}
              </p>
            )}
            {help.walkthrough && (
              <div className="walkthrough">
                <strong>A worked walkthrough</strong>
                <p>{item.walkthrough}</p>
              </div>
            )}
            <div className="button-row">
              <button className="primary" onClick={retry}>
                Try a fresh version <RotateCcw size={16} />
              </button>
              <button className="secondary" onClick={() => setReview(!review)}>
                <BookOpen size={16} /> Review lesson
              </button>
            </div>
          </div>
        )}
        {state.completed && (
          <div className="feedback success">
            <div className="feedback-title">
              <Check size={21} />{" "}
              {state.misses ? "You worked it through" : "That’s right"}
            </div>
            <p>
              {item.type === "multiple_choice"
                ? item.options.find((o) => o.id === item.correct)?.text
                : item.type === "flashcard"
                  ? item.back
                  : "You connected the concept to the answer."}
            </p>
            <p className="helper">
              {state.misses
                ? "Understanding takes practice. Your progress is saved."
                : "Your progress is saved. Keep going when you’re ready."}
            </p>
            <button className="primary" onClick={onNext}>
              Continue →
            </button>
          </div>
        )}
      </div>
      {(review || (help.highlight && showRetry)) && (
        <aside className="lesson-review">
          <h3>
            <BookOpen size={18} /> Review lesson
          </h3>
          <Lesson
            objective={objective}
            highlight={help.highlight ? item.lessonAnchor : undefined}
            compact
          />
        </aside>
      )}
    </section>
  );
}
