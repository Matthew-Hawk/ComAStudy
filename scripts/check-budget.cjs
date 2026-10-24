const fs = require("fs"),
  path = require("path"),
  zlib = require("zlib");
const manifest = JSON.parse(
  fs.readFileSync("dist/.vite/manifest.json", "utf8"),
);
const entry = Object.values(manifest).find((v) => v.isEntry);
const visited = new Set();
function include(chunk) {
  if (!chunk || visited.has(chunk.file)) return;
  visited.add(chunk.file);
  for (const key of chunk.imports ?? []) include(manifest[key]);
}
include(entry);
let size = 0;
for (const file of visited)
  if (file.endsWith(".js"))
    size += zlib.gzipSync(fs.readFileSync(path.join("dist", file))).length;
const budget = 200 * 1024;
const report = {
  initialGzipBytes: size,
  budgetBytes: budget,
  initialFiles: [...visited],
  withinBudget: size <= budget,
};
fs.mkdirSync("tmp", { recursive: true });
fs.writeFileSync("tmp/bundle-budget.json", JSON.stringify(report, null, 2));
console.log(
  `Initial JS: ${(size / 1024).toFixed(1)} KiB gzip / 200 KiB budget (lazy routes, visuals and lesson chunks excluded).`,
);
if (size > budget)
  console.warn("WARNING: initial JavaScript exceeds the bundle budget.");
