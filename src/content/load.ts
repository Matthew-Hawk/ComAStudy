import catalog from "./catalog.generated.json";
import { domainSchema, type Domain } from "./schema";
import type { DomainIndex } from "./index-types";
export const domains: DomainIndex[] = catalog as DomainIndex[];
const modules = import.meta.glob("../../content/*/*/*.json", {
  import: "default",
});
const cache = new Map<string, Domain>();
const pending = new Map<string, Promise<Domain>>();
export function primeDomainCache(values: Domain[]) {
  values.forEach((d) => cache.set(d.id, d));
}
export const cachedDomain = (id: string | undefined) =>
  id ? cache.get(id) : undefined;
export function loadDomain(id: string): Promise<Domain> {
  const cached = cache.get(id);
  if (cached) return Promise.resolve(cached);
  const active = pending.get(id);
  if (active) return active;
  const meta = domains.find((d) => d.id === id);
  if (!meta) return Promise.reject(new Error("Unknown chapter."));
  const base = `../../content/${meta.exam}/${id}/`;
  const task = Promise.all(
    Object.entries(modules)
      .filter(
        ([path]) => path.startsWith(base) && !path.endsWith("domain.json"),
      )
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([, load]) => load()),
  )
    .then((objectives) => {
      const domain = domainSchema.parse({ ...meta, objectives });
      cache.set(id, domain);
      return domain;
    })
    .catch((error) => {
      pending.delete(id);
      throw error;
    });
  pending.set(id, task);
  return task;
}
export async function loadExam(exam: string) {
  return Promise.all(
    domains.filter((d) => d.exam === exam).map((d) => loadDomain(d.id)),
  );
}
