/* Obsidia demo app: hash router, demo state in memory, scripted agent scenarios. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var S;                                    /* demo state, reset from OBS_DATA */
  function reset() {
    S = JSON.parse(JSON.stringify(window.OBS_DATA));
    S.conversations.reverse();              /* newest first */
    S.feed = S.conversations.map(function (c) { return { conv: c.id, chan: c.chan, who: c.name, what: c.summary, time: c.time }; });
    S.invited = {};
    S.done = {};
    S.unread = { c1: false };
    S.clock = 9 * 60 + 41;
    S.chat = [];
    S.inboxFilter = "all";
    S.crmFilter = "all";
    S.fresh = {};
  }
  reset();

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(n, cls) { return '<svg class="i' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  var nf = new Intl.NumberFormat("en-GB");
  function eur(n) { return "€" + nf.format(n); }
  function prop(id) { return S.properties.filter(function (p) { return p.id === id; })[0]; }
  function conv(id) { return S.conversations.filter(function (c) { return c.id === id; })[0]; }
  function contact(id) { return S.contacts.filter(function (c) { return c.id === id; })[0]; }
  function tick() { S.clock += 3; var h = Math.floor(S.clock / 60), m = S.clock % 60; return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"); }
  var CH = { call: ["phone", "Call"], whatsapp: ["chat", "WhatsApp"], email: ["mail", "Email"], sms: ["sms", "Text"], invite: ["cal", "Invitations"], rent: ["receipt", "Rent"], request: ["tool", "Request"] };
  function chan(c) { return '<span class="chan">' + ic((CH[c] || CH.sms)[0]) + "</span>"; }

  var run = 0;                                /* cancels running scenarios */
  function later(fn, ms, id) { setTimeout(function () { if (id === run) fn(); }, reduce ? Math.min(ms, 60) : ms); }
  function typeText(el, text, perWord, id, done) {
    var words = text.split(" "), i = 0;
    if (reduce) { el.textContent = text; done && done(); return; }
    (function step() {
      if (id !== run) return;
      el.textContent = words.slice(0, ++i).join(" ");
      if (i < words.length) setTimeout(step, perWord); else done && done();
    })();
  }
  function typeChars(el, text, ms, id, done) {
    var i = 0;
    if (reduce) { el.textContent = text; done && done(); return; }
    (function step() {
      if (id !== run) return;
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(step, ms); else done && done();
    })();
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast"; t.innerHTML = ic("check") + "<span>" + esc(msg) + "</span>";
    $("#toasts").appendChild(t);
    setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 320); }, 3800);
  }

  /* ---------- theme ---------- */
  function setThemeColor() { $('meta[name="theme-color"]').content = document.documentElement.getAttribute("data-theme") === "light" ? "#F5F3EF" : "#08090B"; }
  setThemeColor();
  $$("[data-theme-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      var light = document.documentElement.getAttribute("data-theme") === "light";
      if (light) document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", "light");
      try { localStorage.setItem("obsidia.theme", light ? "dark" : "light"); } catch (e) {}
      setThemeColor();
    });
  });

  /* ---------- drawer and modal ---------- */
  var scrim = $("#scrim"), drawer = $("#drawer"), modal = $("#modal"), onModalClose = null;
  function showScrim() { scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add("open"); }); }
  function hideScrim() { scrim.classList.remove("open"); setTimeout(function () { if (!drawer.classList.contains("open") && !modal.classList.contains("open")) scrim.hidden = true; }, 260); }
  function openDrawer(html) {
    drawer.innerHTML = html; drawer.setAttribute("aria-hidden", "false");
    showScrim(); requestAnimationFrame(function () { drawer.classList.add("open"); drawer.focus({ preventScroll: true }); });
  }
  function closeDrawer() { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); hideScrim(); }
  function openModal(html, cls, onClose) {
    modal.className = "modal" + (cls ? " " + cls : ""); modal.innerHTML = html; modal.hidden = false; onModalClose = onClose || null;
    showScrim(); requestAnimationFrame(function () { modal.classList.add("open"); });
  }
  function closeModal() {
    if (modal.hidden) return;
    hush();
    modal.classList.remove("open"); hideScrim();
    var cb = onModalClose; onModalClose = null;
    setTimeout(function () { if (!modal.classList.contains("open")) modal.hidden = true; }, 300);
    if (cb) cb();
  }
  scrim.addEventListener("click", function () { closeDrawer(); closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeDrawer(); closeModal(); closeMenu(); } });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) { closeDrawer(); closeModal(); }
    var cp = e.target.closest("[data-copy]");
    if (cp) {
      var v = cp.getAttribute("data-copy");
      try { navigator.clipboard && navigator.clipboard.writeText(v); } catch (err) {}
      var was = cp.textContent; cp.textContent = "Copied"; setTimeout(function () { cp.textContent = was; }, 1400);
    }
  });

  /* ---------- segmented control ---------- */
  function seg(items, on, attr) {
    return '<div class="seg" role="group">' + items.map(function (it) {
      return '<button type="button" ' + attr + '="' + it[0] + '" class="' + (it[0] === on ? "on" : "") + '" aria-pressed="' + (it[0] === on) + '">' + esc(it[1]) + "</button>";
    }).join("") + '<span class="thumb" aria-hidden="true"></span></div>';
  }
  function placeThumbs(animate) {
    $$(".seg").forEach(function (s) {
      var on = $("button.on", s), th = $(".thumb", s);
      if (!on || !th) return;
      if (!animate) th.style.transition = "none";
      th.style.width = on.offsetWidth + "px"; th.style.transform = "translateX(" + (on.offsetLeft - 3) + "px)"; th.style.left = "3px";
      if (!animate) { th.offsetWidth; th.style.transition = ""; }
    });
  }
  window.addEventListener("resize", function () { placeThumbs(false); });

  /* ---------- views ---------- */
  var view = $("#view"), mount = null;

  function vToday() {
    var tasksLeft = S.agenda.filter(function (a) { return !S.done[a.id]; }).length;
    var total = 0, paid = 0, late = 0;
    S.tenants.forEach(function (t) { total += t.rent; if (t.status === "paid") paid += t.rent; if (t.status === "late") late++; });
    var newApps = 0; Object.keys(S.applicants).forEach(function (k) { newApps += S.applicants[k].length; });
    var feed = S.feed.slice(0, 6).map(function (f, i) {
      return '<a href="' + (f.conv ? "#/inbox/" + f.conv : f.href || "#/today") + '" class="' + (f.fresh ? "fresh" : "") + '">' + chan(f.chan) +
        '<div><div class="who">' + esc((CH[f.chan] || CH.sms)[1]) + " · " + esc(f.who) + '</div><div class="what">' + esc(f.what) + "</div></div>" +
        '<time class="num">' + esc(f.time) + "</time></a>";
    }).join("");
    S.feed.forEach(function (f) { f.fresh = false; });
    var agenda = S.agenda.map(function (a) {
      return '<div class="slot' + (S.done[a.id] ? " done" : "") + '" data-slot="' + a.id + '"><time class="num">' + a.time + '</time><div><b>' + esc(a.kind) + "</b><span>" + esc(a.where) + '</span></div>' +
        '<button class="check" type="button" data-done="' + a.id + '" aria-pressed="' + !!S.done[a.id] + '" aria-label="Mark ' + esc(a.kind) + ' as done">' + ic("check") + "</button></div>";
    }).join("");
    mount = function () {
      $$("[data-done]", view).forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-done"); S.done[id] = !S.done[id];
          b.closest(".slot").classList.toggle("done", S.done[id]); b.setAttribute("aria-pressed", S.done[id]);
          var left = S.agenda.filter(function (a) { return !S.done[a.id]; }).length;
          $("#tasksLeft").textContent = left;
          $("#dayNote").textContent = left ? "Everything else today was handled without you." : "Your day is done. Obsidia keeps answering tonight.";
        });
      });
    };
    return '<div class="head"><div><h1 class="h1">Good morning, ' + esc(S.agency.manager) + '</h1><p>' + esc(S.today) + ". Obsidia handled " + S.handledToday + " conversations since last night. " + tasksLeft + " things need you today.</p></div></div>" +
      '<div class="tiles">' +
        '<div class="card tile"><span class="label">Handled today</span><span class="big num">' + S.handledToday + '</span><p class="sub">Calls, emails, WhatsApp and texts</p></div>' +
        '<div class="card tile"><span class="label">Needs you</span><span class="big num" id="tasksLeft">' + tasksLeft + '</span><p class="sub">Viewings and key handovers</p></div>' +
        '<div class="card tile"><span class="label">Rent · November</span><span class="big num">' + eur(paid) + '</span><p class="sub">of ' + eur(total) + " · " + late + " late, reminders running</p></div>" +
        '<div class="card tile"><span class="label">Files rated</span><span class="big num">' + newApps + '</span><p class="sub">Across ' + Object.keys(S.applicants).length + " open listings</p></div>" +
      "</div>" +
      '<div class="today-grid">' +
        '<section class="card"><div class="card-head"><h2>Handled by Obsidia</h2><a href="#/inbox">Open inbox</a></div><div class="feed">' + feed + "</div></section>" +
        '<section class="card"><div class="card-head"><h2>Your day</h2><span class="muted num" style="font-size:13px">' + S.agenda.length + ' tasks</span></div><div class="agenda">' + agenda + '</div><p class="note" id="dayNote">' + (tasksLeft ? "Everything else today was handled without you." : "Your day is done. Obsidia keeps answering tonight.") + "</p></section>" +
      "</div>";
  }

  function vInbox(id) {
    var list = S.conversations.filter(function (c) {
      return S.inboxFilter === "all" || (S.inboxFilter === "tenants" ? c.role === "Tenant" : c.role !== "Tenant");
    });
    var c = id ? conv(id) : null;
    if (c) S.unread[c.id] = false;
    var items = list.map(function (x) {
      var last = x.msgs.filter(function (m) { return m[0] !== "sys"; }).slice(-1)[0];
      var p = prop(x.prop);
      return '<a class="conv' + (c && c.id === x.id ? " on" : "") + (S.unread[x.id] ? " unread" : "") + (S.fresh[x.id] ? " fresh" : "") + '" href="#/inbox/' + x.id + '">' + chan(x.chan) +
        '<div style="min-width:0"><div class="conv-top"><b>' + esc(x.name) + '</b><time class="num">' + esc(x.time) + "</time></div>" +
        '<p class="conv-prev">' + (last ? (last[0] === "agent" ? "Obsidia: " : "") + esc(last[1]) : "") + "</p>" +
        '<p class="conv-meta">' + esc(x.role) + (p ? " · " + esc(p.addr.split(",")[0]) : "") + " · " + esc((CH[x.chan] || CH.sms)[1]) + "</p></div></a>";
    }).join("");
    S.fresh = {};
    var thread = c ? threadHtml(c) : '<div class="empty"><div><p class="h2">Pick a conversation</p><p>Every call, email, WhatsApp and text, answered by Obsidia.</p></div></div>';
    mount = function () {
      $$("[data-filter]", view).forEach(function (b) { b.addEventListener("click", function () { S.inboxFilter = b.getAttribute("data-filter"); render(); }); });
      var f = $("#composer", view);
      if (f) f.addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = $("input", f), v = inp.value.trim(); if (!v) return;
        c.msgs.push(["you", v]); inp.value = "";
        appendMsg($("#msgs", view), ["you", v], c);
      });
      var m = $("#msgs", view); if (m) m.scrollTop = m.scrollHeight;
    };
    return '<div class="card inbox' + (c ? " has-thread" : "") + '"><div class="conv-list"><div class="conv-filter">' +
      [["all", "All"], ["prospects", "Prospects"], ["tenants", "Tenants"]].map(function (f) { return '<button type="button" data-filter="' + f[0] + '" class="' + (S.inboxFilter === f[0] ? "on" : "") + '">' + f[1] + "</button>"; }).join("") +
      "</div>" + items + '</div><div class="thread">' + thread + "</div></div>";
  }
  function msgHtml(m, c, fresh) {
    if (m[0] === "sys") return '<p class="msg sys' + (fresh ? " in" : "") + '">' + esc(m[1]) + "</p>";
    var who = m[0] === "agent" ? "Obsidia" : m[0] === "you" ? "You" : (c.chan === "call" ? (c.role === "Tenant" ? "Tenant" : "Caller") : c.name);
    return '<div class="msg ' + (m[0] === "contact" ? "from" : m[0]) + (fresh ? " in" : "") + '"><span class="who">' + esc(who) + '</span><div class="bubble">' + esc(m[1]) + "</div>" +
      (m[2] ? '<p class="tr">Translation: ' + esc(m[2]) + "</p>" : "") + "</div>";
  }
  function appendMsg(box, m, c) {
    if (!box) return null;
    box.insertAdjacentHTML("beforeend", msgHtml(m, c, true));
    box.scrollTop = box.scrollHeight;
    return box.lastElementChild;
  }
  function threadHtml(c) {
    var p = prop(c.prop), k = contact(c.contact);
    var facts = k ? [["Phone", k.phone], ["Email", k.email], ["Income", k.income], ["Move-in", k.movein]].filter(function (f) { return f[1]; }) : [];
    return '<div class="thread-head"><a class="icon-btn back" href="#/inbox" aria-label="Back to inbox">' + ic("back") + "</a>" + chan(c.chan) +
      '<div><b>' + esc(c.name) + "</b><span>" + esc(c.role) + (p ? " · " + esc(p.addr) : "") + " · " + esc((CH[c.chan] || CH.sms)[1]) + (c.chan === "call" ? " transcript" : "") + "</span></div></div>" +
      '<div class="thread-body"><div class="msgs" id="msgs">' + c.msgs.map(function (m) { return msgHtml(m, c); }).join("") + "</div>" +
      '<aside class="facts"><span class="label">Outcome</span>' + (c.outcomes || []).map(function (o) { return '<p class="outcome">' + ic("check") + esc(o) + "</p>"; }).join("") +
      (facts.length ? '<span class="label" style="margin-top:22px">Saved to the CRM</span><dl>' + facts.map(function (f) { return "<div><dt>" + f[0] + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join("") + "</dl>" : "") +
      (k ? '<a class="btn btn-secondary btn-sm" href="#/crm/' + k.id + '">Open in CRM</a>' : "") + "</aside></div>" +
      '<form class="composer" id="composer"><input type="text" placeholder="Take over and reply yourself" aria-label="Reply" autocomplete="off" /><button class="btn btn-primary btn-sm" type="submit">' + ic("send") + "Send</button></form>";
  }

  var CONTRACT = { "Permanent": 1, "Civil servant": 1, "Fixed-term": .55, "Freelance": .5, "Student": .3 };
  var GUAR = { "Visale": 1, "Parent": .85, "None": .25 };
  function vApplicants(pid) {
    var open = S.properties.filter(function (p) { return p.status === "open" && S.applicants[p.id]; });
    var p = prop(pid) && S.applicants[pid] ? prop(pid) : open[0];
    var rows = S.applicants[p.id].slice().sort(function (a, b) { return b[5] - a[5]; });
    var invited = S.invited[p.id];
    function row(a, i) {
      var r = i + 1, out = r > 10;
      return '<button type="button" class="rank-row' + (out ? " out" : "") + (a[8] ? " fresh" : "") + '" data-app="' + esc(a[0]) + '">' +
        '<span class="r num">' + r + '</span><span class="name">' + esc(a[0]) + '</span><span class="c num' + (a[1] >= 3 ? " good" : "") + '">' + a[1].toFixed(1) + "×</span>" +
        '<span class="c col-contract' + (CONTRACT[a[2]] === 1 ? " good" : "") + '">' + esc(a[2]) + '</span><span class="c col-guar' + (a[3] !== "None" ? " good" : "") + '">' + esc(a[3]) + "</span>" +
        '<span class="c col-file num' + (a[4] >= 95 ? " good" : "") + '">' + a[4] + '%</span><span class="score"><b class="num">' + a[5] + '</b><span class="bar"><i style="width:' + a[5] + '%"></i></span></span></button>';
    }
    var top = rows.slice(0, 10).map(row).join(""), rest = rows.slice(10).map(function (a, i) { return row(a, i + 10); }).join("");
    rows.forEach(function (a) { a[8] = false; });
    var below = Math.max(0, p.applicants - rows.length);
    mount = function () {
      $$("[data-prop]", view).forEach(function (b) { b.addEventListener("click", function () { location.hash = "#/applicants/" + b.getAttribute("data-prop"); }); });
      $$("[data-app]", view).forEach(function (b) { b.addEventListener("click", function () { applicantDrawer(p, b.getAttribute("data-app")); }); });
      var inv = $("#invite", view);
      if (inv) inv.addEventListener("click", function () { invite(p, inv); });
    };
    return '<div class="head"><div><h1 class="h1">Applicants</h1><p>Every file is read, checked and rated as it arrives. The 10 best are invited to the viewing; the others get a polite answer.</p></div></div>' +
      '<div class="app-head">' + seg(open.map(function (o) { return [o.id, o.addr.split(",")[0]]; }), p.id, "data-prop") +
      '<button class="btn btn-primary" type="button" id="invite"' + (invited ? " disabled" : "") + '><span class="spin" aria-hidden="true"></span>' + ic(invited ? "check" : "send") + '<span class="lbl">' + (invited ? "Top 10 invited" : "Invite top 10 to the viewing") + "</span></button></div>" +
      '<div class="prop-line" style="margin-bottom:16px"><span><b>' + esc(p.addr) + "</b></span><span>" + eur(p.rent) + " + " + eur(p.charges) + ' charges</span><span><b class="num">' + p.applicants + "</b> applications</span><span>Viewing <b>" + esc(p.viewing || "to schedule") + "</b></span></div>" +
      '<section class="card rank"><div class="rank-head"><span>#</span><span>Applicant</span><span>Income</span><span class="col-contract">Contract</span><span class="col-guar">Guarantor</span><span class="col-file">File</span><span>Score</span></div>' +
      top + (rows.length > 10 ? '<div class="cutoff"><span>Viewing cut-off · top 10</span></div>' + rest : "") +
      '<div class="rank-foot"><span class="num">' + (below ? below + " more files below " + rows[rows.length - 1][5] + ", answered politely by email" : rows.length + " applications rated") + "</span><span>Income = net salary ÷ (rent + charges)</span></div></section>";
  }
  function docsFor(a) {
    var d = ["ID card", "Last 3 payslips", a[2] === "Student" ? "Student card" : "Employment contract", "Last tax notice", "Proof of address"];
    if (a[3] === "Visale") d.push("Visale certificate"); else if (a[3] === "Parent") d.push("Guarantor's documents");
    var miss = Math.round((100 - a[4]) / 100 * d.length);
    return d.map(function (x, i) { return [x, i < d.length - miss]; });
  }
  function applicantDrawer(p, name) {
    var rows = S.applicants[p.id].slice().sort(function (a, b) { return b[5] - a[5]; });
    var idx = rows.map(function (a) { return a[0]; }).indexOf(name), a = rows[idx];
    if (!a) return;
    var crit = [["Income", Math.min(1, a[1] / 3.5), a[1].toFixed(1) + "× rent"], ["Contract", CONTRACT[a[2]] || .5, a[2]], ["Guarantor", GUAR[a[3]], a[3]], ["File", a[4] / 100, a[4] + "% complete"]];
    var docs = docsFor(a), miss = docs.filter(function (d) { return !d[1]; }).length;
    openDrawer('<div class="drawer-head"><div><p class="h2">' + esc(a[0]) + '</p><p class="muted" style="font-size:14px">' + esc(p.addr) + " · via " + esc(a[6]) + " · " + esc(a[7]) + '</p></div><button class="icon-btn" type="button" data-close aria-label="Close">' + ic("x") + "</button></div>" +
      '<div class="drawer-body"><div class="big-score"><b class="num">' + a[5] + '</b><span class="muted">Rank ' + (idx + 1) + " of " + p.applicants + (idx < 10 ? " · invited to the viewing" : " · below the cut-off") + "</span></div>" +
      '<div><span class="label" style="display:block;margin-bottom:14px">How the score is built</span><div class="crit">' + crit.map(function (c) {
        return '<div class="crit-row"><span>' + c[0] + '</span><span class="bar"><i style="width:' + Math.round(c[1] * 100) + '%"></i></span><em>' + esc(c[2]) + "</em></div>";
      }).join("") + "</div></div>" +
      '<div><span class="label" style="display:block;margin-bottom:6px">Documents · ' + (docs.length - miss) + " of " + docs.length + '</span><ul class="docs">' + docs.map(function (d) {
        return '<li class="' + (d[1] ? "have" : "miss") + '">' + ic(d[1] ? "check" : "x") + esc(d[0]) + (d[1] ? "" : " · requested by email") + "</li>";
      }).join("") + "</ul></div>" +
      '<p class="muted" style="font-size:13px">Income ' + eur(Math.round(a[1] * (p.rent + p.charges) / 10) * 10) + " net a month for " + eur(p.rent + p.charges) + " rent and charges.</p></div>");
  }
  function invite(p, btn) {
    btn.classList.add("is-loading"); var id = run;
    setTimeout(function () {
      S.invited[p.id] = true;
      btn.classList.remove("is-loading"); btn.disabled = true; btn.querySelector(".lbl").textContent = "Top 10 invited";
      btn.querySelector("use").setAttribute("href", "#i-check");
      var n = Math.min(10, S.applicants[p.id].length);
      S.feed.unshift({ chan: "invite", who: p.addr.split(",")[0], what: n + " applicants invited to the viewing " + (p.viewing || "") + " by email and WhatsApp.", time: tick(), href: "#/applicants/" + p.id, fresh: true });
      S.handledToday += n;
      toast(n + " invitations sent by email and WhatsApp · " + (p.viewing || "viewing"));
      updateCounts();
    }, reduce ? 50 : 1400);
  }

  function vCrm(id) {
    var list = S.contacts.filter(function (k) { return S.crmFilter === "all" || k.type.toLowerCase() === S.crmFilter; });
    mount = function () {
      $$("[data-cf]", view).forEach(function (b) { b.addEventListener("click", function () { S.crmFilter = b.getAttribute("data-cf"); render(); }); });
      $$("[data-k]", view).forEach(function (r) { r.addEventListener("click", function () {
        var kid = r.getAttribute("data-k");
        if (location.hash === "#/crm/" + kid) contactDrawer(contact(kid)); else location.hash = "#/crm/" + kid;
      }); });
      S.contacts.forEach(function (k) { k.fresh = false; });
      if (id && contact(id)) contactDrawer(contact(id));
    };
    return '<div class="head"><div><h1 class="h1">CRM</h1><p>Everyone who calls, writes or applies gets a record. Obsidia fills it from the conversation; nobody types anything.</p></div></div>' +
      '<div style="margin-bottom:16px">' + seg([["all", "All"], ["prospect", "Prospects"], ["applicant", "Applicants"], ["tenant", "Tenants"]], S.crmFilter, "data-cf") + "</div>" +
      '<section class="card table-wrap"><table class="table"><thead><tr><th>Contact</th><th class="hide-sm">Property</th><th class="hide-sm">Phone</th><th class="hide-sm">Income</th><th>Last action</th></tr></thead><tbody>' +
      list.map(function (k) {
        var p = prop(k.prop);
        return '<tr data-k="' + k.id + '" style="cursor:pointer" class="' + (k.fresh ? "fresh" : "") + '"><td><b>' + esc(k.name) + "</b><small>" + esc(k.type) + '</small></td><td class="hide-sm">' + esc(p ? p.addr.split(",")[0] : "—") +
          '</td><td class="hide-sm num">' + esc(k.phone) + '</td><td class="hide-sm">' + esc(k.income || "—") + "</td><td>" + esc(k.last) + "<small>" + esc(k.source) + "</small></td></tr>";
      }).join("") + "</tbody></table></section>";
  }
  var CRM_FIELDS = [["phone", "Phone"], ["email", "Email"], ["income", "Income"], ["contract", "Contract"], ["movein", "Move-in date"]];
  function contactDrawer(k, fill) {
    var p = prop(k.prop);
    var fields = CRM_FIELDS.filter(function (f) { return k[f[0]]; });
    openDrawer('<div class="drawer-head"><div><p class="h2">' + esc(k.name) + '</p><p class="muted" style="font-size:14px">' + esc(k.type) + (p ? " · " + esc(p.addr) : "") + '</p></div><button class="icon-btn" type="button" data-close aria-label="Close">' + ic("x") + "</button></div>" +
      '<div class="drawer-body"><div class="facts" style="border:0;padding:0"><span class="label">Filled by Obsidia · ' + esc(k.source) + '</span><dl id="kFields">' +
      fields.map(function (f) { return '<div><dt>' + f[1] + '</dt><dd data-f="' + f[0] + '">' + (fill ? "" : esc(k[f[0]])) + "</dd></div>"; }).join("") + "</dl>" +
      '<span class="label">Last action</span><p class="outcome">' + ic("check") + esc(k.last) + "</p></div>" +
      '<div class="drawer-actions">' + (convFor(k) ? '<a class="btn btn-secondary btn-sm" href="#/inbox/' + convFor(k).id + '">Open conversation</a>' : "") + "</div></div>");
    if (fill) {
      var id = run, i = 0;
      (function next() {
        if (i >= fields.length) return;
        var f = fields[i++], dd = $('[data-f="' + f[0] + '"]', drawer);
        if (dd) { dd.classList.add("brass"); typeChars(dd, k[f[0]], 28, id, function () { dd.classList.remove("brass"); later(next, 220, id); }); }
      })();
    }
  }
  function convFor(k) { return S.conversations.filter(function (c) { return c.contact === k.id; })[0]; }

  function tenantStatus(t) {
    if (t.status === "paid") return '<span class="status ok">Paid</span>';
    if (t.status === "late") return '<span class="status late">' + t.days + " days late</span>";
    if (t.status === "promised") return '<span class="status brass">Promised · ' + esc(t.promise) + "</span>";
    return '<span class="status muted">Due</span>';
  }
  function vTenants() {
    var total = 0, paid = 0, lateSum = 0, late = 0;
    S.tenants.forEach(function (t) { total += t.rent; if (t.status === "paid") paid += t.rent; if (t.status === "late") { late++; lateSum += t.rent; } });
    var open = S.requests.filter(function (r) { return r.state !== "done"; }).length;
    mount = function () {
      $$("[data-call]", view).forEach(function (b) { b.addEventListener("click", function () { callTenant(b.getAttribute("data-call")); }); });
      S.tenants.forEach(function (t) { t.fresh = false; }); S.requests.forEach(function (r) { r.fresh = false; });
    };
    return '<div class="head"><div><h1 class="h1">Tenants</h1><p>Rent is checked every morning. Late payments get a reminder, then a call. Requests are answered and booked with your contractors.</p></div></div>' +
      '<div class="tiles t3">' +
        '<div class="card tile"><span class="label">Collected</span><span class="big num">' + eur(paid) + '</span><p class="sub">of ' + eur(total) + " due in November</p></div>" +
        '<div class="card tile"><span class="label">Late</span><span class="big num' + (late ? " late" : "") + '">' + eur(lateSum) + '</span><p class="sub">' + late + " tenant" + (late === 1 ? "" : "s") + " · Obsidia is following up</p></div>" +
        '<div class="card tile"><span class="label">Requests</span><span class="big num">' + open + '</span><p class="sub">Booked with contractors</p></div>' +
      "</div>" +
      '<section class="card table-wrap" style="margin-bottom:16px"><div class="card-head"><h2>Rent · November</h2></div><table class="table"><thead><tr><th>Tenant</th><th class="right">Rent</th><th>Status</th><th class="hide-sm">Last action</th><th></th></tr></thead><tbody>' +
      S.tenants.map(function (t) {
        return '<tr class="' + (t.fresh ? "fresh" : "") + '"><td><b>' + esc(t.name) + "</b><small>" + esc(t.unit) + '</small></td><td class="right num">' + eur(t.rent) + "</td><td>" + tenantStatus(t) + '</td><td class="hide-sm muted">' + esc(t.last) + '</td><td class="right">' +
          (t.status === "late" ? '<button class="btn btn-secondary btn-sm" type="button" data-call="' + t.id + '">' + ic("phone") + 'Call now</button>' : "") + "</td></tr>";
      }).join("") + "</tbody></table></section>" +
      '<section class="card"><div class="card-head"><h2>Requests</h2><span class="muted" style="font-size:13px">Answered on WhatsApp, booked automatically</span></div><div class="feed">' +
      S.requests.map(function (r) {
        return '<a href="#/tenants" class="' + (r.fresh ? "fresh" : "") + '">' + chan("request") + '<div><div class="who">' + esc(r.what) + '</div><div class="what">' + esc(r.tenant) + " · " + esc(r.unit) + '</div><div class="what ' + (r.state === "done" ? "ok" : "brass") + '">' + esc(r.action) + '</div></div><time class="num">' + esc(r.time) + "</time></a>";
      }).join("") + "</div></section>";
  }

  function propStatus(p) {
    if (p.status === "open") return '<span class="brass">Applications open · ' + p.applicants + " files</span>";
    if (p.status === "let") return '<span class="ok">Let</span>';
    return "<span>" + esc(p.note || "") + "</span>";
  }
  function vProperties() {
    mount = function () { $$("#addProp, [data-add]", view).forEach(function (a) { a.addEventListener("click", onboarding); }); };
    return '<div class="head"><div><h1 class="h1">Properties</h1><p>Each listing has its own Obsidia phone number and email address. Put them on your listings and the agent answers from the next message on.</p></div>' +
      '<button class="btn btn-primary" type="button" data-add>' + ic("plus") + "Add a property</button></div>" +
      '<div class="props">' + S.properties.map(function (p) {
        return '<article class="card prop' + (p.fresh ? " fresh-card" : "") + '"><div class="prop-photo">' + (p.photo ? '<img src="' + esc(p.photo) + '" alt="" loading="lazy" onerror="this.remove()">' : "") + "</div>" +
          '<div class="prop-body"><h3>' + esc(p.title) + '</h3><p class="addr">' + esc(p.addr) + '</p><p style="font-size:13.5px;margin-top:4px">' + propStatus(p) + "</p>" +
          '<div class="prop-facts"><span><b class="num">' + p.area + "</b> m²</span><span><b class=\"num\">" + p.rooms + "</b> room" + (p.rooms > 1 ? "s" : "") + '</span><span><b class="num">' + eur(p.rent) + "</b> + " + eur(p.charges) + "</span></div>" +
          '<div class="prop-contacts"><div><span>' + esc(p.phone) + '</span><button class="copy" type="button" data-copy="' + esc(p.phone) + '">Copy</button></div><div><span>' + esc(p.email) + '</span><button class="copy" type="button" data-copy="' + esc(p.email) + '">Copy</button></div></div></div></article>';
      }).join("") + (S.properties.forEach(function (p) { p.fresh = false; }), "") +
      '<button class="card prop-add" type="button" id="addProp"><div><span class="plus">' + ic("plus") + '</span><b style="display:block;color:var(--ivory);font-weight:500">Add a property</b><span style="font-size:13.5px">Ready in 2 minutes</span></div></button></div>';
  }

  var SUGGEST = ["Which tenants are late?", "When was the bathroom at 14 rue Gambetta renovated?", "Who are the best applicants for rue Oberkampf?", "What's on my agenda today?", "What is the rent at 8 avenue Foch?", "Any open repair requests?"];
  function vAssistant() {
    mount = function () {
      var f = $("#askForm", view), inp = $("input", f), box = $("#msgs", view);
      f.addEventListener("submit", function (e) { e.preventDefault(); var q = inp.value.trim(); if (!q) return; inp.value = ""; ask(q, box); });
      $$("[data-q]", view).forEach(function (b) { b.addEventListener("click", function () { ask(b.getAttribute("data-q"), box); }); });
      $("#mic", view).addEventListener("click", talk);
      box.scrollTop = box.scrollHeight;
    };
    var hist = S.chat.length ? S.chat.map(function (m) { return chatMsg(m[0], m[1]); }).join("") :
      '<div class="msg agent"><span class="who">Obsidia</span><div class="bubble">Ask me anything about your properties, tenants, applicants or today. You can type or talk.</div></div>';
    return '<div class="head"><div><h1 class="h1">Assistant</h1><p>Your own assistant for the whole portfolio: any flat, any tenant, any renovation. Type a question or ask it out loud.</p></div></div>' +
      '<div class="agent-page"><section class="card chat"><div class="msgs" id="msgs" aria-live="polite">' + hist + '</div><form class="composer" id="askForm"><input type="text" placeholder="Ask about a flat, a tenant, a renovation…" aria-label="Question" autocomplete="off" /><button class="btn btn-primary btn-sm" type="submit">' + ic("send") + "Ask</button></form></section>" +
      '<aside class="card"><div class="voice"><div class="agent-orb" id="vOrbWrap"><span class="agent-aura"></span><div class="orb" id="vOrb" data-state="idle"><span class="orb-ring"></span><span class="orb-ring"></span></div></div>' +
      '<p class="voice-state" id="vState">Tap to talk</p><div class="wave" id="vWave" aria-hidden="true"></div><button class="mic" id="mic" type="button" aria-label="Ask out loud">' + ic("mic") + "</button></div>" +
      '<div class="card-head" style="border-top:1px solid var(--line)"><h2>Try asking</h2></div><div class="suggest" style="padding-top:14px">' + SUGGEST.map(function (q) { return '<button type="button" data-q="' + esc(q) + '">' + esc(q) + "</button>"; }).join("") + "</div></aside></div>";
  }
  function chatMsg(who, html) {
    return '<div class="msg ' + (who === "you" ? "you" : "agent") + ' in"><span class="who">' + (who === "you" ? "You" : "Obsidia") + '</span><div class="bubble">' + html + "</div></div>";
  }
  function findProp(q) {
    var keys = { gambetta: /gambetta/, oberkampf: /oberkampf/, foch: /foch/, hugo: /hugo|victor/, lumiere: /cler/ };
    for (var k in keys) if (keys[k].test(q)) return prop(k);
    return null;
  }
  function answer(q) {
    var s = q.toLowerCase(), p = findProp(s);
    if (/late|unpaid|owe|behind/.test(s)) {
      var late = S.tenants.filter(function (t) { return t.status === "late"; });
      if (!late.length) return "Nobody is late. Every rent due so far this month has been paid or promised.";
      return late.length + " tenant" + (late.length > 1 ? "s are" : " is") + ' late this month:<ul class="answer-list">' + late.map(function (t) { return "<li><span>" + esc(t.name) + " · " + esc(t.unit.split(",")[0]) + '</span><span class="num">' + eur(t.rent) + " · " + t.days + " days</span></li>"; }).join("") + "</ul>Reminders are running. I can call them if you want: open Tenants and press Call now.";
    }
    if (/renovat|works|boiler|roof|bathroom|kitchen|repair done|refurb/.test(s)) {
      if (!p) return "Tell me which property and I'll list the works. For example: 14 rue Gambetta, 8 avenue Foch or 5 rue Oberkampf.";
      var focus = p.works.filter(function (w) { return s.split(/\W+/).some(function (word) { return word.length > 3 && w[0].toLowerCase().indexOf(word) > -1; }); });
      var lead = focus.length ? esc(focus[0][0]) + " in " + esc(focus[0][1]) + "." : "Here is what was done at " + esc(p.addr.split(",")[0]) + ".";
      return lead + '<ul class="answer-list">' + p.works.map(function (w) { return "<li><span>" + esc(w[0]) + '</span><span class="num muted">' + esc(w[1]) + "</span></li>"; }).join("") + "</ul>";
    }
    if (/applicant|best|top|candidate|file/.test(s)) {
      var pp = p && S.applicants[p.id] ? p : prop("gambetta");
      var r = S.applicants[pp.id].slice().sort(function (a, b) { return b[5] - a[5]; }).slice(0, 3);
      return "Best files for " + esc(pp.addr.split(",")[0]) + ':<ul class="answer-list">' + r.map(function (a) { return "<li><span>" + esc(a[0]) + " · " + a[1].toFixed(1) + "× rent, " + esc(a[2].toLowerCase()) + '</span><span class="num">' + a[5] + "</span></li>"; }).join("") + "</ul>";
    }
    if (/agenda|today|schedule|viewing|visit|check-in|checkout|check-out/.test(s)) {
      return "Today you have " + S.agenda.length + ' things:<ul class="answer-list">' + S.agenda.map(function (a) { return '<li><span>' + esc(a.kind) + " · " + esc(a.where.split(" · ")[0]) + '</span><span class="num">' + a.time + "</span></li>"; }).join("") + "</ul>Everything else was handled: " + S.handledToday + " conversations so far.";
    }
    if (/rent|price|charges|cost/.test(s)) {
      if (!p) return "Which property? I have rents for all " + S.properties.length + " of them.";
      return "Rent at " + esc(p.addr) + " is " + eur(p.rent) + " a month plus " + eur(p.charges) + " charges. " + esc(p.facts);
    }
    if (/request|plumb|leak|intercom|broken|contractor/.test(s)) {
      var open = S.requests.filter(function (x) { return x.state !== "done"; });
      return open.length + ' open request' + (open.length === 1 ? "" : "s") + ', all booked:<ul class="answer-list">' + open.map(function (x) { return "<li><span>" + esc(x.what) + " · " + esc(x.tenant) + "</span><span class=\"muted\">" + esc(x.action.split(" · ")[1] || "") + "</span></li>"; }).join("") + "</ul>";
    }
    if (p) return esc(p.title) + ", " + esc(p.addr) + ". " + p.area + " m², " + eur(p.rent) + " plus " + eur(p.charges) + " charges. " + esc(p.facts);
    return "I can answer questions about your properties, tenants, applicants, renovations and today's activity. Try: “Which tenants are late?”";
  }
  function ask(q, box, done) {
    S.chat.push(["you", esc(q)]);
    box.insertAdjacentHTML("beforeend", chatMsg("you", esc(q)));
    box.insertAdjacentHTML("beforeend", '<div class="msg agent in" id="thinking"><span class="who">Obsidia</span><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div></div>');
    box.scrollTop = box.scrollHeight;
    var orb = $("#vOrb"); if (orb && orb.dataset.state === "idle") orb.dataset.state = "thinking";
    setTimeout(function () {
      var a = answer(q), t = $("#thinking", box);
      if (t) t.remove();
      S.chat.push(["agent", a]);
      box.insertAdjacentHTML("beforeend", chatMsg("agent", a));
      box.scrollTop = box.scrollHeight;
      if (orb && orb.dataset.state === "thinking") orb.dataset.state = "idle";
      done && done(a);
    }, reduce ? 50 : 900);
  }

  /* Voice: a scripted spoken question, then the answer with the orb speaking */
  var VOICE_Q = ["When was the boiler at 14 rue Gambetta replaced?", "Which tenants are late?", "What's on my agenda today?"], vq = 0;
  function talk() {
    var id = ++run, orb = $("#vOrb"), st = $("#vState"), mic = $("#mic"), box = $("#msgs", view);
    if (!orb) return;
    var wave = makeWave($("#vWave"), 26, orb);
    var q = VOICE_Q[vq++ % VOICE_Q.length];
    hush();
    orb.dataset.state = "listening"; st.textContent = "Listening"; mic.classList.add("live"); wave.set(.4);
    var heard = false;
    function thinkThenAnswer() {
      if (heard || id !== run) return; heard = true;
      wave.set(0); orb.dataset.state = "thinking"; st.textContent = "Thinking"; mic.classList.remove("live");
      ask(q, box, function (a) {
        if (id !== run) return;
        orb.dataset.state = "speaking"; st.textContent = "Answering"; wave.set(1);
        var doneTalking = function () { if (id !== run) return; wave.set(0); orb.dataset.state = "idle"; st.textContent = "Tap to talk"; wave.stop(); };
        if (soundOn && synth) say(plain(a), "agent", doneTalking); else later(doneTalking, 2600, id);
      });
    }
    /* the manager's question, read in a second voice so the demo has both sides */
    if (soundOn && synth) say(q, "caller", function () { later(thinkThenAnswer, 250, id); });
    else later(thinkThenAnswer, 1800, id);
  }

  function plain(html) {
    var t = document.createElement("div"); t.innerHTML = html;
    $$("li", t).forEach(function (li) { li.textContent = [].map.call(li.children, function (c) { return c.textContent; }).join(", ") + ". "; });
    return t.textContent.replace(/\s+/g, " ").trim();
  }

  function makeWave(el, n, orb) {
    if (!el) return { set: function () {}, stop: function () {} };
    el.innerHTML = new Array(n + 1).join("<i></i>");
    var bars = $$("i", el), level = 0, t = 0, wrap = orb && orb.parentNode;
    function frame() {
      var sum = 0;
      bars.forEach(function (b, i) {
        var h = level ? 4 + Math.abs(Math.sin(t / 3 + i * .7) * Math.random()) * 26 * level : 4;
        b.style.height = h + "px"; sum += h;
      });
      t++;
      var amp = level ? Math.min(1, (sum / bars.length - 4) / 14) : 0;
      if (wrap) wrap.style.setProperty("--amp", amp.toFixed(3));
      if (orb) { orb.style.setProperty("--sx", (1 + amp * .06).toFixed(3)); orb.style.setProperty("--sy", (1 - amp * .05).toFixed(3)); }
    }
    var timer = reduce ? 0 : setInterval(frame, 90);
    return { set: function (l) { level = l; if (reduce) frame(); }, stop: function () { clearInterval(timer); level = 0; frame(); } };
  }

  /* ---------- speech: browser voices (Web Speech API), one voice per speaker ---------- */
  var synth = window.speechSynthesis || null;
  var soundOn = !!synth;
  try { if (localStorage.getItem("obsidia.sound") === "off") soundOn = false; } catch (e) {}
  var PREF = {
    agent: ["Google UK English Female", "Microsoft Sonia", "Microsoft Libby", "Microsoft Jenny", "Microsoft Aria", "Samantha", "Serena", "Microsoft Hazel", "Karen", "Tessa", "Microsoft Zira"],
    caller: ["Google UK English Male", "Microsoft Ryan", "Microsoft Guy", "Microsoft Thomas", "Microsoft David", "Daniel", "Alex", "Fred", "Microsoft Mark", "Rishi"],
    callerF: ["Microsoft Zira", "Microsoft Hazel", "Karen", "Moira", "Tessa", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Samantha"]
  };
  var picked = {};
  function voices() { return synth ? synth.getVoices().filter(function (v) { return /^en(-|_|$)/i.test(v.lang); }) : []; }
  function pickVoice(role) {
    if (picked[role] !== undefined) return picked[role];
    var vs = voices(); if (!vs.length) return null;
    var taken = Object.keys(picked).map(function (k) { return picked[k] && picked[k].name; });
    if (role !== "agent" && picked.agent === undefined) pickVoice("agent");
    taken = Object.keys(picked).map(function (k) { return picked[k] && picked[k].name; });
    var v = null;
    (PREF[role] || []).some(function (n) {
      v = vs.filter(function (x) { return x.name.toLowerCase().indexOf(n.toLowerCase()) > -1 && taken.indexOf(x.name) < 0; })[0] || null;
      return !!v;
    });
    if (!v && role === "callerF") v = picked.agent;   /* no second female voice: agent's voice, lower pitch */
    if (!v) v = vs.filter(function (x) { return taken.indexOf(x.name) < 0; })[0] || vs[0];
    picked[role] = v;
    return v;
  }
  if (synth && synth.addEventListener) synth.addEventListener("voiceschanged", function () { picked = {}; });
  function speakable(text) {
    return String(text).replace(/€\s?([\d.,]+)/g, "$1 euros").replace(/\bapt\b/gi, "apartment").replace(/\s·\s/g, ", ");
  }
  /* Speaks one line. done() fires when the voice ends, or at once when sound is off. */
  function say(text, role, done) {
    if (!soundOn || !synth) { done && done(); return; }
    var u = new SpeechSynthesisUtterance(speakable(text)), v = pickVoice(role);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
    var same = v && role !== "agent" && picked.agent && picked.agent.name === v.name;
    u.rate = role === "agent" ? 1.04 : 1;
    u.pitch = role === "agent" ? 1.05 : same ? .75 : .95;
    var fin = false, guard = setTimeout(end, 2500 + text.split(" ").length * 520);
    function end() { if (fin) return; fin = true; clearTimeout(guard); done && done(); }
    u.onend = end; u.onerror = end;
    synth.speak(u);
    if (synth.paused) synth.resume();
  }
  function hush() { if (synth) synth.cancel(); }
  function perWord(text, agent) { return soundOn && synth ? 330 : agent ? 85 : 95; }
  var soundBtn = $("#soundBtn");
  function paintSound() {
    if (!soundBtn) return;
    soundBtn.hidden = !synth;
    soundBtn.classList.toggle("off", !soundOn);
    soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    soundBtn.setAttribute("aria-label", soundOn ? "Mute the voices" : "Turn the voices on");
    soundBtn.title = soundOn ? "Voices on" : "Voices off";
  }
  if (soundBtn) soundBtn.addEventListener("click", function () {
    soundOn = !soundOn; if (!soundOn) hush();
    try { localStorage.setItem("obsidia.sound", soundOn ? "on" : "off"); } catch (e) {}
    paintSound();
    toast(soundOn ? "Voices on" : "Voices off");
  });
  paintSound();

  /* ---------- call modal ---------- */
  function openCall(o) {
    var id = ++run;
    closeDrawer(); hush();
    openModal('<div class="modal-head"><span class="label">' + esc(o.dir) + " call · Obsidia agent</span>" + '<button class="icon-btn" type="button" data-close aria-label="Close">' + ic("x") + "</button></div>" +
      '<div class="modal-body"><div class="call-top"><div class="agent-orb"><span class="agent-aura"></span><div class="orb" id="cOrb" data-state="listening"><span class="orb-ring"></span><span class="orb-ring"></span></div></div>' +
      "<div><b>" + esc(o.who) + "</b><span>" + esc(o.sub) + '</span></div><span class="call-time live num" id="cTime">00:00</span></div>' +
      '<div class="wave" id="cWave" aria-hidden="true"></div><div class="call-lines" id="cLines" aria-live="polite"></div><div class="call-result" id="cRes" hidden></div>' +
      '<div class="drawer-actions" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" type="button" id="cSkip">Skip to the end</button><button class="btn btn-primary btn-sm" type="button" data-close hidden id="cDone">Done</button></div></div>',
      "call-modal", function () { if (id === run) finish(true); });
    var orb = $("#cOrb"), lines = $("#cLines"), wave = makeWave($("#cWave"), 44, orb), secs = 0, k = 0, ended = false;
    var timer = setInterval(function () { if (id !== run || ended) return clearInterval(timer); secs += 3; $("#cTime").textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0"); }, 1000);
    function finish(silent) {
      if (ended) return; ended = true; clearInterval(timer); wave.stop(); hush();
      lines.innerHTML = o.lines.map(function (l) { return '<p class="cline ' + l[0] + '"><span class="who">' + esc(l[1]) + "</span>" + esc(l[2]) + "</p>"; }).join("");
      orb.dataset.state = "idle"; $("#cTime").classList.remove("live");
      var res = $("#cRes"); res.hidden = false;
      res.innerHTML = '<span class="label">Saved</span>' + o.results.map(function (r, i) { return '<p style="animation-delay:' + i * 120 + 'ms">' + ic("check") + esc(r) + "</p>"; }).join("");
      $("#cSkip").hidden = true; $("#cDone").hidden = false;
      o.onDone && o.onDone(silent);
    }
    $("#cSkip").addEventListener("click", function () { finish(false); });
    (function next() {
      if (id !== run || ended) return;
      if (k >= o.lines.length) return later(function () { finish(false); }, 500, id);
      var l = o.lines[k++], p = document.createElement("p"), who = document.createElement("span"), txt = document.createElement("span");
      p.className = "cline in " + l[0]; who.className = "who"; who.textContent = l[1];
      p.appendChild(who); p.appendChild(txt); lines.appendChild(p);
      var agent = l[0] === "agent", typed = false, spoken = false;
      orb.dataset.state = agent ? "speaking" : "listening"; wave.set(agent ? 1 : .45);
      function both() { if (typed && spoken && id === run && !ended) { wave.set(.05); later(next, 350, id); } }
      typeText(txt, l[2], perWord(l[2], agent), id, function () { typed = true; both(); });
      say(l[2], agent ? "agent" : (o.callerVoice || "caller"), function () { spoken = true; both(); });
    })();
  }

  function callTenant(tid) {
    var t = S.tenants.filter(function (x) { return x.id === tid; })[0];
    if (!t) return;
    var first = t.name.split(" ")[1];
    openCall({
      dir: "Outgoing", who: t.name, callerVoice: t.title === "Ms" ? "callerF" : "caller", sub: "Tenant · " + t.unit.split(",")[0] + " · " + eur(t.rent) + " late",
      lines: [["agent", "Obsidia", "Hello " + (t.title || "") + " " + first + ", Obsidia calling for your landlord. Your November rent of " + eur(t.rent) + " hasn't arrived yet. When can you pay it?"],
              ["caller", "Tenant", "Sorry, I forgot. I'll send it tomorrow."],
              ["agent", "Obsidia", "Noted for Friday 20 November. I'll text you a confirmation now."]],
      results: ["Payment promised · Fri 20 Nov", "Confirmation sent by text", "Logged in the CRM"],
      onDone: function () {
        if (t.status !== "late") return;
        t.status = "promised"; t.promise = "Fri 20 Nov"; t.last = "Called today " + tick() + ", confirmation sent by text"; t.fresh = true;
        S.feed.unshift({ chan: "call", who: t.name, what: "Called about " + eur(t.rent) + " late rent. Payment promised for Friday 20 November.", time: t.last.split(" ")[2].replace(",", ""), href: "#/tenants", fresh: true });
        S.handledToday++;
        if (route().name === "tenants") render();
        updateCounts();
      }
    });
  }

  /* ---------- onboarding: add a property ---------- */
  function onboarding() {
    var id = ++run;
    openModal('<div class="modal-head"><div><span class="label">Add a property · step 1 of 2</span><p class="h2" style="margin-top:10px">Tell Obsidia about the flat</p></div><button class="icon-btn" type="button" data-close aria-label="Close">' + ic("x") + "</button></div>" +
      '<form class="modal-body" id="onbForm"><div class="steps-line"><i class="on"></i><i></i></div>' +
      '<label class="field"><span>Address</span><input name="addr" value="27 rue des Martyrs, Paris 9e" required /></label>' +
      '<label class="field"><span>Listing title</span><input name="title" value="Quiet 2-room flat with balcony" required /></label>' +
      '<div class="row2"><label class="field"><span>Rent (€ / month)</span><input name="rent" inputmode="numeric" value="1290" required /></label><label class="field"><span>Charges (€ / month)</span><input name="charges" inputmode="numeric" value="70" required /></label></div>' +
      '<div class="row2"><label class="field"><span>Area (m²)</span><input name="area" inputmode="numeric" value="44" required /></label><label class="field"><span>Rooms</span><input name="rooms" inputmode="numeric" value="2" required /></label></div>' +
      '<button class="btn btn-primary" type="submit">Create the contacts' + ic("arrow") + "</button></form>");
    $("#onbForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, num = function (n) { return parseInt(String(f[n].value).replace(/\D/g, ""), 10) || 0; };
      var addr = f.addr.value.trim(), slug = (addr.replace(/^\d+\s*/, "").split(",")[0].split(" ").pop() || "flat").toLowerCase().normalize("NFD").replace(/[^a-z]/g, "") || "flat";
      var p = { id: "new" + Date.now(), title: f.title.value.trim(), addr: addr, area: num("area"), rooms: num("rooms") || 1, rent: num("rent"), charges: num("charges"), status: "open", applicants: 0, viewing: "", phone: "04 28 29 61 58", email: slug + "@in.obsidia.app", works: [], facts: "New listing." };
      var b = $(".modal-body", modal);
      $(".modal-head .label", modal).textContent = "Add a property · step 2 of 2";
      $(".modal-head .h2", modal).textContent = "Setting up the agent";
      b.outerHTML = '<div class="modal-body"><div class="steps-line"><i class="on"></i><i class="on"></i></div><div class="gen" id="gen">' +
        ["Creating a phone number", "Creating an email address", "Teaching the agent about " + addr.split(",")[0], "Connecting your CRM"].map(function (s) { return "<p>" + ic("check") + esc(s) + "</p>"; }).join("") + "</div></div>";
      var steps = $$("#gen p", modal), i = 0;
      (function next() {
        if (id !== run) return;
        if (i > 0) steps[i - 1].classList.add("ok-on");
        if (i >= steps.length) return later(done, 400, id);
        steps[i++].classList.add("on"); later(next, 650, id);
      })();
      function done() {
        S.properties.unshift(Object.assign(p, { fresh: true }));
        $(".modal-head .h2", modal).textContent = "Put these on your listing";
        $(".modal-body", modal).innerHTML = '<div class="contact-box"><div class="contact"><div><small>Phone</small><b>' + p.phone + '</b></div><button class="copy" type="button" data-copy="' + p.phone + '">Copy</button></div>' +
          '<div class="contact"><div><small>Email</small><b>' + esc(p.email) + '</b></div><button class="copy" type="button" data-copy="' + esc(p.email) + '">Copy</button></div></div>' +
          '<p class="muted" style="font-size:14px">Replace the phone number and email address on your listings with these. From the next message on, Obsidia answers, collects details and rates every file.</p>' +
          '<button class="btn btn-primary" type="button" data-close>Done</button>';
        toast(p.addr.split(",")[0] + " is live. Obsidia answers from now on.");
        if (route().name === "properties") render();
        updateCounts();
      }
    });
  }

  /* ---------- demo scenarios 01-06 ---------- */
  var DEMOS = [
    ["01", "phone", "Phone agent answers a call", "A prospect calls about rue Oberkampf"],
    ["02", "chat", "Email and WhatsApp replies", "A WhatsApp in Italian, answered in seconds"],
    ["03", "rank", "Applicant rated and ranked", "A new file arrives and is scored"],
    ["04", "db", "CRM filled automatically", "Watch a contact record fill itself"],
    ["05", "receipt", "Missed rent and tenant requests", "The agent calls a late tenant"],
    ["06", "ask", "Ask your assistant", "A question about a renovation"]
  ];
  var menu = $("#demoMenu"), demoBtn = $("#demoBtn");
  menu.innerHTML = DEMOS.map(function (d, i) {
    return '<button type="button" role="menuitem" data-demo="' + i + '">' + ic(d[1]) + '<div><b><span class="mono brass" style="display:inline;font-size:12px;margin-right:8px">' + d[0] + "</span>" + esc(d[2]) + "</b><span>" + esc(d[3]) + "</span></div></button>";
  }).join("") + '<hr /><button type="button" role="menuitem" data-demo="reset">' + ic("reset") + "<div><b>Reset the demo</b><span>Back to this morning's data</span></div></button>";
  function closeMenu() { menu.classList.remove("open"); demoBtn.setAttribute("aria-expanded", "false"); }
  demoBtn.addEventListener("click", function (e) { e.stopPropagation(); var o = !menu.classList.contains("open"); menu.classList.toggle("open", o); demoBtn.setAttribute("aria-expanded", o); });
  document.addEventListener("click", function (e) { if (!e.target.closest(".demo")) closeMenu(); });
  menu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-demo]"); if (!b) return;
    closeMenu(); closeDrawer(); hush();
    var d = b.getAttribute("data-demo");
    if (d === "reset") { run++; closeModal(); reset(); render(); updateCounts(); toast("Demo reset to this morning"); return; }
    [demoCall, demoMessage, demoFile, demoCrm, demoTenant, demoAsk][+d]();
  });
  function go(hash, cb) {
    if (location.hash === hash) { render(); cb && setTimeout(cb, 50); return; }
    pending = cb; location.hash = hash;
  }
  var pending = null;

  function ensureAntoine() {
    var k = contact("kA");
    if (!k) {
      k = { id: "kA", name: "Antoine Roy", type: "Prospect", prop: "oberkampf", phone: "06 47 82 19 63", email: "antoine.roy@mail.fr", income: "€4,300 net / month", contract: "Permanent", movein: "15 December", source: "Call · " + tick() + " today", last: "Documents list and viewing slots sent by text", fresh: true };
      S.contacts.unshift(k);
    }
    return k;
  }
  function demoCall() {
    go("#/today", function () {
      openCall({
        dir: "Incoming", who: "06 47 82 19 63", callerVoice: "caller", sub: "Prospect · 5 rue Oberkampf listing",
        lines: [["caller", "Caller", "Hi, I'm calling about the 2-room flat on rue Oberkampf. Is it still available?"],
                ["agent", "Obsidia", "Yes, from 15 December. Rent is €1,320 plus €80 charges, third floor without a lift. May I take your details?"],
                ["caller", "Caller", "Antoine Roy. I'm on a permanent contract, €4,300 net a month."],
                ["agent", "Obsidia", "Thank you, Antoine. I'm texting you the documents list and two viewing slots: Saturday 11:00 or Monday 18:30."]],
        results: ["Lead created in the CRM · Antoine Roy", "Income, contract and move-in date saved", "Documents list and viewing slots sent by text"],
        onDone: function () {
          if (conv("cA")) return;
          var k = ensureAntoine();
          S.conversations.unshift({ id: "cA", name: "Antoine Roy", role: "Prospect", prop: "oberkampf", chan: "call", time: k.source.split(" · ")[1].split(" ")[0], contact: "kA",
            summary: "Asked about 5 rue Oberkampf. Contact details, income and move-in date collected.",
            outcomes: ["Lead created in the CRM", "Documents list and viewing slots sent by text"],
            msgs: [["contact", "Hi, I'm calling about the 2-room flat on rue Oberkampf. Is it still available?"], ["agent", "Yes, from 15 December. Rent is €1,320 plus €80 charges, third floor without a lift. May I take your details?"], ["contact", "Antoine Roy. I'm on a permanent contract, €4,300 net a month."], ["agent", "Thank you, Antoine. I'm texting you the documents list and two viewing slots: Saturday 11:00 or Monday 18:30."]] });
          S.unread.cA = true; S.fresh.cA = true;
          S.feed.unshift({ conv: "cA", chan: "call", who: "Antoine Roy", what: "Asked about 5 rue Oberkampf. Contact details, income and move-in date collected.", time: conv("cA").time, fresh: true });
          S.handledToday++;
          if (route().name === "today") render();
          updateCounts();
        }
      });
    });
  }
  function demoMessage() {
    go("#/inbox", function () {
      var id = run, t = tick();
      var c = { id: "cG" + S.clock, name: "Giulia Bianchi", role: "Prospect", prop: "gambetta", chan: "whatsapp", time: t, contact: null,
        summary: "Asked about availability and pets. Answered in Italian.", outcomes: ["Answered in Italian in 5 s", "Viewing slot offered · Thu 10:30"],
        msgs: [["contact", "Buongiorno, l'appartamento in rue Gambetta è ancora disponibile? Accettate animali?", "Good morning, is the flat on rue Gambetta still available? Do you accept pets?"]] };
      S.conversations.unshift(c); S.fresh[c.id] = true; S.unread[c.id] = true;
      toast("New WhatsApp from Giulia Bianchi");
      later(function () {
        location.hash = "#/inbox/" + c.id;
        later(function () {
          var box = $("#msgs"); if (!box) return;
          var typing = box.insertAdjacentHTML("beforeend", '<div class="msg agent in" id="typing"><span class="who">Obsidia</span><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div></div>');
          box.scrollTop = box.scrollHeight;
          later(function () {
            var tp = $("#typing"); if (tp) tp.remove();
            var reply = ["agent", "Buongiorno Giulia, sì, è disponibile dal 1° dicembre e gli animali sono ammessi. Affitto €1.150 più €90 di spese. Vuole visitarlo giovedì alle 10:30?", "Good morning Giulia, yes, it's available from 1 December and pets are allowed. Rent €1,150 plus €90 charges. Would you like to visit on Thursday at 10:30?"];
            c.msgs.push(reply); appendMsg($("#msgs"), reply, c);
            S.feed.unshift({ conv: c.id, chan: "whatsapp", who: c.name, what: c.summary, time: t, fresh: true });
            S.handledToday++; updateCounts();
            later(function () {
              var m = ["contact", "Perfetto, giovedì va benissimo!", "Perfect, Thursday works great!"];
              c.msgs.push(m); appendMsg($("#msgs"), m, c);
              later(function () {
                var r2 = ["agent", "Ottimo, la aspetto giovedì 19 novembre alle 10:30, 14 rue Gambetta, 6° piano. Le mando l'elenco dei documenti.", "Great, see you Thursday 19 November at 10:30, 14 rue Gambetta, 6th floor. I'm sending you the documents list."];
                c.msgs.push(r2); appendMsg($("#msgs"), r2, c);
              }, 1400, id);
            }, 1800, id);
          }, 1600, id);
        }, 500, id);
      }, 900, id);
    });
  }
  function demoFile() {
    go("#/applicants/oberkampf", function () {
      var id = run;
      toast("New file received by email · Antoine Roy");
      later(function () {
        var list = S.applicants.oberkampf;
        if (!list.some(function (a) { return a[0] === "Antoine Roy"; })) { list.push(["Antoine Roy", 3.1, "Permanent", "Visale", 100, 88, "Email", tick(), true]); prop("oberkampf").applicants++; }
        ensureAntoine().type = "Applicant"; contact("kA").last = "File rated 88 · rank 2";
        render();
        later(function () { applicantDrawer(prop("oberkampf"), "Antoine Roy"); }, 900, id);
      }, 1400, id);
    });
  }
  function demoCrm() {
    var k = ensureAntoine();
    go("#/crm", function () { later(function () { contactDrawer(k, true); }, 500, run); });
  }
  function demoTenant() {
    var t = S.tenants.filter(function (x) { return x.status === "late"; })[0];
    go("#/tenants", function () {
      if (t) callTenant(t.id);
      var id = run;
      if (!S.requests.some(function (r) { return r.id === "rK"; })) {
        later(function () {
          S.requests.unshift({ id: "rK", tenant: "Karim Saidi", unit: "Apt 3C, 40 rue Saint-Maur", what: "No hot water since this morning", action: "Heating engineer booked · Fri 20 Nov 08:00", state: "scheduled", time: tick(), fresh: true });
          S.feed.unshift({ chan: "request", who: "Karim Saidi", what: "No hot water. Heating engineer booked for Friday 08:00.", time: S.requests[0].time, href: "#/tenants", fresh: true });
          S.handledToday++;
          toast("Request from Karim Saidi: heating engineer booked");
          if (route().name === "tenants" && modal.hidden) render();
          updateCounts();
        }, t ? 14000 : 600, id);
      }
    });
  }
  function demoAsk() {
    go("#/assistant", function () {
      var id = run, inp = $("#askForm input"), q = "When was the bathroom at 14 rue Gambetta renovated?";
      if (!inp) return;
      inp.focus();
      var i = 0;
      (function step() {
        if (id !== run) return;
        inp.value = q.slice(0, ++i);
        if (i < q.length) setTimeout(step, reduce ? 0 : 28); else later(function () { $("#askForm").requestSubmit(); }, 400, id);
      })();
    });
  }

  /* ---------- router ---------- */
  var VIEWS = { today: [vToday, "Today"], inbox: [vInbox, "Inbox"], applicants: [vApplicants, "Applicants"], crm: [vCrm, "CRM"], tenants: [vTenants, "Tenants"], properties: [vProperties, "Properties"], assistant: [vAssistant, "Assistant"] };
  function route() {
    var parts = location.hash.replace(/^#\/?/, "").split("/");
    var name = VIEWS[parts[0]] ? parts[0] : "today";
    return { name: name, arg: parts[1] ? decodeURIComponent(parts[1]) : null };
  }
  var lastName = null;
  function render() {
    var r = route(), v = VIEWS[r.name];
    mount = null;
    view.innerHTML = v[0](r.arg);
    if (lastName !== r.name) { view.classList.remove("enter"); view.offsetWidth; view.classList.add("enter"); window.scrollTo(0, 0); }
    lastName = r.name;
    document.title = v[1] + " · Obsidia demo";
    $("#crumb").innerHTML = esc(S.agency.name) + " / <b>" + v[1] + "</b>";
    $$("#nav a, #tabbar a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-r") === r.name); if (a.getAttribute("data-r") === r.name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    if (mount) mount();
    placeThumbs(false);
    updateCounts();
  }
  function updateCounts() {
    var unread = S.conversations.filter(function (c) { return S.unread[c.id]; }).length;
    var apps = 0; Object.keys(S.applicants).forEach(function (k) { apps += S.applicants[k].length; });
    var late = S.tenants.filter(function (t) { return t.status === "late"; }).length;
    var set = function (k, v, isNew) { var el = $('[data-count="' + k + '"]'); if (el) { el.textContent = v || ""; el.classList.toggle("new", !!isNew); } };
    set("inbox", unread ? unread + " new" : S.conversations.length, unread);
    set("applicants", apps); set("crm", S.contacts.length);
    set("tenants", late ? late + " late" : S.tenants.length, late);
    set("properties", S.properties.length);
    $("#agencyMeta").textContent = S.properties.length + " properties · " + S.tenants.length + " tenants";
  }
  window.addEventListener("hashchange", function () {
    closeDrawer();
    if (modal.hidden && route().name !== "assistant") hush();
    if (!modal.hidden && !modal.classList.contains("call-modal")) closeModal();
    render();
    if (pending) { var cb = pending; pending = null; setTimeout(cb, 60); }
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeThumbs(false); });
  render();
})();
