import { validateDomains } from "../content/schema";
import { primeDomainCache } from "../content/load";
const modules = import.meta.glob("../../content/*/*/*.json", {
  eager: true,
  import: "default",
});
export const domains = validateDomains(
  Object.entries(modules)
    .filter(([p]) => p.endsWith("/domain.json"))
    .map(([p, meta]) => ({
      ...(meta as object),
      objectives: Object.entries(modules)
        .filter(([f]) => f.startsWith(p.replace("domain.json", "")) && f !== p)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([, o]) => o),
    })),
).sort((a, b) => a.exam.localeCompare(b.exam) || a.number - b.number);
primeDomainCache(domains);
