# Seat-Booking App (Research-Led Enhancement)

[![CI](https://github.com/<your-org>/<your-repo>/actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/<your-org>/<your-repo>/branch/main/graph/badge.svg)](https://codecov.io/gh/<your-org>/<your-repo>)

A modular, accessible, internationalised seat-booking demo built with **vanilla JavaScript + Vite**.
Original project by *Damian Zienke* (MIT). This fork is a research-led enhancement carried out for the
CPT304 Software Engineering II coursework.

> The list of fixed deficiencies, the literature each fix is based on, and the
> baseline-standards evidence are documented in [`docs/report/report.tex`](docs/report/report.tex).

---

## Quick start

> **Prerequisite:** Node.js 18+ (LTS recommended). On Windows install from <https://nodejs.org/>;
> verify with `node -v` and `npm -v` in a *new* terminal.

```bash
npm install        # install Vite, Vitest, jsdom
npm run dev        # http://localhost:5173 — live reload
npm run build      # produces ./dist (the artifact Vercel deploys)
npm run preview    # serves ./dist locally for a final smoke-test
npm test           # run all unit tests
npm run test:cov   # run tests + emit ./coverage (text/lcov/html)
```

## Verifying the 5 Baseline Standards

| Baseline | How to reproduce | Where the proof lives |
| --- | --- | --- |
| **Live uptime** | Push to GitHub → import the repo in [Vercel](https://vercel.com/new) → "Other" framework. `vercel.json` already declares the build command and headers. | `live-url.txt` (in your submission) |
| **Test coverage ≥ 80 %** | `npm run test:cov` prints a summary; full HTML report at `./coverage/index.html`. The Vitest config (`vitest.config.js`) enforces an 80 % threshold for lines / functions / branches / statements — the run **fails** below it. | Codecov badge above + `coverage/` artifact uploaded by `.github/workflows/ci.yml` |
| **Lighthouse a11y ≥ 90** | `npm run build` then run Chrome DevTools → Lighthouse → "Accessibility". Or push and let the `lighthouse.yml` workflow do it (`.lighthouserc.json` enforces 0.9). | Screenshot in `docs/report/figures/lighthouse.png` |
| **i18n (EN + ZH)** | Top-right toggle button switches between *English* and *简体中文*. Choice is remembered via `localStorage` and `<html lang>` is updated for screen readers. | Screenshot pair in `docs/report/figures/lang-en.png` / `lang-zh.png` |
| **Cookie banner + Privacy policy** | First visit shows a consent banner; until the user clicks **Accept**, nothing is written to `localStorage` (the app runs in memory). The banner links to `/privacy.html` (bilingual). Clicking **Reject** stores only the rejection flag and continues in memory mode. | Screenshot in `docs/report/figures/cookie-banner.png`; page at `/privacy.html` |

## Project layout

```
.
├─ index.html                # main page
├─ privacy.html              # bilingual privacy policy page
├─ vite.config.js
├─ vitest.config.js          # 80 % coverage threshold enforced
├─ vercel.json               # build = vite, output = dist/
├─ .lighthouserc.json        # a11y >= 0.9 assertion
├─ codecov.yml               # coverage targets
├─ src/
│  ├─ main.js                # app bootstrap
│  ├─ privacy.js             # privacy page bootstrap
│  ├─ core/                  # zero-DOM domain models
│  │  ├─ Service.js
│  │  ├─ Sector.js
│  │  └─ SeatBookingApp.js
│  ├─ storage/LocalStorageAdapter.js
│  ├─ validation/validators.js
│  ├─ i18n/
│  │  ├─ i18n.js
│  │  └─ locales/{en,zh}.json
│  ├─ ui/
│  │  ├─ SeatRenderer.js
│  │  ├─ OrderRenderer.js
│  │  ├─ SettingsRenderer.js
│  │  ├─ CookieBanner.js
│  │  └─ LanguageSwitcher.js
│  └─ styles/main.css
├─ tests/                    # mirrors src/, ~70 unit tests
├─ docs/report/              # LaTeX report + figures + .bib
└─ .github/workflows/        # CI + Lighthouse
```

## How the four researched fixes are wired in

| # | Deficiency | Where the fix lives |
| --- | --- | --- |
| 1 | **Accessibility (WCAG 2.1)** — non-semantic seats, no keyboard, missing labels, colour-only state | `src/ui/SeatRenderer.js` (button + ARIA + roving tabindex), `src/styles/main.css` (focus, dual-cue patterns, `prefers-reduced-motion`), `index.html` (skip link, labels, lang attr) |
| 2 | **God Object / SRP** — one 560-line file did everything | Module split: `core/`, `ui/`, `storage/`, `validation/`, `i18n/` |
| 3 | **Missing input validation / defensive programming** | `src/validation/validators.js`, `try/catch` around all `JSON.parse` in `LocalStorageAdapter`, fixed `findIndex === -1` off-by-one bug in `Service.removeReservedSeat` |
| 4 | **Performance: per-element listeners** | `src/ui/SeatRenderer.js` — single delegated `click`+`keydown` on `#seats`; CSS-only tooltip replaces the old DOM-mutating one |

## Building the LaTeX report

```bash
cd docs/report
xelatex report.tex
biber report                 # or: bibtex report (if you switch the .bib backend)
xelatex report.tex
xelatex report.tex
```

Compiled PDF goes to `docs/report/report.pdf` — that's the file the rubric expects.

## License

MIT (inherits from the upstream project).
