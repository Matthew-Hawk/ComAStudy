import { z } from "zod";
export const visualIds = [
  "network-packet-hop",
  "memory-board",
  "connector-sheet",
  "virtual-layers",
  "raid-mirror",
  "support-cycle",
] as const;
const text = z.string().trim().min(1);
const unique = (xs: string[]) => new Set(xs).size === xs.length;
const base = {
  id: text,
  explanation: text,
  walkthrough: text,
  lessonAnchor: text,
  visual: z.enum(visualIds).optional(),
};
const option = z.object({ id: text, text, whyWrong: text });
export const activitySchema = z
  .discriminatedUnion("type", [
    z.object({
      ...base,
      type: z.literal("flashcard"),
      front: text,
      back: text,
      tags: z.array(text).min(1),
      variants: z.array(text).optional(),
    }),
    z.object({
      ...base,
      type: z.literal("fill_in_blank"),
      prompt: text,
      accepted: z.array(text).min(1),
      regex: text.optional(),
      hint: text,
      variants: z.array(text).optional(),
    }),
    z.object({
      ...base,
      type: z.literal("multiple_choice"),
      prompt: text,
      options: z.array(option).min(2),
      correct: text,
    }),
    z.object({
      ...base,
      type: z.literal("drag_match"),
      prompt: text,
      pairs: z.array(z.object({ id: text, left: text, right: text })).min(2),
    }),
    z.object({
      ...base,
      type: z.literal("drag_sort"),
      prompt: text,
      categories: z.array(z.object({ id: text, label: text })).min(2),
      items: z.array(z.object({ id: text, text, category: text })).min(2),
    }),
    z.object({
      ...base,
      type: z.literal("drag_order"),
      prompt: text,
      steps: z.array(z.object({ id: text, text })).min(2),
    }),
  ])
  .superRefine((item, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (
      item.type === "multiple_choice" &&
      (!item.options.some((o) => o.id === item.correct) ||
        !unique(item.options.map((o) => o.id)))
    )
      fail("Correct option must exist and option IDs must be unique");
    if (item.type === "fill_in_blank") {
      if (
        ![item.prompt, ...(item.variants ?? [])].every(
          (p) => p.split("{{blank}}").length === 2,
        )
      )
        fail("Each prompt must contain exactly one {{blank}} marker");
      if (item.regex) {
        try {
          new RegExp(item.regex, "i");
        } catch {
          fail("Invalid answer regex");
        }
      }
    }
    if (
      item.type === "drag_match" &&
      (!unique(item.pairs.map((p) => p.id)) ||
        !unique(item.pairs.map((p) => p.right)))
    )
      fail("Match pairs need unique IDs and right labels");
    if (
      item.type === "drag_sort" &&
      (!unique(item.categories.map((c) => c.id)) ||
        !unique(item.items.map((i) => i.id)) ||
        item.items.some(
          (i) => !item.categories.some((c) => c.id === i.category),
        ))
    )
      fail("Sort items must refer to existing categories with unique IDs");
    if (item.type === "drag_order" && !unique(item.steps.map((s) => s.id)))
      fail("Step IDs must be unique");
  });
export const objectiveSchema = z
  .object({
    id: text,
    number: z.string().regex(/^\d+\.\d+$/),
    title: text,
    summary: text,
    lesson: z.object({
      title: text,
      passages: z
        .array(z.object({ id: text, heading: text, markdown: text }))
        .min(2),
    }),
    visual: z.enum(visualIds).optional(),
    activities: z.array(activitySchema).min(1),
  })
  .superRefine((o, ctx) => {
    const ids = o.lesson.passages.map((p) => p.id);
    if (!unique(ids))
      ctx.addIssue({ code: "custom", message: "Passage IDs must be unique" });
    for (const a of o.activities)
      if (!ids.includes(a.lessonAnchor))
        ctx.addIssue({
          code: "custom",
          message: `Missing lesson anchor: ${a.lessonAnchor}`,
        });
    const words = o.lesson.passages
      .map((p) => p.markdown)
      .join(" ")
      .split(/\s+/).length;
    if (words < 150 || words > 400)
      ctx.addIssue({
        code: "custom",
        message: `Lesson needs 150–400 words, found ${words}`,
      });
  });
export const domainSchema = z.object({
  id: text,
  exam: z.enum(["220-1201", "220-1202"]),
  number: z.number().int().positive(),
  title: text,
  description: text,
  weight: z.number().min(1).max(100),
  objectiveCount: z.number().int().positive(),
  objectives: z.array(objectiveSchema).min(2),
});
export type Activity = z.infer<typeof activitySchema>;
export type Objective = z.infer<typeof objectiveSchema>;
export type Domain = z.infer<typeof domainSchema>;
export function validateDomains(raw: unknown[]): Domain[] {
  const domains = raw.map((d) => domainSchema.parse(d));
  const all = domains.flatMap((d) => d.objectives);
  if (
    !unique(domains.map((d) => d.id)) ||
    !unique(all.map((o) => o.id)) ||
    !unique(all.flatMap((o) => o.activities.map((a) => a.id)))
  )
    throw new Error("Duplicate domain, objective, or activity ID");
  for (const d of domains) {
    if (
      !unique(d.objectives.map((o) => o.number)) ||
      d.objectives.some(
        (o) =>
          Number(o.number.split(".")[0]) !== d.number ||
          Number(o.number.split(".")[1]) > d.objectiveCount,
      )
    )
      throw new Error(`Invalid objective mapping in ${d.id}`);
  }
  for (const exam of ["220-1201", "220-1202"])
    if (
      domains
        .filter((d) => d.exam === exam)
        .reduce((n, d) => n + d.weight, 0) !== 100
    )
      throw new Error(`Domain weights for ${exam} must total 100`);
  return domains;
}
