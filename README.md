# Study workspace — Phase 1

A browser-only IT learning app for 220-1201 and 220-1202. No accounts or backend. The placeholder app name is defined once in `src/config.ts`.

## Run locally

Use Node 24 or a supported modern Node release.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To verify the deliverable:

```sh
npm test
npm run build
npm run coverage:content
```

`build` validates all JSON content, checks TypeScript, and emits the static site into `dist/`. Deployments must serve `index.html` for unknown paths so direct chapter/lesson/activity URLs work with BrowserRouter.

## Included

- Nine chapter maps across the two exams, with two original seed objectives per domain.
- 18 lessons (150–400 words each), 57 activities, all six formats and six instructional SVG illustrations.
- Open section selection, linear progression through the remainder of a chapter, save/exit and resume.
- Must-get-it-right feedback, fresh forms, escalating hints/lesson highlights and worked walkthroughs. Every miss is retained separately from eventual completion.
- System/light/dark appearance and a motion preference. System reduced motion takes priority.
- Replaceable local-storage interface and Zustand UI state. Storage failures show a visible warning.

Source versions and verification notes are in `docs/content-sources.md`. Original provided PDFs are preserved. Nothing claims full exam coverage or official affiliation.

## Structure

`content/<exam>/<domain>/domain.json` supplies chapter metadata. Objective JSON files live beside it, named by objective number. `src/content/schema.ts` defines the Zod union, integrity rules and build-time visual IDs. `src/engine/` owns grading, retries and linear session construction. `src/storage.ts` isolates persistence from the UI. `src/visuals.tsx` supplies code-native illustrations; no external assets or branding are loaded.

The lesson renderer supports paragraph breaks and `**inline emphasis**`; raw HTML is never interpreted. Each passage has a stable ID referenced by activity `lessonAnchor` values. The authoring script preserves the original seeds and can regenerate them, but editing content JSON does not require running it. Re-running the seed script overwrites the seeded JSON files.

## Phase boundaries

Phase 2 will add SM-2 scheduling, derived mastery, daily review, export/import, XP, streaks and badges. Phase 3 will add practice exams, statistics, remaining settings, an accessibility audit, performance work and the expanded authoring guide. The app intentionally exposes only features implemented in Phase 1.

## Verification limits

The browser tool denied access to the local URL during implementation; a separate server readiness request also timed out. Automated component tests and production compilation pass, but rendered mobile/desktop inspection and physical drag-and-drop still need browser QA. A full accessibility audit is not claimed.
