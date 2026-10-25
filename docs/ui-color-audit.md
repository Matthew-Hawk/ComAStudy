# StudyBench: UI, color, and learning-purpose audit

Reviewed October 24, 2026. Live preview: https://comastudy.pages.dev/.

## Implementation follow-up

The recommendations below have now been implemented in the local project. The original findings and verdicts are retained as the pre-change audit record, not a verdict on the revised interface. The public preview has not been deployed by this task.

The homepage now leads with concrete IT skills, a direct introductory lesson, and an interactive example drawn from existing lesson content. New visitors no longer see empty progress metrics; returning learners get an emphasized resume/review action. Topic cards lead with capabilities and reveal progress after learning begins. Learner-facing seed/release terminology has been removed. Hover rules are gated, theme switches suppress transitions, reward scrolling is contained, and control boundaries have their own theme token.

Recomputed control-boundary contrast: light **3.64:1** against the surface, **3.45:1** against the page, **3.21:1** against the preview background; dark **4.49:1**, **5.01:1**, and **3.64:1**, respectively. Each exceeds 3:1. Production build, content validation, and TypeScript checks pass. Browser verification covers the original 30 route/state/theme combinations plus four sample-answer/theme states, with no reported axe violations, runtime errors, or detected horizontal overflow at the checked widths. Fresh desktop/mobile screenshots were inspected in light and dark themes; physical-device and assistive-technology limits still apply.

## Main finding

The interface communicates a calm study workspace, but it does not quickly communicate the IT capabilities a learner will build. The strongest material is inside the lessons. The homepage gives more prominence to encouragement, exam organization, and progress accounting than to those capabilities.

For the owner's stated goal—clearly showcasing that the website helps people learn the IT skills needed to succeed—the first priority is the introduction and starting experience. Changing the palette or adding motion will have less impact.

This is an audit and proposed direction. No product source or colors were changed.

## Learning purpose and hierarchy

P1 means a major obstacle to the stated communication goal; P2 means supporting improvement. These are product priorities, separate from the UI/color skill severity ratings below.

| Priority | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| P1 | `src/routes/Library.tsx:59`, `src/routes/Library.tsx:71` | “Your next chapter starts here” and “Understand it. Then make it stick.” occupy the two largest headline positions. | Lead with a single concrete promise such as “Build the IT skills to solve real problems.” Follow with the actual subjects and learning method. | Purpose before encouragement: visitors should understand the subject, intended learner, and value immediately. |
| P1 | `src/routes/Library.tsx:66`, `src/components/LearningDashboard.tsx:70` | New learners see 0 reviews, a 0-day streak, 0 XP, and a Start review action before the introduction. The review action leads to an empty queue. | Show a beginner introduction and one recommended lesson until meaningful progress exists. For returning learners, prioritize Resume lesson and show review only when useful. | State-appropriate hierarchy: the first prominent action should produce useful learning. Empty accounting displaces the product's value. |
| P1 | `src/routes/Library.tsx:76`, `src/routes/Library.tsx:80`, `src/routes/Library.tsx:114` | “Core 1 and Core 2,” exam numbers, and “Explore chapters” assume the learner knows the certification structure and what to study first. | Explain “CompTIA A+ IT fundamentals,” give the Core tabs plain-language subject descriptions, and provide “Start your first lesson” beside a quieter browse option. | A beginner needs a recommended route and understandable labels. Preserve open chapter access for experienced learners. |
| P1 | `src/components/ChapterBits.tsx:39`, `src/routes/Library.tsx:83` | A decorative laptop sketch occupies the demonstration area. “Hands-on practice” is asserted without showing what practice entails. | Replace the sketch with an actual sample activity or a clearly labeled preview of the existing lesson → practice → explanation flow. | Show evidence of learning. Current activities are guided questions, recall, matching, sorting, and ordering; avoid implying terminal labs or device simulations that do not exist. |
| P2 | `src/routes/Library.tsx:149`, `src/routes/Library.tsx:155`, `src/routes/Chapter.tsx:86`, `src/routes/Chapter.tsx:180` | Completion, mastery, seed counts, and exam weight compete with each topic's value. | Lead chapter cards with a concrete capability and a lesson entry point. Keep one compact progress summary for returning learners and move detailed measures into the chapter/stats view. | Outcome before accounting: explain what a learner will be able to do before quantifying their interaction with the content. |
| P2 | `src/routes/Library.tsx:92`, `src/routes/Library.tsx:200`, `src/App.tsx:196`, `src/routes/Chapter.tsx:212` | “Seed sections,” “Phase 3,” and implementation-oriented coverage explanations appear in learner-facing copy. | Use “18 lessons currently available” and a clear, compact scope note: “A growing library covering selected A+ topics; not the full exam curriculum.” Remove release-phase jargon. | Plain-language trust: communicate the real limitation without making the interface read like an internal prototype. Do not promise full exam or job readiness. |
| P2 | `src/App.tsx:124`, `src/App.tsx:134` | A decorative numbered learning path always shows a checked first step, even for a new learner, without naming the steps. | Use static labeled stages—Learn, Practice, Review—or bind a real progress indicator to learner state. | Honest state communication: an unexplained check mark looks like earned completion. Labeled stages explain the learning method. |

