# StudyBench

A browser-only learning workspace for CompTIA A+ 220-1201 and 220-1202. Read short lessons, complete activities through a must-get-it-right loop, and return for spaced review. Practice exams defer all feedback until explicit submission. Results describe practice performance and never predict certification outcomes.

Content is original and independent, not affiliated with or endorsed by CompTIA. The current bank has **9 domains, 18 seed objectives, and 57 activities**. It does not cover every objective. Missing objectives are not merged into other sections. Completion percentages refer to available content; mastery reflects recall over time. See [content sources](docs/content-sources.md).

## Run, test, and build

Use Node 24 and npm. No account, secret, or backend is needed.

```sh
npm ci
npm run dev
npm test
npm run test:a11y
npm run validate:content
npm run coverage:content
npm run build
npm run preview
```

Build validates content, regenerates the catalog, checks TypeScript, emits `dist/`, and checks the initial JavaScript budget of 200 KiB gzip. The budget excludes lazy chunks; its inputs are recorded in `tmp/bundle-budget.json`. Routes, visuals, and lesson content load on demand, with content cached in memory. No service worker was added; there is no offline guarantee.

Vitest, Testing Library, and axe-core cover engine logic, persistence, interaction, and semantics. jsdom cannot measure contrast, so contrast is checked separately in Chromium. For that audit, make Playwright available to Node, set `CHROME_PATH` to a Chromium browser executable, run the app, and execute `node scripts/browser-audit.cjs`. Set `AUDIT_URL` to audit preview instead of the default `http://127.0.0.1:5173`. The script uses an isolated profile with synthetic progress and writes ignored `tmp/audit/` artifacts. Playwright is external audit tooling, not an app dependency. Phase 3 adds only `axe-core` as a development dependency; charts use inline SVG and tables.

See [accessibility report](docs/accessibility.md) and [performance report](docs/performance.md) for measurements and verification limits.

## Behavior and settings

The public landing page is `/`. It introduces the learning method and offers a random multiple-choice question from the authored library. Sample answers and retries do not update learning progress. “Try another question” chooses a different available question; content loads on demand with a retry path on failure. The main call to action opens `/study`, the topic-selection workspace with saved progress. Chapter, review, and exam exit links return to that workspace, while the brand link returns to the landing page. Deployments must serve the SPA fallback for `/study` as well as existing deep routes.

- Six activity types, changed retry forms, escalating help, linked lesson passages, and keyboard/tap alternatives to dragging.
- SM-2-style scheduling, derived mastery, completion tracking, daily review, XP, local-calendar streaks with a weekly freeze, and quiet badge notifications.
- Practice exams with saved answers/flags, answer review, explicit submission, per-domain results, and missed-question review through the regular learning loop.
- Stats for unique items seen, independent first-attempt accuracy, mastery, weakest objectives, 30-day completions, 7-day forecast, and exam history/trend.
- System/light/dark themes; on/reduced/off animations; opt-in sound; review lengths 8/12/16/20; timer default off; JSON export/import; typed RESET with export offered first.

Short/Medium/Full request 15/45/90 questions. The current eligible seed bank caps exams at 22 for Core 1 and 17 for Core 2. Flashcards are excluded. Largest-remainder allocation follows official PDF weights, redistributing unavailable quotas; the UI explains bank limitations. Timer elapsed time includes time away from the tab and never auto-submits. Submitted unanswered questions are misses/lapses. Each correct submitted answer earns XP once; missed-question practice is a separate review. Exams do not impose streak penalties. Daily completion dates begin with v0.3; older dates cannot be reconstructed from prior stored data.

## Static deployment

Install with `npm ci`, build with `npm run build`, publish **dist** over HTTPS. This app uses BrowserRouter: hard refreshes of `/stats`, `/exam`, and chapter paths must serve `index.html`, while actual assets remain directly accessible.

