# Obsidia — Landing page

Landing page for **Obsidia**, automation for long-term rental management (six modules
covering the rental cycle end to end, PMS connectors, screening, incidents and billing).

Static, bilingual (EN/FR) single page — no build step, no framework, no image assets.
Open `index.html` or serve the folder as-is.

## Features

- **Bilingual EN/FR** toggle in the header, persisted in `localStorage` (`obsidia.lang`).
- **Affordability simulator** — two range sliders compute the live rent-to-income ratio,
  eligibility status and gauge.
- **Pricing calculator** — a slider estimates monthly / yearly cost at €10 / unit.
- **FAQ accordion** with smooth expand/collapse.
- Fully responsive via intrinsic `auto-fit` grids and `clamp()` type — no media queries needed.

## Preview locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Deployment

Zero configuration. Publish the folder as-is on Vercel, Netlify, Cloudflare Pages or
GitHub Pages. On Vercel, import the repo and keep every default (Framework preset: *Other*,
no build command, root output).

## Configuration

Three values live at the top of the `<script>` in `index.html`:

| Constant | Default | Purpose |
|----------|---------|---------|
| `APP_URL` | `https://obsidia.base44.app` | Destination of every "Open the application" button |
| `DEFAULT_LANG` | `en` | Language shown before a visitor picks one |
| `SHOW_COMPARISON` | `true` | Show/hide the "with vs without Obsidia" section |

## Origin

Implemented from the Obsidia design-code source (`Obsidia Landing.dc.html`), which required a
proprietary runtime (`support.js`). Its `DCLogic` component — translations, simulators and FAQ —
has been reimplemented in vanilla JS so the page runs standalone. Type (Instrument Serif,
Schibsted Grotesk, IBM Plex Mono) is loaded from Google Fonts; every style value is preserved
from the source.
