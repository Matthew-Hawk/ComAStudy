import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { validateDomains } from "../src/content/schema";
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? files(join(dir, f.name)) : [join(dir, f.name)],
  );
const paths = files("content").filter((p) => p.endsWith(".json"));
const domains = validateDomains(
  paths
    .filter((p) => p.endsWith("domain.json"))
    .map((p) => ({
      ...JSON.parse(readFileSync(p, "utf8")),
      objectives: paths
        .filter((f) => f.startsWith(p.slice(0, -11)) && f !== p)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((f) => JSON.parse(readFileSync(f, "utf8"))),
    })),
);
const catalog = domains
  .map((d) => ({
    ...d,
    objectives: d.objectives.map(
      ({ id, number, title, summary, visual, activities }) => ({
        id,
        number,
        title,
        summary,
        visual,
        activities: activities.map(({ id, type }) => ({ id, type })),
      }),
    ),
  }))
  .sort((a, b) => a.exam.localeCompare(b.exam) || a.number - b.number);
writeFileSync(
  "src/content/catalog.generated.json",
  JSON.stringify(catalog, null, 2) + "\n",
);
console.log("Generated the lightweight content catalog.");