- **Cloudflare Pages:** connect the repository and use those build/output settings. Do not add a top-level `404.html`; Pages supplies an automatic SPA fallback when it is absent. See [serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/). No Worker is required.
- **Vercel:** select Vite and add root `vercel.json`: `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`. See [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).
- **Netlify:** publish `dist`; before building add `public/_redirects` containing `/* /index.html 200`. Real files retain precedence. See [SPA rewrites](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).
- **GitHub Pages:** use GitHub Actions to install, build, and upload `dist`. For project hosting set Vite `base` in `vite.config.ts` to `'/ComAStudy/'`; BrowserRouter reads `import.meta.env.BASE_URL` for its basename. Custom-domain/root hosting uses `'/'`. Pages cannot provide a configurable 200 SPA rewrite. Copy `dist/index.html` to `dist/404.html` after building so deep URLs boot the app (the HTTP status remains 404). Keep this Pages-only artifact out of Cloudflare deployments. See [Vite deployment instructions](https://vite.dev/guide/static-deploy).

After deployment, refresh a lesson and `/exam` directly, check asset responses, and close/reopen after answering. Avoid caching HTML indefinitely across deployments with changing asset hashes.

Progress belongs to a browser origin. Localhost, preview URLs, production URLs, and custom domains have separate progress. Export/import to transfer it. No progress is uploaded. Browser cleanup/private browsing/denied storage can affect persistence; a save warning appears when saving fails.

## Structure and architecture

```text
content/<exam>/<domain>/domain.json       domain metadata
content/<exam>/<domain>/<number>.json     objective, lesson, activities
scripts/                                validation, catalog, budget, browser audit
src/content/schema.ts                   Zod content and integrity rules
src/content/catalog.generated.json      lightweight generated metadata (commit it)
src/content/load.ts                     cached dynamic domain/exam loading
src/engine/                             pure grading, retry, sessions, scheduling,
                                        mastery, rewards, exam, stats
src/storage.ts                          application actions and persistence boundary
src/persistence/repository.ts           ProgressStorage and browser adapters
src/persistence/model.ts                schema, migration, recovery, JSON exchange
src/routes/                             lazy route components
src/components/                         activity controls, lessons, charts, dashboard
src/visuals/registry.ts                  visual ID to lazy component
src/visuals.tsx                         shared SVG, caption, pause/static wrapper
src/learning-config.ts                  scheduling/mastery/XP thresholds
src/exam-config.ts                      exam lengths and PDF-sourced weights
```

React, TypeScript, Vite, React Router, Zustand, Zod, Tailwind/custom CSS, Lucide, and dnd-kit power the app. Framer Motion remains an existing dependency. Engines accept data/date/seed inputs; they do not read browser storage. UI calls `useStudy` actions, never storage backends directly.

`ProgressStorage` exposes `read`, `save`, and `flush`. The application store's `replace` action uses that interface for validated imports and reset. `createStudyStore` accepts an implementation for tests or a future sync backend. IndexedDB is primary, with a synchronous localStorage journal covering tab closure before asynchronous writes finish and a localStorage fallback when IndexedDB is unavailable. The historical `studybench.progress.v2` key is deliberately retained to find existing installs. Schema v3 migrates old data; corrupted stored slices recover independently. Imports reject malformed or newer-version files atomically. Reset replaces only app records and never calls `localStorage.clear()`.

Accounts/sync would plug in behind `ProgressStorage`, with authentication and conflict handling designed separately. No accounts or sync exist today.

## Content-authoring guide

Edit JSON directly. Do not rerun the seed generator on edited content: it overwrites seeded files. Stable IDs connect stored progress and history; avoid renaming published IDs.

### Domain schema

`domain.json` has all fields below. Objective files sit beside it and are joined by the loader.

```json
{
  "id": "mobile-devices",
  "exam": "220-1201",
  "number": 1,
  "title": "Mobile Devices",
  "description": "Portable hardware and support.",
  "weight": 13,
  "objectiveCount": 3
}
```

`id`, `title`, and `description` are nonempty strings. `exam` is `220-1201` or `220-1202`; `number` is a positive integer; `weight` is 1–100 and domain weights for each exam must sum to 100. `objectiveCount` is the official objective count, not the authored count. At least two objective files per domain are required. Domain/objective/activity IDs must be globally unique.

### Objective and lesson schema

Every objective file requires `id`, `number`, `title`, `summary`, `lesson`, and nonempty `activities`; `visual` is optional. `number` is a string such as `"1.3"`, matching its domain and within `objectiveCount`. `lesson` requires `title` and at least two `passages`; each passage requires a unique nonempty `id`, `heading`, and `markdown`. Lesson prose totals **150–400 words**. The renderer supports paragraph breaks and `**emphasis**`, not arbitrary Markdown or HTML.

```text
{ id: string, number: string, title: string, summary: string, visual?: VisualId,
  lesson: { title: string, passages: [{ id: string, heading: string, markdown: string }, ...] },
  activities: [Activity, ...] }
```

See any existing objective JSON for a complete lesson envelope. The following six examples are complete activities; their containing lesson must have a passage ID `concept`.

### Common fields, help, and style

Every activity requires nonempty `id`, `type`, `explanation`, `walkthrough`, and `lessonAnchor`. Optional `visual` must be registered. Text is trimmed and nonempty.

- `explanation` teaches **why** the concept applies after an error, rather than repeating the answer.
- `walkthrough` shows the worked reasoning process, revealed after repeated misses.
- `hint` is required for blank items only. Guide recall without just revealing the answer. Other types use linked lesson help.
- `lessonAnchor` exactly matches a passage ID in the same objective; it powers highlighted help.
- Optional `variants` apply only to flashcard fronts and blank prompts. Keep the concept and accepted answers consistent. Every blank variant needs exactly one `{{blank}}`. Omitted variants receive fresh wording from the retry engine. MC/drag retries change option/target/step order.
- Use original wording, plain language, one concept per item, plausible distractors with specific reasons, and no dependency on color alone. Never copy real exam questions or imply endorsement.

### Flashcard

`front`, `back`: strings. `tags`: at least one string. Optional `variants`: nonempty strings. Known/unknown drives the learning loop; flashcards are excluded from exams.

```json
{
  "id": "sample-memory-card",
  "type": "flashcard",
  "front": "What memory holds a computer's active work?",
  "back": "RAM holds active work and loses its contents without power.",
  "tags": ["memory"],
  "variants": ["Name a computer's volatile working memory."],
  "explanation": "RAM is working memory; an SSD retains files after shutdown.",
  "walkthrough": "Separate active work from retained files. Active work needs working memory, which is RAM.",
  "lessonAnchor": "concept"
}
```

### Fill in the blank

`prompt` contains exactly one `{{blank}}`; `accepted` has at least one string, normalized for case/spacing; `hint` is required. Optional `regex` must be a valid case-insensitive JavaScript regex string; anchor with `^` and `$` to avoid substring matches. Optional `variants` obey the same marker rule and share accepted answers.

```json
{
  "id": "sample-memory-blank",
  "type": "fill_in_blank",
  "prompt": "The volatile working memory in a laptop is {{blank}}.",
  "accepted": ["RAM", "random access memory"],
  "regex": "^(ram|random access memory)$",
  "hint": "Its contents are lost when power is removed.",
  "variants": ["A computer holds active programs temporarily in {{blank}}."],
  "explanation": "RAM temporarily holds active programs and data.",
  "walkthrough": "Identify temporary active work. Rule out persistent storage, then identify RAM as working memory.",
  "lessonAnchor": "concept"
}
```

### Multiple choice

`prompt`: string. `options`: at least two `{id,text,whyWrong}` objects with unique IDs. `correct`: an existing option ID. Every option requires `whyWrong`; for the correct option supply a clarification (it is never shown as wrong for that answer).

```json
{
  "id": "sample-memory-choice",
  "type": "multiple_choice",
  "prompt": "Which component holds active work temporarily?",
  "options": [
    {
      "id": "ram",
      "text": "RAM",
      "whyWrong": "RAM is the temporary working memory described here."
    },
    {
      "id": "ssd",
      "text": "SSD",
      "whyWrong": "An SSD retains files after shutdown; it is persistent storage."
    },
    {
      "id": "battery",
      "text": "Battery",
      "whyWrong": "A battery stores electrical energy rather than active program data."
    }
  ],
  "correct": "ram",
  "explanation": "Active programs use RAM as temporary working memory.",
  "walkthrough": "Identify temporary active work. Separate working memory from retained files and electrical energy. Choose RAM.",
  "lessonAnchor": "concept"
}
```

### Drag match

`prompt`: string. `pairs`: at least two `{id,left,right}` objects, defining correct associations. Pair IDs and right-hand labels must be unique. Tokens/targets shuffle independently.

```json
{
  "id": "sample-memory-match",
  "type": "drag_match",
  "prompt": "Match each component with its main role.",
  "pairs": [
    { "id": "ram", "left": "RAM", "right": "Temporary active work" },
    { "id": "ssd", "left": "SSD", "right": "Persistent file storage" }
  ],
  "explanation": "RAM holds active work; an SSD retains files without power.",
  "walkthrough": "Ask whether the requirement is temporary work or retained files. Match RAM to temporary work, then SSD to persistent storage.",
  "lessonAnchor": "concept"
}
```

### Drag sort

`prompt`: string. `categories`: at least two `{id,label}` objects. `items`: at least two `{id,text,category}` objects. IDs are unique within each list, and item categories reference existing category IDs. Several items may share a category.

```json
{
  "id": "sample-memory-sort",
  "type": "drag_sort",
  "prompt": "Group the components by primary purpose.",
  "categories": [
    { "id": "working", "label": "Working memory" },
    { "id": "persistent", "label": "Persistent storage" }
  ],
  "items": [
    { "id": "dimm", "text": "Desktop RAM module", "category": "working" },
    { "id": "sodimm", "text": "Laptop RAM module", "category": "working" },
    { "id": "ssd", "text": "Solid-state drive", "category": "persistent" }
  ],
  "explanation": "Both RAM formats provide working memory. An SSD provides persistent storage.",
  "walkthrough": "Classify function rather than physical size. Put both RAM formats under working memory and the SSD under persistent storage.",
  "lessonAnchor": "concept"
}
```

### Drag order

`prompt`: string. `steps`: at least two `{id,text}` objects with unique IDs. **The authored array is the correct order**; presentation is shuffled. Avoid sequences with several equally valid orders.

```json
{
  "id": "sample-support-order",
  "type": "drag_order",
  "prompt": "Order this simple verification process.",
  "steps": [
    { "id": "observe", "text": "Record the original symptom" },
    { "id": "change", "text": "Apply one appropriate change" },
    { "id": "verify", "text": "Repeat the original test to verify the result" }
  ],
  "explanation": "A baseline precedes a change, and verification compares the outcome with that baseline.",
  "walkthrough": "First establish what is wrong. Then make one controlled change. Finally repeat the test so you can compare the outcome.",
  "lessonAnchor": "concept",
  "visual": "support-cycle"
}
```

### Add an objective/domain and configure weighting

1. Read the current official PDF in `docs/`. Add `<number>.json` under its domain with original lesson/activity content and stable unique IDs.
2. For a new domain, create its directory/metadata and at least two objective files. Add its icon in `ChapterBits.tsx` if needed. A new certification requires extending exam types, selectors, and config; the current schema accepts the two A+ exams only.
3. Keep metadata weights and `src/exam-config.ts` synchronized with the official PDF. Config comments cite the local PDF version/page. Do not change official percentages to fit a small bank; the allocator handles shortages. Update source notes when PDF versions change.
4. Run `npm run validate:content`, `npm run coverage:content`, and `npm run catalog`. Commit the generated catalog. Restart dev after metadata edits; dev/build regenerate the catalog.
5. Run tests/build, then review lessons, correct/incorrect answers, repeated retries, keyboard/tap controls, both themes, and exam eligibility.

Coverage reports authored/missing objectives per domain. Validation catches duplicate IDs, unknown visual IDs, missing lesson anchors, incorrect lesson length, missing correct options/category references, invalid regexes, objective mapping errors, and exam weights not summing to 100. TypeScript catches missing visual registry entries.

### Add a visual

Create `src/visuals/MyVisual.tsx` with a default component returning SVG children. The shared wrapper supplies `viewBox="0 0 510 190"`, label/caption, lazy fallback, and pause control. Use `currentColor` and theme tokens (`--text`, `--muted`, `--accent`, `--surface`, `--border`) rather than fixed theme colors. Explain the concept in nearby prose too.

Add an ID to `visualIds` in `src/content/schema.ts`, add `lazy(() => import('./MyVisual'))` to `src/visuals/registry.ts`, and add a descriptive caption in `src/visuals.tsx`. Reference the ID in content and regenerate the catalog. Zod rejects unknown IDs; TypeScript requires the registry entry.

A static drawing must remain meaningful. Use CSS transform/opacity if motion helps; honor `.visual.paused`, root `data-motion="false"`, and `prefers-reduced-motion: reduce`. Never bypass these with independent JS timers. Every loop needs the wrapper pause control. Check on/reduced/off settings, static fallback, labels, contrast in both themes, 320px width, and 200% zoom.

### Content quality checklist

- [ ] Current official mapping and coverage gaps reviewed; no implied full coverage.
- [ ] Original, accurate, plain-language lesson and one concept per activity.
- [ ] 150–400 words; meaningful passage IDs; all anchors/visual IDs resolve.
- [ ] Explanations teach why; walkthroughs show reasoning; hints guide recall.
- [ ] Specific MC distractor reasons; reasonable blank spellings; anchored regex.
- [ ] Shuffles preserve correctness; variants share meaning; drag tasks are unambiguous.
- [ ] Miss, repeated miss, hint, success, and resume tested; exams expose no help before submission.
- [ ] Keyboard/tap, announcements, focus, 44px targets, both themes, motion settings, narrow layout, and zoom checked.
- [ ] Charts have tables and visuals have labels/static fallbacks.
- [ ] Validation, coverage, catalog, tests, build/budget pass; catalog committed.
