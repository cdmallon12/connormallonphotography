// Site behaviour: home page, curated genre tabs, lightbox, motion, contact form.
// Photo data comes from photos.js, which build_gallery.py generates.
(() => {
  const { genres, photos, featured = [] } = window.GALLERY;
  const $ = (sel) => document.querySelector(sel);
  const pad = (n) => String(n).padStart(2, "0");
  const SITE = "Connor Mallon — Photography";
  const bySlug = Object.fromEntries(genres.map((g) => [g.slug, g]));

  // Look photos up by "<genre>/<file name>" (e.g. "landscape/goreme-sunrise"),
  // or "featured/<file name>" for photos in images/_featured/.
  const byKey = {};
  [...photos, ...featured].forEach((p) => {
    byKey[p.src.replace(/^photos\//, "").replace(/\.jpg$/, "")] = p;
  });
  const P = (key) => byKey[key] || console.warn("Photo not found:", key);

  // =====================================================================
  // EDIT ME: which photos go where
  // =====================================================================
  const PICKS = {
    // Home page genre bands, shown in pairs. "block" = solid color + inset photo,
    // "photo" = photo fills its half. Optional "focus" keeps part of the photo in view
    // when it's cropped ("x% y%" from the top-left, e.g. the moon in Alta Badia).
    bands: [
      { genre: "landscape",    style: "block", color: "var(--accent)", inset: "landscape/alta-badia-5", focus: "80% 12%" },
      { genre: "architecture", style: "photo", image: "architecture/hungarian-parliament" },
      { genre: "street",       style: "photo", image: "street/split-street-view-3" },
      { genre: "nature",       style: "block", color: "var(--navy)", inset: "nature/blue-morpho-butterfly-1" },
    ],
    // Home page "Selected work": one large photo with a smaller one overlapping it.
    recent: { big: "featured/lone-sail", small: "featured/eiffel-tower-blue-hour" },

    // Each genre tab shows these first, in this order (the full collection sits under "View all").
    best: {
      landscape: [
        "landscape/alta-badia-4", "landscape/cappadocia-hot-air-balloons-1", "landscape/cappadocia-hot-air-balloons-2",
        "landscape/cappadocia-hot-air-balloons-3", "landscape/dubrovnik-old-town", "landscape/london-skyline",
        "landscape/munich-english-garden-1", "landscape/munich-english-garden-2", "landscape/nevis-coast-2",
        "landscape/palace-of-versailles", "landscape/vietri-sul-mare-2", "featured/gstaad-dog-sled",
      ],
      architecture: [
        "architecture/hungarian-parliament", "architecture/barbican-estate-1", "featured/one-world-trade",
        "architecture/buckingham-palace-dusk", "architecture/manhattan-bridge", "architecture/szechenyi-chain-bridge-1",
        "architecture/rome-statuary", "architecture/barbican-estate-2", "architecture/eiffel-tower-dusk",
        "architecture/london-cityscape-3", "architecture/split-dusk", "featured/bell-tower",
      ],
      street: [
        "street/istanbul-street-view-2", "street/split-street-view-3", "street/new-york-city-sunset",
        "street/musee-du-louvre-1", "street/supreme-deli", "featured/night-corridor",
        "street/vienna-street-view-2", "street/korcula-street-view-4", "street/rome-street-view",
        "featured/paris-in-mono", "street/nevis-sunset", "street/istanbul-street-view-3",
        "street/paris-street-view-1", "street/hagia-sophia",
      ],
      nature: [
        "nature/blue-morpho-butterfly-2", "nature/balduina-sunset", "nature/cattle-egret",
        "nature/goreme-camel", "nature/blue-morpho-butterfly-1", "nature/peaches",
        "nature/tropical-hibiscus", "nature/vervet-monkey-1", "nature/purple-queen-bougainvillea",
        "nature/balduina-dusk",
      ],
    },
  };
  // =====================================================================

  document.getElementById("year").textContent = new Date().getFullYear();
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

  // ---------- Nav: one tab per genre ----------
  const nav = $("#nav");
  const firstStatic = nav.firstElementChild;
  genres.forEach((g) => {
    const a = document.createElement("a");
    a.href = `#/${g.slug}`;
    a.dataset.route = g.slug;
    a.textContent = g.label;
    nav.insertBefore(a, firstStatic);
  });
  firstStatic.classList.add("tab-gap");

  // ---------- Home: color-blocked bands ----------
  const half = (b) => {
    const g = bySlug[b.genre];
    if (!g) return "";
    const txt = `
      <div class="txt">
        <span class="num">${pad(genres.indexOf(g) + 1)}</span>
        <h3>${g.label}</h3>
        <p>${g.blurb}</p>
        <span class="link-line">View gallery</span>
      </div>`;
    const focus = b.focus ? ` style="object-position:${b.focus}"` : "";
    if (b.style === "block") {
      return `<a class="half block reveal" href="#/${g.slug}" style="--c:${b.color}">
        <div class="inset"><img src="${(P(b.inset) || {}).thumb}" alt=""${focus} loading="lazy" /></div>${txt}
      </a>`;
    }
    return `<a class="half photo reveal" href="#/${g.slug}">
      <img src="${(P(b.image) || {}).src}" alt=""${focus} loading="lazy" />${txt}
    </a>`;
  };
  let bands = "";
  for (let i = 0; i < PICKS.bands.length; i += 2) {
    bands += `<div class="band">${half(PICKS.bands[i])}${PICKS.bands[i + 1] ? half(PICKS.bands[i + 1]) : ""}</div>`;
  }
  $("#bands").innerHTML = bands;

  // ---------- Home: selected work ----------
  // Clicking either photo opens a slideshow of the top three from every genre.
  const highlights = genres.flatMap((g) => (PICKS.best[g.slug] || []).slice(0, 3).map(P).filter(Boolean));
  [["#recentBig", PICKS.recent.big], ["#recentSmall", PICKS.recent.small]].forEach(([sel, key]) => {
    const p = P(key);
    if (!p) return;
    const a = $(sel);
    a.href = p.src;
    a.innerHTML = `<img src="${p.thumb}" alt="${esc(p.title)}" width="${p.w}" height="${p.h}" loading="lazy" />`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      openLightbox([p, ...highlights.filter((h) => h !== p)], 0);
    });
  });
  $("#recentLinks").innerHTML = genres.map((g) => `<li><a href="#/${g.slug}">${g.label} →</a></li>`).join("");

  // ---------- Genre tab: curated best in an asymmetric layout ----------
  const lazy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.src = e.target.dataset.src;
      lazy.unobserve(e.target);
    });
  }, { rootMargin: "600px 0px" });

  // Alternate photos left and right on a 12-column grid. Tall photos get narrow columns,
  // wide ones get broad columns, and right-hand photos drop lower to stagger the pair.
  function place(list) {
    let leftSpan = 0;
    return list.map((p, i) => {
      const tall = p.h > p.w;
      const right = i % 2 === 1;
      let span, start, drop = 0;
      if (!right) {
        span = tall ? 4 : 7;
        start = 1 + (tall && i % 4 === 2 ? 1 : 0);
        leftSpan = span + start - 1;
      } else {
        span = tall ? 4 : (leftSpan >= 7 ? 5 : 7);
        start = 13 - span - (i % 4 === 3 && 13 - span - 1 > leftSpan ? 1 : 0);
        drop = tall ? 16 : 10;
      }
      return { p, tall, col: `${start} / span ${span}`, drop };
    });
  }

  let bestList = [], allList = [];
  function renderGenre(slug) {
    const g = bySlug[slug];
    const idx = genres.indexOf(g);
    allList = photos.filter((p) => p.genre === slug);
    bestList = (PICKS.best[slug] || []).map(P).filter(Boolean);
    if (!bestList.length) bestList = allList.slice(0, 12);

    $("#genreTitle").textContent = g.label;
    $("#genreBlurb").textContent = g.blurb;
    $("#genreCount").textContent = `${pad(bestList.length)} selected · ${g.count} in the collection`;
    $("#best").innerHTML = place(bestList).map(({ p, tall, col, drop }, i) => `
      <figure class="reveal${tall ? " tall" : ""}" data-i="${i}" style="grid-column:${col};margin-top:${drop}vh">
        <div class="ph"><img src="${p.thumb}" alt="${esc(p.title)}" width="${p.w}" height="${p.h}" loading="lazy" /></div>
        <figcaption><b>${pad(i + 1)}</b>${esc(p.title)}</figcaption>
      </figure>`).join("");
    observeReveals($("#best"));

    const gallery = $("#gallery");
    gallery.hidden = true;
    gallery.innerHTML = "";
    $("#showAll").textContent = `View all ${g.count} photos`;

    const prev = genres[idx - 1], next = genres[idx + 1] || genres[0];
    $("#genreNext").innerHTML =
      (prev ? `<a href="#/${prev.slug}"><small>← Previous</small><span>${prev.label}</span></a>` : "") +
      `<a href="#/${next.slug}"><small>Next →</small><span>${next.label}</span></a>`;
  }
  $("#best").addEventListener("click", (e) => {
    const f = e.target.closest("figure[data-i]");
    if (f) openLightbox(bestList, +f.dataset.i);
  });

  // "View all": the whole collection as justified rows
  $("#showAll").addEventListener("click", () => {
    const gallery = $("#gallery");
    if (!gallery.hidden) { gallery.hidden = true; $("#showAll").textContent = `View all ${allList.length} photos`; return; }
    gallery.innerHTML = allList.map((p, i) => `
      <a class="tile" href="${p.src}" data-i="${i}" style="--r:${(p.w / p.h).toFixed(4)}">
        <i></i><img data-src="${p.thumb}" alt="${esc(p.title)}" />
      </a>`).join("");
    gallery.querySelectorAll("img").forEach((img) => {
      img.onload = () => img.classList.add("loaded");
      lazy.observe(img);
    });
    gallery.hidden = false;
    $("#showAll").textContent = "Hide full collection";
  });
  $("#gallery").addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    e.preventDefault();
    openLightbox(allList, +tile.dataset.i);
  });

  // ---------- Scroll reveals ----------
  const revealer = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e, n) => {
      e.target.style.transitionDelay = `${Math.min(n, 4) * 90}ms`;
      e.target.classList.add("in");
      revealer.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  function observeReveals(root) {
    root.querySelectorAll(".reveal:not(.in)").forEach((el) => revealer.observe(el));
  }
  observeReveals(document);

  // ---------- Gentle parallax on band photos ----------
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ticking = false;
  function frame() {
    ticking = false;
    if (view !== "home") return;
    document.querySelectorAll(".half img").forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      img.style.translate = `0 ${(((r.top + r.height / 2) / innerHeight - 0.5) * -4).toFixed(2)}%`;
    });
  }
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  if (!still) addEventListener("scroll", queue, { passive: true });

  // ---------- Header ----------
  const header = $("#header");
  const updateHeader = () => header.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", updateHeader, { passive: true });

  // ---------- Router ----------
  // #/ home · #/about, #/contact scroll on the home page · #/<genre> opens that tab
  let view = "";
  function route() {
    const path = location.hash.replace(/^#\/?/, "");
    const next = bySlug[path] ? "genre" : "home";
    const changed = next !== view || next === "genre";
    view = next;
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === view));
    nav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.route === path));

    if (view === "genre") {
      renderGenre(path);
      document.title = `${bySlug[path].label} — ${SITE}`;
      scrollTo({ top: 0, behavior: "instant" });
    } else {
      document.title = SITE;
      const target = document.getElementById(path);
      if (target) {
        requestAnimationFrame(() => scrollTo({ top: target.getBoundingClientRect().top + scrollY, behavior: changed ? "instant" : "smooth" }));
      } else if (changed) {
        scrollTo({ top: 0, behavior: "instant" });
      }
      queue();
    }
    updateHeader();
  }
  addEventListener("hashchange", route);
  route();

  // ---------- Lightbox ----------
  const lb = $("#lightbox"), lbImg = $("#lbImg");
  let set = [], at = 0, lastFocus = null;
  function show(i) {
    at = (i + set.length) % set.length;
    const p = set[at];
    lbImg.classList.add("swapping");
    const img = new Image();
    img.onload = () => { lbImg.src = p.src; lbImg.alt = p.title; lbImg.classList.remove("swapping"); };
    img.src = p.src;
    $("#lbCaption").textContent = p.title;
    $("#lbCounter").textContent = `${pad(at + 1)} / ${pad(set.length)}`;
    [at + 1, at - 1].forEach((n) => { new Image().src = set[(n + set.length) % set.length].src; });
  }
  function openLightbox(list, i) {
    set = list;
    lastFocus = document.activeElement;
    lbImg.removeAttribute("src");
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    show(i);
    $("#lbClose").focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $("#lbClose").onclick = closeLightbox;
  $("#lbPrev").onclick = () => show(at - 1);
  $("#lbNext").onclick = () => show(at + 1);
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "FIGURE") closeLightbox(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") show(at + 1);
    if (e.key === "ArrowLeft") show(at - 1);
  });
  let x0 = null;
  lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  // ---------- Contact form (sends via Formspree without leaving the page) ----------
  const form = $("#contactForm"), status = $("#formStatus");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button");
    btn.disabled = true;
    status.textContent = "Sending…";
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error();
      form.reset();
      status.textContent = "Thanks! Your message is on its way.";
    } catch {
      status.textContent = "Something went wrong. Please try again in a moment.";
    } finally {
      btn.disabled = false;
    }
  });
})();
