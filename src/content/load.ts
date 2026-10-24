import { validateDomains } from "./schema";
const modules = import.meta.glob("../../content/*/*/*.json", {
  eager: true,
  import: "default",
});
export const domains = validateDomains(
  Object.entries(modules)
    .filter(([path]) => path.endsWith("/domain.json"))
    .map(([path, meta]) => ({
      ...(meta as object),
      objectives: Object.entries(modules)
        .filter(
          ([p]) => p.startsWith(path.replace("domain.json", "")) && p !== path,
        )
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([, o]) => o),
    })),
).sort((a, b) => a.exam.localeCompare(b.exam) || a.number - b.number);
