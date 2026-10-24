const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const base = process.env.AUDIT_URL || "http://127.0.0.1:5173";
async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const failures = [];
  page.on("pageerror", (e) => failures.push(e.message));
  const paths = [
    "/",
    "/chapters/mobile-devices",
    "/chapters/mobile-devices/sections/220-1201-1.1/lesson",
    "/chapters/mobile-devices/sections/220-1201-1.1/activities/220-1201-1.1-check",
    "/review",
    "/exam",
    "/stats",
    "/settings",
    "/guide",
    "/missing",
  ];
  const results = [];
  fs.mkdirSync("tmp/audit", { recursive: true });
  const progress = {
    schemaVersion: 3,
    revision: 1,
    attempts: {},
    lessons: ["220-1201-1.1"],
    resume: {},
    theme: "light",
    motion: false,
    schedules: {},
    objectives: {},
    xp: 0,
    streak: {
      lastDay: null,
      current: 0,
      best: 0,
      freezeWeeks: [],
      frozenDays: [],
    },
    badges: [],
    review: null,
    lastChapter: null,
    sound: false,
    animationMode: "off",
    reviewLength: 12,
    examTimerDefault: false,
    activityDays: {},
    examSession: null,
    examHistory: [],
  };
  await page.addInitScript((p) => {
    if (!localStorage.getItem("studybench.progress.v2"))
      localStorage.setItem("studybench.progress.v2", JSON.stringify(p));
  }, progress);
  async function check(theme, route) {
    await page.addStyleTag({
      content:
        "*,*::before,*::after{transition:none!important;animation:none!important}",
    });
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
    }, theme);
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const audit = await page.evaluate(() =>
      axe.run(document.body, {
        runOnly: {
          type: "tag",
          values: [
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
            "wcag22a",
            "wcag22aa",
          ],
        },
      }),
    );
    const violations = audit.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
    }));
    results.push({
      theme,
      route,
      violations,
      incomplete: audit.incomplete.map((v) => v.id),
    });
  }
  for (const theme of ["light", "dark"])
    for (const route of paths) {
      await page.goto(base + route);
      await page.waitForSelector("h1");
      await check(theme, route);
    }
  await page.goto(base + "/exam");
  await page
    .getByRole("button", { name: "Start practice exam", exact: true })
    .click();
  await page.getByRole("heading", { name: /Question 1 of/ }).waitFor();
  for (const theme of ["light", "dark"]) await check(theme, "/exam [active]");
  await page.getByRole("button", { name: "Review all questions" }).click();
  for (const theme of ["light", "dark"])
    await check(theme, "/exam [answer review]");
  await page
    .getByRole("button", { name: "Submit practice exam", exact: true })
    .click();
  for (const theme of ["light", "dark"])
    await check(theme, "/exam [confirmation]");
  await page.getByRole("button", { name: "Confirm submission" }).click();
  await page.getByRole("heading", { name: "Your practice results" }).waitFor();
  for (const theme of ["light", "dark"])
    await check(theme, "/exam/results [submitted]");
  await page
    .getByRole("button", { name: "Review missed question" })
    .first()
    .click();
  for (const theme of ["light", "dark"])
    await check(theme, "/exam/results [missed review]");
  await page.goto(base + "/");
  await page.waitForSelector("h1");
  const layout = [];
  for (const width of [320, 640, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    layout.push({
      width,
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      offenders: await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .map((e) => ({
            tag: e.tagName,
            cls: e.className,
            right: e.getBoundingClientRect().right,
          }))
          .slice(0, 10),
      ),
    });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => (document.documentElement.style.zoom = "2"));
  layout.push({
    width: 1280,
    zoom: "CSS 200%",
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  });
  await page.evaluate(() => (document.documentElement.style.zoom = "1"));
  await page.setViewportSize({ width: 320, height: 900 });
  await page.screenshot({ path: "tmp/audit/home-320.png", fullPage: true });
  for (const route of paths) {
    await page.goto(base + route);
    await page.waitForSelector("h1");
    for (const width of [320, 640]) {
      await page.setViewportSize({ width, height: 900 });
      layout.push({
        route,
        width,
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      });
    }
  }
  const report = { results, layout, runtimeErrors: failures };
  fs.writeFileSync(
    "tmp/audit/browser-audit.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        screens: results.length,
        seriousCritical: results
          .flatMap((r) => r.violations)
          .filter((v) => ["serious", "critical"].includes(v.impact)).length,
        violations: results.filter((r) => r.violations.length),
        layout,
        runtimeErrors: failures,
      },
      null,
      2,
    ),
  );
  await browser.close();
  if (
    failures.length ||
    layout.some((r) => r.overflow) ||
    results.some((r) =>
      r.violations.some((v) => ["serious", "critical"].includes(v.impact)),
    )
  )
    process.exitCode = 1;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