### Proposed homepage content and order

1. **Headline:** Build the IT skills to solve real problems.
2. **Description:** Learn hardware, networking, operating systems, security, and troubleshooting through short lessons, guided practice, and spaced review. Build your understanding of IT support fundamentals with selected CompTIA A+ topics.
3. **Primary action:** Start your first lesson. Link directly to a chosen introductory lesson, with a plain-language description of what it teaches. The existing “Inside a mobile device” lesson can serve as an initial entry while a broader beginner sequence is designed.
4. **Secondary action:** Browse IT topics.
5. **Reassurance:** Free to explore. No account needed. Progress saved in this browser.
6. **Learning preview:** Show a real example from current content, such as distinguishing RAM from storage, together with the explanation a learner receives.
7. **Capabilities:** Explain the available learning in concrete terms: identify computer components, choose connections and protocols, reason through troubleshooting, and understand basic security decisions. Link each claim to relevant authored lessons.
8. **Topic library:** Preserve Core 1/Core 2 as a secondary curriculum organization, with short subject descriptions.
9. **Scope:** State clearly that the current library covers selected topics and does not establish complete certification or workplace competence.

Returning learners should get a compact “Continue learning” area near the top. Show useful personal progress there after a learner has begun.

## Color audit — use a token only in its role

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/styles.css:241`, `src/styles.css:259`, `src/styles.css:709`, `src/styles.css:1289`, `src/styles.css:2039` | The same subtle `--border` token serves dividers and control boundaries. Measured declared pairs: light border/page **1.19:1**, light border/surface **1.25:1**; dark border/page **1.64:1**, dark border/surface **1.47:1**. The live light-theme search wrapper uses the same measured border and surface values. | Introduce a separate semantic token for control boundaries; select values that reach 3:1 against adjacent surfaces where the boundary is needed to identify the input, then measure again. Leave divider tokens subtle. | A structure token is doing a control-identification job. In particular, blank inputs use the page background as their fill, leaving a faint outline as the main visible field boundary. These ratios miss the 3:1 non-text boundary target; they are not text-contrast failures. |

## UI polish — hover effects only on hover-capable pointers

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/styles.css:444`, `src/styles.css:643`, `src/styles.css:651`, `src/styles.css:791`, `src/styles.css:907` | Plain CSS hover rules run without an `@media (hover: hover)` guard. Cards change border/shadow; navigation and buttons change background. | Put hover-only rules inside the media query, preserving separate focus, selected, and pressed states. | Touch browsers can retain hover styling after a tap. The source exposes the risk; a stuck state was not reproduced on physical hardware, so this is not reported as a confirmed HIGH interaction failure. |

