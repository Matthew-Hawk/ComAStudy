# Accessibility verification — v0.3.0

Audit date: October 24, 2026. Automated checks use axe-core, Testing Library/user-event, and Playwright with headless Microsoft Edge. This report distinguishes automated verification from assistive-technology testing; it is not a blanket conformance claim.

## What was tested

- Light and dark versions of Home, chapter map, lesson, activity, daily-review entry/empty state, exam entry, stats, preferences, guide, missing-route state, and exam results are covered by component axe checks. All six activity control types receive separate checks in both themes.
- Rendered-browser axe checks cover 30 screen/state/theme combinations: the ten main route states plus active exam, answer-review screen, submission dialog, submitted results, and missed-question practice. WCAG 2 A/AA, 2.1 A/AA, and 2.2 A/AA tags include rendered contrast. The audit fails on serious/critical issues or runtime page errors. See `scripts/browser-audit.cjs`.
- Keyboard activation tests complete MC, blank, flashcard, matching, sorting, ordering, and an exam including review and explicit confirmation. Exam tests also check answer editing, flags, timer hiding, resume/discard, feedback suppression, and missed-question retry blocking.
- Native buttons, radios, inputs, selects, details/summary, dialogs, and links retain keyboard semantics. Route changes focus the main region; exam question changes focus the heading; learning feedback receives focus. Dialog focus is contained by native modal behavior and reset restores its trigger. A skip link targets main.
- Home was inspected from a rendered 320px screenshot. Automated width checks cover 320/640/1280px and a CSS 200% zoom approximation; route layout checks cover 320/640px. This does not replace native browser zoom or device testing.
- Lighthouse's mobile accessibility category scores 100 on Home, a lesson, and exam entry after fixes. Numeric chart labels and expandable captioned tables provide a non-color data alternative.

## What was fixed

- **1.4.3 Contrast:** darkened light-theme muted text where a lesson caption was just below 4.5:1; secondary controls explicitly use the theme text token. Rendered text contrast passes the scoped automated browser checks in both themes.
- **1.3.1 Structure / 2.4.6 Headings:** lesson passages now follow h1 with h2; compact lesson help uses h4 under its h3 heading. A decorative sidebar motto no longer masquerades as an early heading.
- **2.5.3 Label in Name:** the brand link uses its native visible name plus a screen-reader home suffix, avoiding an overriding label that differed from the rendered text.
- **2.1.1 Keyboard / 4.1.2 Name, Role, Value:** all drag types support native select-then-place controls; ordering has labeled move buttons. Customized dnd-kit announcements name the picked-up item, destination, drop, and cancellation. Tap/keyboard placement additionally announces the placed item/destination in a polite status region.
- **2.4.3 Focus / 2.4.7 Visible Focus:** focus outlines remain visible; main, exam headings, feedback, and native confirmation dialogs have intentional focus behavior. All changes of exam position remain unscored until explicit submission.
- **1.4.10 Reflow:** fixed new navigation overflow at tablet width; cards, exam review controls, placements, and chart tables adapt to narrow screens. Tables scroll within their container rather than widening the document.
- **2.5.8 Target Size:** buttons/selects and navigation/placement/move controls have at least 44px target dimensions; checkbox/radio hit areas include their associated labels.
- **2.2.2 Pause / 2.3.3 Motion preference:** SVG loops retain pause controls and static drawings; on/reduced/off settings and system reduced-motion disable animation/transition as appropriate. Sound is opt-in. There is no forced countdown or automatic exam submission.
- **4.1.3 Status Messages:** feedback, XP ticks, placement status, imports, and badge notifications use polite status regions. XP/streak/mastery remain available on persistent dashboard/stats screens, so toasts are not the only source.

## Remaining verification and limits

- No serious/critical violations remain in the tested automated browser states. Automated tools cannot prove full WCAG conformance or every possible authored-content state.
- jsdom checks intentionally disable color contrast because it has no layout engine. Its canvas API is stubbed to return null for axe's optional icon-font check; actual browser audits perform these checks without that stub.
- Actual NVDA/JAWS/VoiceOver narration, screen-reader tap-to-place, physical touch dragging, native 200% browser zoom, high-contrast OS mode, and Safari/Firefox were **not manually verified**. Semantic live announcements and keyboard paths are tested, but human assistive-technology testing remains necessary.
- SVG graphic meaning, focus visibility on every device, and all token/graphic contrast combinations still warrant visual review; axe text contrast is not a full non-text contrast audit.
- Content coverage remains intentionally limited to seeds. Newly authored content must repeat keyboard, contrast, heading, label, and visual-static-fallback review.

## Manual checklist

- [ ] In both themes, Tab from the skip link through every screen; confirm visible focus, logical order, no trap, and sensible route/feedback focus.
- [ ] With NVDA or VoiceOver, complete all three drag types through select/place and ordering move controls; listen for selection, pickup, move, drop/cancel, and result announcements.
- [ ] Complete an exam with keyboard only: edit earlier answers, flag/unflag, hide/show timer, review, cancel submission, then confirm. Verify no feedback leaks before submission.
- [ ] Review a missed question through multiple errors, hint escalation, linked lesson, and eventual completion; ensure no early Continue action.
- [ ] Inspect every route and activity at 320px and native 200% zoom, including expanded chart tables, dialogs, and long labels; confirm controls stay reachable.
- [ ] Turn on system reduced motion and try each animation setting; confirm useful static visuals and pause controls. Check actual touch devices and forced-colors mode.
- [ ] Confirm XP, streak, mastery, chart values, and exam history remain understandable without color or transient toasts.
