# Phase 1 design and interaction contract

## Public landing and study workspace

The public entry route `/` now introduces StudyBench to new IT learners with a minimal header, an explicit purpose, a three-stage learning explanation, a random sample question, and a primary action opening the topic library at `/study`. The existing workspace navigation and learning state remain on study routes. The green semantic palette and system fonts are retained; the page uses a workbench metaphor and numbered learning stages, with the real sample providing interactive evidence. No external imagery, font dependencies, or entrance animations are added.

Samples are selected from catalog metadata, exclude the immediately previous question, load the relevant domain on demand, and keep answer state local to the component. Loading and retry states are visible, correct and incorrect feedback have text labels, and controls are native buttons. They do not call the learning store. The layout stacks on narrow screens and uses container queries to reflow when zoom reduces usable space. Verification covers landing-to-library navigation, existing learning/resume paths, both themes, sample feedback and rerolls, responsive widths, and the scripted CSS 200% zoom approximation. Physical devices, screen readers, native zoom, and 10%-speed Animations-panel replay remain unverified.

The original Phase 1 notes below describe the earlier workspace implementation.

The product serves self-directed IT learners who return frequently. The main object is an exam chapter containing objective sections. The task is to understand a short lesson, apply it, and resume without losing work. All sections are open from the map. Within a session, progression is linear and completion requires a correct response.

The requested Vite, React, TypeScript, Tailwind, React Router, Zod, Zustand, dnd-kit and Vitest stack is retained. Theme colors, surfaces, spacing and focus colors use CSS tokens. A system font stack avoids external font requests. The library uses a stable navigation rail, exam selectors, chapter search and two-column chapter cards. On narrow screens navigation becomes a horizontal row and chapters become a single column. Lessons use a bounded reading measure and optional static or pausable inline SVG illustrations. The only accent is green; animation is confined to instructional visuals and short state transitions.

Interaction states include untouched, selected, incorrect, hint-assisted, walkthrough-assisted, complete, interrupted/resumable, search-empty, unavailable route and storage-failure. Native links, buttons, radio inputs, selects and checkboxes supply semantics. Tap-to-select/place and reorder buttons are full alternatives to drag gestures. Feedback uses icon, text and color. Polite status regions announce outcomes; route changes focus the main landmark. Feedback and retry headings receive focus when their controls replace the previous content. Reduced motion overrides illustration animation even when the in-app toggle is enabled.

Acceptance evidence is content validation, TypeScript compilation, a production build, retry/session unit tests and Testing Library interaction tests. Browser inspection was attempted but blocked by the browser tool's URL policy. Desktop/mobile screenshots, physical drag behavior and real screen-reader checks are therefore unverified. Do not infer a completed accessibility audit from passing component tests; that audit belongs to Phase 3.

This local implementation follows the Sites local-preview guidance and Stark's product-app references: task ergonomics, interaction state matrix, accessibility interaction contract and rendered quality gate. The rendered quality gate remains uncertain without permitted browser observation.
