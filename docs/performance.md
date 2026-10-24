# Performance verification — v0.3.0

Measured October 24, 2026 against the production `npm run build` output served by `vite preview` on localhost. Lighthouse 13.5.0 attached to an isolated headless Microsoft Edge browser, using default mobile emulation and simulated throttling. Each final route was run separately. These are local lab measurements, not deployed-site field data or guarantees.

- Home `/`: **97 performance / 100 accessibility / 100 best practices**. LCP 2.2 s; total blocking time 0 ms; CLS 0.
- Lesson `/chapters/mobile-devices/sections/220-1201-1.1/lesson`: **96 / 100 / 100**. LCP 2.4 s; total blocking time 0 ms; CLS 0.
- Exam entry `/exam`: **95 / 100 / 100**. LCP 2.5 s; total blocking time 0 ms; CLS 0.002.

Initial JavaScript is **137.9 KiB gzip**, below the **200 KiB** warning budget. `scripts/check-budget.cjs` walks static imports from the Vite manifest entry, sums gzipped JavaScript files, and warns when exceeded. Lazy route/content/visual chunks are excluded. The measured initial files include the app entry and framework, validation, and manipulation shared chunks. The dynamically loaded Home route adds approximately 2 KiB gzip. CSS is approximately 8.3 KiB gzip and is outside the JS budget.

## Changes and findings

- Routes split with React lazy/Suspense; exam, stats, preferences, flow, and review are separate chunks.
- Metadata catalog ships initially; complete lesson/activity content is dynamically imported per domain. An exam loads only its selected exam's domains. Cache/pending maps prevent duplicate loads within a tab.
- Each visual has a separate lazy registry import. The shared wrapper retains its caption, label, static state, and pause control.
- Charts use small inline SVG, without a chart dependency. Exam answer handlers are stable so drag state effects do not repeatedly save the same untouched arrangement. No speculative memoization was added without a measured need.
- First audits found lesson heading order, a brand-label mismatch, and a missing favicon request. These were fixed; the final Lighthouse accessibility and best-practices categories score 100 on all three routes.
- Remaining opportunities reported by Lighthouse are CSS render blocking and the dependency chain needed to initialize the app. No long main-thread tasks or significant layout shift were measured. Back/forward-cache limits include browser storage/active-page state and are not a failure of saved progress.
- No service worker, PWA dependency, or offline promise was added. In-memory caching helps repeat visits within a tab; network access is still needed for uncached chunks and new loads.

## Reproduce

```sh
npm run build
npm run preview -- --port 4173
```

Run Lighthouse against each URL with `--only-categories=performance,accessibility,best-practices --output=json`. The default form factor is mobile. Set `CHROME_PATH` to an installed Chromium browser; if its launcher cannot start Edge, launch an isolated audit browser with a remote-debugging port and pass `--port=<port>`. Do not attach an audit to a personal browsing profile.

Raw Lighthouse JSON, browser axe JSON, screenshots, and bundle budget details are retained locally in ignored `tmp/audit/` and `tmp/bundle-budget.json`. Repeat the measurements on the deployed Cloudflare origin, especially after substantial content/dependency growth. Physical mobile performance, Safari/Firefox, slow-storage behavior on old devices, and offline behavior were not measured here.
