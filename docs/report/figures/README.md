# Required figures (drop screenshots here using these exact filenames)

| File | What to capture | When to take it |
| --- | --- | --- |
| `vercel-uptime.png`  | Vercel **Deployments** tab showing at least 7 consecutive days of green builds for this project | After 7 days of being live |
| `codecov-badge.png`  | The Codecov coverage page (`https://codecov.io/gh/<org>/<repo>`) showing project coverage ≥ 80 % | After the first GitHub Actions run uploads coverage |
| `lighthouse.png`     | Chrome DevTools → Lighthouse → Accessibility audit on the *production* (`vercel.app`) URL, with score ≥ 90 | Any time after first deploy |
| `lang-switch.png`    | Side-by-side (or stacked) screenshot of the app rendered in English and in 简体中文 (use the top-right toggle) | Any time |
| `cookie-banner.png`  | The first-visit state of the production app showing the consent banner overlaying the seat grid | Any time, in a private browsing window so `localStorage` is empty |

If a figure is missing at compile time, `xelatex` will warn but still produce
`report.pdf` with empty boxes — replace the PNGs and recompile.