## UI polish — suppress transitions on theme switch

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/App.tsx:62`, `src/styles.css:634`, `src/styles.css:786` | Theme switching changes the root theme attribute while buttons and cards retain color/shadow transitions. No temporary transition suppression exists. | Suppress transitions for the theme swap, flush the style change, and restore them after the next frame. | Theme changes trigger unrelated interactive transitions together, producing inconsistent timing between surfaces. The live theme control works; this is a polish issue, not a broken toggle. |

## UI polish — high-frequency interactions get immediate feedback

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | `src/styles.css:634`, `src/styles.css:786` | Button and card hover transitions last 180ms, including a shadow transition. | Use immediate feedback or at most 150ms background-color/opacity feedback for routine hover. Name `background-color` explicitly when only the color changes. | Keeps frequent browsing interactions responsive and consistent. No animation-performance problem was measured; this finding concerns the requested skill's interaction recipe. |

## UI polish — contain scroll inside overlays

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | `src/styles.css:2269` | The fixed reward overlay has `max-height: 40vh` and `overflow: auto` without overscroll containment. | Add `overscroll-behavior: contain` to the scrolling overlay. | Prevents scroll chaining to the learning page when the overlay reaches its edge. Overflow was confirmed in source; wheel/touch chaining was not manually reproduced. |

## What is already working

- One coherent green accent and neutral surface system in both themes. A new hue is not required to explain IT learning; concrete copy and real examples will do more.
- The homepage has one visually filled primary action. Preserve that clear emphasis when changing its destination.
- Readable text pairs in the measured sample, with no detected axe violations in the automated local checks.
- Existing short lessons, explanatory feedback, retry support, spaced review, and saved progress form a credible teaching experience. Bring that evidence into the introduction.
- Reduced-motion overrides, static illustration behavior, pause controls, and persistent text labels exist. No source-verified ungated animation was found in the reviewed shared styles.
- Lucide provides a consistent icon family, and the reviewed icon components use inherited color.

## Verification and boundaries

**Live inspection:** Homepage in dark and light themes, fresh zero-progress state, chapter entry, rendered search boundary, and actual visible messaging. At a 1265×720 viewport, the chapter section began at approximately y=759, below the first viewport. The first screen therefore showed encouragement and empty metrics before concrete chapter subjects. The main homepage and chapter messaging matched the local source; deployment byte-for-byte identity was not verified.

**Local automated browser audit:** Ran the existing `scripts/browser-audit.cjs` against the local preview with Chrome. It inspected **30 screen/state/theme combinations**, including main routes, lesson/activity entry, exam answering/review/confirmation/results, and missed-question review. Result: **0 reported axe violations and 0 runtime errors**. There was no detected horizontal document overflow in the scripted 320/640/1280px checks, the route checks at 320/640px, or the CSS 200% zoom approximation. Some axe rules returned **incomplete**, including color contrast on certain screens; zero reported violations does not prove every color pair passed.

**Color calculations:** Used the WCAG relative-luminance formula on declared sRGB hex pairs. Light body/page **13.41:1**, muted/surface **5.54:1**, primary label/fill **7.70:1**. Dark body/page **14.43:1**, muted/surface **7.04:1**, primary label/fill **9.46:1**. These opaque sampled text pairs exceed 4.5:1. Hero paragraph text has opacity, so its final rendered contrast is not asserted from its raw token pair. Control-boundary ratios are reported separately above. Declared hex colors lie within sRGB by construction; every runtime color-mix/alpha combination was not exhaustively checked.

**Mobile visual review:** Inspected the local script's 320px full-page screenshot. The hierarchy delay is more pronounced vertically. That screenshot contains synthetic progress/resume data from the exam audit and must not be mistaken for a fully fresh first-visit screenshot.

**Not verified:** Every lesson's authored content and all activity permutations; every live route/theme combination; physical touch hover retention and scrolling; native browser zoom; screen readers; forced-colors OS rendering; motion replay at 10% speed in the Animations panel; every animated state by hand; performance impact of hover shadows; all rendered alpha/gradient pairs. The local automated results are not represented as a live-site automated accessibility certification.

**Suggested implementation order:** Rewrite and simplify the introduction; make the new/returning learner actions appropriate; show a real learning example; make topic cards communicate skills; clean up learner-facing terminology; then address the smaller color/UI findings.

**UI/color skill verdict: Approve for inspected coverage, with the MEDIUM/LOW work above remaining.** No confirmed HIGH finding under those skills was established. This does not approve uninspected states.

**Product-goal verdict: Block.** The current first-visit presentation still needs a clearer IT-skills promise, evidence of learning, and a useful recommended starting action before it meets the owner's stated goal.
