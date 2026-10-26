# Neon Glass landing page

The public `/` route adapts [INSTALANDING.AI's Neon Glass brief](https://instalanding.ai/p/neon-glass-app-landing-page.txt) and [MIT reference](https://instalanding.ai/demos/arcline-neon-glass.html) in the existing React/TypeScript/Vite stack.

- Uses StudyBench's name, actual catalog counts, existing learning routes, and real sample-question component.
- Replaces fictional AI chat with a topic search, fictional paid plans with free access, and the developer/API block with local-storage information. The orb is a visual illustration, not a microphone or AI assistant.
- Preserves the blue-black hue ramp, blue accent, layered gradient panels, nine separate edge-light spans, registered sweep angle, corner delays, seeded illustrations, lowercase presentation, and system fonts. No new external assets, fonts, or dependencies.
- Landing-specific effects are scoped to `.landing-shell`; code-window titles retain case. Workspace routes share the blue palette, typography, rounded panels, and static edge lighting through `src/workspace-theme.css` and the semantic tokens in `src/styles.css`. Study behavior and saved appearance preferences are preserved.
- Reveals run once. Ongoing orb effects have a pause control and honor the app's animation preference. `prefers-reduced-motion` hides sweep/sheen, shows corner lights at opacity 1, and stops orb/illustration movement.

Verified in Chromium at 390px and desktop: no console/runtime errors, no mobile horizontal overflow, native FAQ behavior, working topic search/navigation, and sample-question feedback. Automated reduced-motion checks confirm hidden sweep/sheen, visible corners, and a static orb. Axe reported no WCAG A/AA violations in the landing shell. The existing 153 tests and production build pass; initial JavaScript remains 139.5 KiB gzip against the 200 KiB budget.

Local verification screenshots and machine-readable results are under ignored `tmp/neon-audit/`.

## Shared workspace theme

The library, chapter map, lesson, activity, daily review, practice exam/results, statistics, guide, preferences, notifications, and dialogs now use the same design language. Dark appearance uses the landing page's blue-black surfaces and blue highlights; light appearance uses pale blue surfaces with the same roles and controls. Primary buttons have separate fill and label tokens so they remain readable in both appearances. Technical terms, answer text, commands, and lesson content retain their authored capitalization. Repeated workspace surfaces use static lighting rather than landing-page sweeps or orb animations.

The favicon now uses the same blue brand color. Form labels sit above their controls, reading text has a bounded measure, focus styles remain visible, and overlays contain their scrolling. No new dependencies or behavioral changes were introduced.

Verification: 153 tests and the production build pass. Chromium audit covers 32 route/state/theme combinations, including exam confirmation and results, with no reported axe violations or runtime errors. Scripted 320/640/1280px checks and the CSS 200% zoom approximation detect no document overflow. Additional desktop screenshots cover eight workspace routes in both appearances, activity screens, mobile library views, and a reset dialog opened and canceled without resetting data. These screenshots use isolated browser progress. Physical devices, screen readers, native zoom, and 10%-speed motion replay remain unverified.

Measured opaque control-border pairs: light `#74849e` against white is 3.79:1 and against the page is 3.53:1; dark `#647895` against the surface is 4.08:1 and against the page is 4.47:1. White primary labels against `#1c5dcc` measure 6.02:1; white against the dark hover fill `#2468db` measures 5.15:1. The browser audit additionally checks rendered text on the panel gradients.

Shared-theme screenshots are under ignored `tmp/theme-audit/`.
