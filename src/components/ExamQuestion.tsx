import { useCallback } from "react";
import type { Activity } from "../content/schema";
import type { Answer } from "../engine/retry";
import { randomShuffle, randomSource } from "../engine/exam";
import { itemSeed } from "../engine/retry";
import { Placement } from "./Activity";
export default function ExamQuestion({
  item,
  answer,
  onChange,
  seed,
}: {
  item: Activity;
  answer: Answer | undefined;
  onChange: (a: Answer) => void;
  seed: number;
}) {
  const save = useCallback((value: Answer) => onChange(value), [onChange]);
  if (item.type === "flashcard") return null;
  return (
    <section className="exam-question">
      <h2>{item.prompt.replace("{{blank}}", "_____")}</h2>
      {item.type === "multiple_choice" ? (
        <fieldset className="choices">
          <legend className="sr-only">Choose an answer</legend>
          {randomShuffle(
            item.options,
            randomSource(seed + itemSeed(item.id)),
          ).map((option, i) => (
            <label
              key={option.id}
              className={`choice ${answer === option.id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name={item.id}
                checked={answer === option.id}
                onChange={() => onChange(option.id)}
              />
              <span className="option-letter">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
      ) : item.type === "fill_in_blank" ? (
        <label className="answer-label">
          Your answer
          <input
            autoComplete="off"
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      ) : (
        <Placement
          key={item.id}
          item={item}
          seed={seed + itemSeed(item.id)}
          initialAnswer={answer}
          deferInitialChange
          onChange={save}
        />
      )}
    </section>
  );
}
