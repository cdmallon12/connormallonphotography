// Site behaviour: one-page layout, genre galleries, lightbox, motion, contact form.
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
    // Scattered collage next to the headline. Position/size are % of the collage box.
    collage: [
      { key: "architecture/eiffel-tower-dusk",          x: 0,  y: 6,  w: 32, h: 52 },
      { key: "landscape/cappadocia-hot-air-balloons-1", x: 28, y: 0,  w: 56, h: 36 },
      { key: "featured/florence-duomo",                 x: 70, y: 22, w: 30, h: 40, round: true },
      { key: "featured/art-by-stjepko",                 x: 36, y: 40, w: 26, h: 46 },
      { key: "featured/blue-cave",                      x: 4,  y: 64, w: 36, h: 30 },
      { key: "featured/walk-signal",                    x: 70, y: 66, w: 20, h: 32 },
    ],
    // Genres shown in pairs as color-blocked bands. "block" gets a solid color + inset photo,
    // "photo" fills its half edge to edge.
    bands: [
      { genre: "landscape",    style: "block", color: "var(--accent)", inset: "landscape/goreme-sunrise" },
      { genre: "architecture", style: "photo", image: "architecture/hungarian-parliament" },
      { genre: "street",       style: "photo", image: "street/istanbul-street-view-2" },
      { genre: "nature",       style: "block", color: "var(--rust)", inset: "nature/cattle-egret" },
    ],
    // Selected work mosaic (spread across 4 staggered columns, left to right).
    mosaic: [
      "featured/david", "landscape/cappadocia-hot-air-balloons-3", "featured/hanging-pots", "featured/croissants",
      "featured/window-cat", "architecture/split-dusk", "featured/cliff-jump", "featured/hexagon-lights",
      "featured/croatian-flag", "featured/soho", "nature/peaches", "street/musee-du-louvre-1",
      "featured/painted-ceiling", "featured/gasoline-grill", "featured/night-square", "featured/red-gingham",
      "architecture/rome-statuary", "featured/mountain-at-dusk", "street/west-village", "featured/cappadocia-rocks",
    ],
    // Circles strip: [place name, photo]
    places: [
      ["Cappadocia", "landscape/cappadocia"], ["Paris", "architecture/paris-cityscape-2"],
      ["Istanbul", "architecture/blue-mosque"], ["London", "architecture/tower-bridge"],
      ["Korčula", "architecture/korcula"], ["Rome", "architecture/rome-cityscape"],
      ["Budapest", "architecture/szechenyi-chain-bridge-1"], ["Alta Badia", "landscape/alta-badia-1"],
      ["Nevis", "landscape/nevis-coast-1"], ["New York", "architecture/new-york-city-cityscape"],
      ["Prague", "landscape/prague-skyline"], ["Split", "architecture/split-skyline"],
      ["Amalfi Coast", "landscape/vietri-sul-mare-2"], ["Copenhagen", "architecture/rosenborg-castle"],
    ],
  };
  // =====================================================================

  document.getElementById("year").textContent = new Date().getFullYear();
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

  // ---------- Collage ----------
  $("#collage").innerHTML = PICKS.collage.filter((c) => P(c.key)).map((c, i) => `
    <div class="c${c.round ? " round" : ""}" data-depth="${(0.4 + (i % 3) * 0.35).toFixed(2)}"
         style="left:${c.x}%;top:${c.y}%;width:${c.w}%;height:${c.h}%;z-index:${i + 1};transition-delay:${0.5 + i * 0.12}s">
      <img src="${P(c.key).thumb}" alt="" ${i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'} />
    </div>`).join("");

  // ---------- Color-blocked bands ----------
  const half = (b) => {
    const g = bySlug[b.genre];
    if (!g) return "";
    const n = pad(genres.indexOf(g) + 1);
    const txt = `
      <div class="txt">
        <span class="num">No. ${n}</span>
        <h3>${g.label}</h3>
        <p>${g.blurb}</p>
        <span class="link-line">View gallery</span>
      </div>`;
    if (b.style === "block") {
      return `<a class="half block reveal" href="#/${g.slug}" style="--c:${b.color}">
        <div class="inset"><img src="${(P(b.inset) || {}).thumb}" alt="" loading="lazy" /></div>
        ${txt}
        <span class="count">${g.count}</span>
      </a>`;
    }
    return `<a class="half photo reveal" href="#/${g.slug}">
      <img src="${(P(b.image) || {}).src}" alt="" loading="lazy" />
      ${txt}
    </a>`;
  };
  let bandsHtml = "";
  for (let i = 0; i < PICKS.bands.length; i += 2) {
    bandsHtml += `<div class="band">${half(PICKS.bands[i])}${PICKS.bands[i + 1] ? half(PICKS.bands[i + 1]) : ""}</div>`;
  }
  $("#bands").innerHTML = bandsHtml;

  // ---------- Selected work mosaic ----------
  const mosaicPhotos = PICKS.mosaic.map(P).filter(Boolean);
  const cols = [[], [], [], []];
  mosaicPhotos.forEach((p, i) => cols[i % 4].push([p, i]));
  $("#mosaic").innerHTML = cols.map((col, c) => `
    <div class="col" data-speed="${[0.04, -0.06, 0.08, -0.03][c]}">
      ${col.map(([p, i]) => `
        <a class="reveal" href="${p.src}" data-i="${i}">
          <img src="${p.thumb}" alt="${esc(p.title)}" width="${p.w}" height="${p.h}" loading="lazy" />
          <span class="cap">${esc(p.title)}</span>
        </a>`).join("")}
    </div>`).join("");
  $("#mosaic").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-i]");
    if (!a) return;
    e.preventDefault();
    openLightbox(mosaicPhotos, +a.dataset.i);
  });

  // ---------- Places circles (doubled for a seamless loop) ----------
  const circles = PICKS.places.filter(([, k]) => P(k)).map(([name, k]) => `
    <div class="circle"><img src="${P(k).thumb}" alt="" loading="lazy" /><span>${name}</span></div>`).join("");
  $("#circles").innerHTML = circles + circles;

  // ---------- Genre gallery page ----------
  let current = [];
  const lazy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.src = e.target.dataset.src;
      lazy.unobserve(e.target);
    });
  }, { rootMargin: "600px 0px" });

  function renderGallery(slug) {
    const g = bySlug[slug];
    const idx = genres.indexOf(g);
    current = photos.filter((p) => p.genre === slug);
    $("#galleryTitle").textContent = g.label;
    $("#galleryBlurb").textContent = g.blurb;
    $("#galleryCount").textContent = `No. ${pad(idx + 1)} — ${g.count} photographs`;
    $("#chips").innerHTML = genres.map((x) =>
      `<a href="#/${x.slug}" class="${x === g ? "active" : ""}">${x.label}</a>`).join("");
    const gallery = $("#gallery");
    gallery.innerHTML = current.map((p, i) => `
      <a class="tile" href="${p.src}" data-i="${i}" style="--r:${(p.w / p.h).toFixed(4)}">
        <i></i><img data-src="${p.thumb}" alt="${esc(p.title)}" /><span class="cap">${esc(p.title)}</span>
      </a>`).join("");
    gallery.querySelectorAll("img").forEach((img) => {
      img.onload = () => img.classList.add("loaded");
      lazy.observe(img);
    });
    const prev = genres[idx - 1], next = genres[idx + 1] || genres[0];
    $("#galleryNext").innerHTML =
      (prev ? `<a href="#/${prev.slug}"><small>← Previous</small><span>${prev.label}</span></a>` : "") +
      `<a href="#/${next.slug}"><small>Next →</small><span>${next.label}</span></a>`;
  }
  $("#gallery").addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    e.preventDefault();
    openLightbox(current, +tile.dataset.i);
  });

  // ---------- Scroll reveals ----------
  const revealer = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e, n) => {
      e.target.style.transitionDelay = `${Math.min(n, 5) * 80}ms`;
      e.target.classList.add("in");
      revealer.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

  // ---------- Motion: collage follows the mouse, columns and photos drift on scroll ----------
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const collageItems = [...document.querySelectorAll(".collage .c")];
  let mx = 0, my = 0, ticking = false;

  function frame() {
    ticking = false;
    if (view !== "home") return;
    const sy = scrollY;
    collageItems.forEach((c) => {
      const d = +c.dataset.depth;
      c.style.translate = `${(mx * d * 18).toFixed(1)}px ${(my * d * 18 - sy * d * 0.12).toFixed(1)}px`;
    });
    document.querySelectorAll(".mosaic .col").forEach((col) => {
      const r = col.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      col.style.transform = `translateY(${((innerHeight - r.top) * +col.dataset.speed).toFixed(1)}px)`;
    });
    document.querySelectorAll(".half .inset img, .half.photo > img").forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      img.style.translate = `0 ${(((r.top + r.height / 2) / innerHeight - 0.5) * -8).toFixed(2)}%`;
    });
  }
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  if (!still) {
    addEventListener("scroll", queue, { passive: true });
    addEventListener("mousemove", (e) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
      queue();
    });
  }

  // ---------- Header ----------
  const header = $("#header");
  const updateHeader = () => header.classList.toggle("solid", view !== "home" || scrollY > 40);
  addEventListener("scroll", updateHeader, { passive: true });

  // ---------- Router ----------
  // #/ home · #/work, #/about … scroll to that section · #/<genre> opens its gallery
  const SECTIONS = ["work", "selected", "places", "about", "contact"];
  let view = "";
  function route() {
    const path = location.hash.replace(/^#\/?/, "");
    const next = bySlug[path] ? "gallery" : "home";
    const changed = next !== view;
    view = next;
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === view));
    document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === path));

    if (view === "gallery") {
      renderGallery(path);
      document.title = `${bySlug[path].label} — ${SITE}`;
      scrollTo({ top: 0, behavior: "instant" });
    } else {
      document.title = SITE;
      if (changed) collageItems.forEach((c) => { c.classList.remove("in"); void c.offsetWidth; c.classList.add("in"); });
      if (SECTIONS.includes(path)) {
        const target = document.getElementById(path);
        requestAnimationFrame(() => scrollTo({
          top: target.getBoundingClientRect().top + scrollY,
          behavior: changed ? "instant" : "smooth",
        }));
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
