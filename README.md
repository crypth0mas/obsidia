# Obsidia — Landing page

Landing page for **Obsidia**: AI that answers every call, email and WhatsApp for rental
listings, rates applicants, fills the CRM and handles tenants after letting. Managers keep
only viewings, key check-in and key check-out.

Static single page in English — no build step, no framework, no image assets.
Open `index.html` or serve the folder as-is.

## Sections

Hero with a live "Today" product view · Onboarding (swap the contacts on a listing) ·
Six features (applicant rating as the main card, interactive portfolio assistant) ·
The manager's new day (the one light section) · Pricing with a unit calculator · Final CTA.

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

- `APP_URL` at the top of the `<script>` in `index.html`. Empty by default: there is no app
  yet, so every "Get started" button keeps its look and press feedback but goes nowhere.
  Set a URL and the buttons open it with a loading state.
- `img/apartment.webp` (1200×800) is the listing photo in the onboarding section. Without
  the file the card falls back to a plain floor-plan sketch.

## Themes and motion

- Light is the default. A header toggle switches to dark, saved in `localStorage`
  (`obsidia.theme`). In light mode the "manager's new day" section is the one dark
  section, and lime stays a block behind dark text.
- Fluted glass sits behind the hero and the footer (the footer refracts the wordmark).
- The pricing simulator also shows managers needed: units ÷ 90 today vs units ÷ 300 with
  Obsidia (midpoints of 80–100 and 250–350).
- All motion respects `prefers-reduced-motion`: content shows at once, loops stop.
