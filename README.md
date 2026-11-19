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

- `APP_URL` at the top of the `<script>` in `index.html`. Set to `/app/`: every "Get started"
  button opens the demo app with a loading state. Empty it and the buttons keep their look
  and press feedback but go nowhere.
- `DEMO_PASSWORD` environment variable on Vercel: the password of the demo app (see below).
- `img/apartment.webp` (1200×800) is the listing photo in the onboarding section. Without
  the file the card falls back to a plain floor-plan sketch.

## Analytics

Vercel Web Analytics is loaded with the static-site snippet (`/_vercel/insights/script.js`),
not the `@vercel/analytics` npm package, since the site has no build step. Enable it in the
Vercel project (Analytics tab). The script is skipped on localhost.

## Themes and motion

- Light is the default. A header toggle switches to dark, saved in `localStorage`
  (`obsidia.theme`). In light mode the "manager's new day" section is the one dark
  section, and lime stays a block behind dark text.
- Fluted glass sits behind the hero and the footer (the footer refracts the wordmark).
- The pricing simulator also shows managers needed: units ÷ 90 today vs units ÷ 300 with
  Obsidia (midpoints of 80–100 and 250–350).
- All motion respects `prefers-reduced-motion`: content shows at once, loops stop.

## Demo app (`/app/`)

A clickable MVP for demos, served at `/app/` next to the landing page. Static HTML/CSS/JS, no build, same tokens and fonts as the landing page, light by default (shares the `obsidia.theme` setting).

- `app/index.html` shell, sidebar and mobile tab bar
- `app/app.css` styles
- `app/data.js` fictional demo data (properties, tenants, applicants, CRM, conversations)
- `app/app.js` router and scripted scenarios

Screens: Today, Inbox, Applicants, CRM, Tenants, Properties, Assistant. The **Run demo** menu plays six scripted scenarios:

1. Phone agent answers an incoming call
2. WhatsApp in Italian answered in seconds
3. New file rated and ranked
4. CRM record filling itself
5. Agent calls a late tenant, then a tenant request is booked
6. Assistant answers a question about a renovation

State lives in memory: reload the page or use **Reset the demo** to start again.

### Password

`middleware.js` (Vercel Routing Middleware, no dependencies) protects `/app` and everything
under it. The landing page is never affected. `package.json` only sets `"type": "module"`,
which Vercel needs to run the middleware in a project without a framework.

1. Vercel > Project > Settings > Environment Variables: add `DEMO_PASSWORD` (Production,
   and Preview if you want preview links protected too).
2. Redeploy. Visitors to `/app/` get a sign-in page; the right password sets an HttpOnly
   cookie for 30 days. Changing the password signs everyone out.
3. `/app/logout` signs out.

Without `DEMO_PASSWORD` the demo shows "Demo locked" instead of opening. GitHub Pages,
Netlify and local static servers do not run the middleware: there `/app/` opens with no
password (the local preview `python -m http.server` included).
