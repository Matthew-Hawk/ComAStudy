import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validateDomains } from "../src/content/schema";
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? files(join(dir, f.name))
      : f.name.endsWith(".json")
        ? [join(dir, f.name)]
        : [],
  );
}
const entries = files("content");
const domains = validateDomains(
  entries
    .filter((f) => f.endsWith("domain.json"))
    .map((path) => ({
      ...JSON.parse(readFileSync(path, "utf8")),
      objectives: entries
        .filter((p) => p.startsWith(path.slice(0, -11)) && p !== path)
        .map((p) => JSON.parse(readFileSync(p, "utf8"))),
    })),
);
console.log(
  `Validated ${domains.length} domains, ${domains.flatMap((d) => d.objectives).length} objectives, ${domains.flatMap((d) => d.objectives.flatMap((o) => o.activities)).length} activities. All visual IDs and lesson anchors resolve.`,
);
if (process.argv.includes("--coverage"))
  for (const d of domains) {
    console.log(
      `\n${d.exam} · ${d.title} · ${d.objectives.length}/${d.objectiveCount} objectives seeded`,
    );
    for (const o of d.objectives)
      console.log(
        `  ${o.number} ${o.title}: ${o.activities.length} items (${o.activities.map((a) => a.type).join(", ")})`,
      );
    const missing = Array.from(
      { length: d.objectiveCount },
      (_, i) => `${d.number}.${i + 1}`,
    ).filter((n) => !d.objectives.some((o) => o.number === n));
    if (missing.length)
      console.log(`  Not yet authored: ${missing.join(", ")}`);
  }
