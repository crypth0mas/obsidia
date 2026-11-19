/*
 * Password gate for the demo app (/app). Vercel Routing Middleware, no dependencies.
 * The password is read from the DEMO_PASSWORD environment variable (Vercel > Settings > Environment Variables).
 * Without it the demo stays locked. The landing page (/) is never affected.
 */
export const config = {
  matcher: ["/app", "/app/:path*"]
};

const COOKIE = "obs_demo";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function tokenFor(password) {
  const data = new TextEncoder().encode(password + "|obsidia-demo-v1");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function safeNext(value) {
  return typeof value === "string" && /^\/app(\/|$|\?|#)/.test(value) && !value.startsWith("//") ? value : "/app/";
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function page({ next = "/app/", error = "", locked = false }) {
  const body = locked
    ? `<h1>Demo locked</h1><p class="sub">The demo password has not been set yet. Add <code>DEMO_PASSWORD</code> in the Vercel project settings, then redeploy.</p>`
    : `<h1>Obsidia demo</h1><p class="sub">Enter the password you were given to open the demo.</p>
      <form method="post" action="/app/login">
        <input type="hidden" name="next" value="${esc(next)}" />
        <label for="pw">Password</label>
        <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus />
        ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ""}
        <button type="submit"><span class="spin" aria-hidden="true"></span><span>Open the demo</span></button>
      </form>`;
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Obsidia — Demo access</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='28,0 100,0 100,72 72,100 0,100 0,28' fill='%23C6A15B'/%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Schibsted+Grotesk:wght@600&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet" />
<link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&display=swap" rel="stylesheet" />
<style>
  :root { --bg: #F5F3EF; --card: #FFFFFF; --line: #DFDAD0; --ink: #0E1014; --ash: #555B66; --brass: #C6A15B; --coral: #C2483C; }
  @media (prefers-color-scheme: dark) { :root { --bg: #08090B; --card: #14171D; --line: #272C35; --ink: #F5F3EF; --ash: #868C97; --coral: #F0766A; } }
  * { box-sizing: border-box; margin: 0; }
  body { min-height: 100vh; min-height: 100dvh; display: grid; place-items: center; padding: 24px 16px; background: var(--bg); color: var(--ink); font: 400 15px/1.55 "Switzer", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  .box { width: min(400px, 100%); }
  .logo { display: inline-flex; align-items: center; gap: 7px; margin-bottom: 28px; color: var(--ink); text-decoration: none; }
  .mark { width: 13px; height: 13px; background: var(--brass); clip-path: polygon(28% 0,100% 0,100% 72%,72% 100%,0 100%,0 28%); }
  .word { font: 600 14px/1 "Schibsted Grotesk", system-ui, sans-serif; text-transform: uppercase; letter-spacing: .24em; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 28px 24px 24px; }
  h1 { font: 400 34px/1.05 "Instrument Serif", Georgia, serif; }
  .sub { margin-top: 8px; color: var(--ash); }
  form { display: grid; gap: 8px; margin-top: 22px; }
  label { font: 500 11px/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; color: var(--ash); }
  input[type=password] { min-height: 46px; padding: 0 14px; border: 1px solid var(--line); border-radius: 9px; background: var(--bg); color: var(--ink); font: inherit; }
  input[type=password]:focus { outline: none; border-color: var(--brass); }
  .err { color: var(--coral); font-size: 14px; }
  button { margin-top: 8px; min-height: 46px; border: 0; border-radius: 9px; background: var(--brass); color: #08090B; font: 600 15px/1 "Switzer", system-ui, sans-serif; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 10px; transition: background-color .15s ease, transform .2s ease; }
  button:hover { background: #B8934E; }
  button:active { transform: scale(.98); }
  .spin { display: none; width: 14px; height: 14px; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; animation: spin .7s linear infinite; }
  form.busy .spin { display: block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  code { font: 500 13px "IBM Plex Mono", monospace; }
  .back { display: inline-block; margin-top: 18px; font-size: 14px; color: var(--ash); text-decoration: none; }
  .back:hover { color: var(--ink); }
</style>
</head>
<body>
  <main class="box">
    <a class="logo" href="/" aria-label="Obsidia website"><span class="mark" aria-hidden="true"></span><span class="word">Obsidia</span></a>
    <div class="card">${body}</div>
    <a class="back" href="/">Back to the website</a>
  </main>
  <script>document.querySelector("form") && document.querySelector("form").addEventListener("submit", function (e) { e.currentTarget.classList.add("busy"); });</script>
</body>
</html>`;
}

function html(markup, status = 200, headers = {}) {
  return new Response(markup, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", ...headers } });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const password = process.env.DEMO_PASSWORD;

  if (!password) return html(page({ locked: true }), 503);
  const expected = await tokenFor(password);

  if (url.pathname === "/app/logout") {
    return new Response(null, { status: 303, headers: { Location: "/app/login", "Set-Cookie": `${COOKIE}=; Path=/app; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }

  if (url.pathname === "/app/login") {
    if (request.method === "POST") {
      const form = await request.formData().catch(() => null);
      const given = form ? String(form.get("password") || "") : "";
      const next = safeNext(form ? String(form.get("next") || "") : "");
      if (same(await tokenFor(given), expected)) {
        return new Response(null, {
          status: 303,
          headers: { Location: next, "Set-Cookie": `${COOKIE}=${expected}; Path=/app; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax` }
        });
      }
      await new Promise((r) => setTimeout(r, 700)); // slows down guessing
      return html(page({ next, error: "Wrong password. Try again." }), 401);
    }
    if (same(readCookie(request, COOKIE) || "", expected)) return Response.redirect(new URL("/app/", url), 303);
    return html(page({ next: safeNext(url.searchParams.get("next") || "") }));
  }

  if (same(readCookie(request, COOKIE) || "", expected)) return; // signed in: serve the static file

  const next = url.pathname + url.search;
  return Response.redirect(new URL("/app/login?next=" + encodeURIComponent(safeNext(next)), url), 303);
}
