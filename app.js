// Site behaviour: tabs (hash routes), hero slideshow, galleries, lightbox, contact form.
// Photo data comes from photos.js, which build_gallery.py generates.
(() => {
  const { hero, genres, photos } = window.GALLERY;
  const $ = (sel) => document.querySelector(sel);
  const bySlug = Object.fromEntries(genres.map((g) => [g.slug, g]));
  const SITE = "Connor Mallon — Photography";

  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- Tabs ----------
  const tabs = $("#tabs");
  const firstStatic = tabs.firstElementChild;
  genres.forEach((g) => {
    const a = document.createElement("a");
    a.href = `#/${g.slug}`;
    a.dataset.route = g.slug;
    a.textContent = g.label;
    tabs.insertBefore(a, firstStatic);
  });
  firstStatic.classList.add("tab-gap");

  // ---------- Home: collections ----------
  $("#totalCount").textContent = `${photos.length} photographs`;
  const pad = (n) => String(n).padStart(2, "0");
  $("#collectionGrid").innerHTML = genres.map((g, i) => `
    <a class="collection reveal" href="#/${g.slug}">
      <div class="ph"><img src="${g.cover}" alt="" loading="lazy" /></div>
      <div class="meta">
        <span class="num label">No. ${pad(i + 1)}</span>
        <h3>${g.label}</h3>
        <p class="dek">${g.blurb}</p>
        <span class="count label">${g.count} photographs <span class="arrow">→</span></span>
      </div>
    </a>`).join("");

  // ---------- Home: ticker of places ----------
  // EDIT ME: places shown in the scrolling strip under the cover
  const PLACES = ["Cappadocia", "Paris", "Istanbul", "London", "Korčula", "Budapest", "Rome",
    "Split", "Munich", "Copenhagen", "Prague", "Vienna", "Alta Badia", "Vietri sul Mare",
    "Nevis", "New York", "Dubrovnik", "Florence", "Versailles", "Mljet"];
  const tickerRun = PLACES.map((p) => `<span>${p}</span><b>✦</b>`).join("");
  $("#ticker").innerHTML = tickerRun + tickerRun;   // doubled for a seamless loop

  // ---------- Home: hero slideshow ----------
  const slides = $("#heroSlides");
  hero.forEach((src, i) => {
    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    if (i === 0) img.fetchPriority = "high";
    img.dataset.src = src;
    if (i < 2) img.src = src;
    slides.appendChild(img);
  });
  let slide = 0, slideTimer;
  const titleOf = Object.fromEntries(photos.map((p) => [p.src, p.title]));
  const heroBar = $("#heroBar");
  const showSlide = (n) => {
    const imgs = slides.children;
    if (!imgs.length) return;
    imgs[slide].classList.remove("on");
    slide = (n + imgs.length) % imgs.length;
    $("#heroTitle").textContent = titleOf[hero[slide]] || "";
    $("#heroCount").textContent = `${pad(slide + 1)} / ${pad(imgs.length)}`;
    heroBar.classList.remove("run"); void heroBar.offsetWidth; heroBar.classList.add("run");
    const cur = imgs[slide], next = imgs[(slide + 1) % imgs.length];
    if (!next.src) next.src = next.dataset.src;    // preload the one after
    const on = () => cur.classList.add("on");
    cur.complete ? requestAnimationFrame(on) : (cur.onload = on);
  };
  const startSlides = () => {
    clearInterval(slideTimer);
    slideTimer = setInterval(() => showSlide(slide + 1), 6000);
    heroBar.classList.remove("run"); void heroBar.offsetWidth; heroBar.classList.add("run");
  };
  showSlide(0);

  // Header turns solid once you scroll past the top (always solid off the home page)
  const header = $("#header");
  let onHome = true;
  const updateHeader = () => header.classList.toggle("solid", !onHome || scrollY > 40);
  addEventListener("scroll", updateHeader, { passive: true });

  // ---------- Scroll reveals ----------
  // Elements with .reveal fade up as they enter the screen; ones arriving together are staggered.
  const revealer = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e, n) => {
      e.target.style.transitionDelay = `${Math.min(n, 6) * 70}ms`;
      e.target.classList.add("in");
      revealer.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  function observeReveals(root) {
    root.querySelectorAll(".reveal:not(.in)").forEach((el) => revealer.observe(el));
  }
  observeReveals(document);

  // ---------- Parallax on collection photos ----------
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ticking = false;
  function parallax() {
    ticking = false;
    if (!onHome) return;
    document.querySelectorAll(".collection .ph").forEach((ph) => {
      const r = ph.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const offset = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;   // -1..1
      ph.firstElementChild.style.translate = `0 ${(offset * -6).toFixed(2)}%`;
    });
  }
  if (!still) addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });

  // ---------- Genre gallery ----------
  let current = [];   // photos in the open gallery, for the lightbox
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const img = e.target;
      img.src = img.dataset.src;
      io.unobserve(img);
    });
  }, { rootMargin: "600px 0px" });

  function renderGenre(slug) {
    const g = bySlug[slug];
    current = photos.filter((p) => p.genre === slug);
    $("#genreTitle").textContent = g.label;
    $("#genreBlurb").textContent = g.blurb;
    $("#genreCount").textContent = `No. ${pad(genres.indexOf(g) + 1)} — ${g.count} photographs`;
    const gallery = $("#gallery");
    gallery.innerHTML = current.map((p, i) => `
      <a class="tile reveal" href="${p.src}" data-i="${i}" style="--r:${(p.w / p.h).toFixed(4)}">
        <i></i>
        <img data-src="${p.thumb}" alt="${p.title.replace(/"/g, "&quot;")}" />
        <span class="cap">${p.title}</span>
      </a>`).join("");
    gallery.querySelectorAll("img").forEach((img) => {
      img.onload = () => img.classList.add("loaded");
      io.observe(img);
    });
    observeReveals(gallery);

    const idx = genres.indexOf(g);
    const prev = genres[idx - 1], next = genres[idx + 1];
    $("#genreNext").innerHTML =
      (prev ? `<a href="#/${prev.slug}"><small>← Previous</small><span>${prev.label}</span></a>` : "") +
      (next ? `<a href="#/${next.slug}"><small>Next →</small><span>${next.label}</span></a>`
            : `<a href="#/${genres[0].slug}"><small>Back to →</small><span>${genres[0].label}</span></a>`);
  }

  $("#gallery").addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    e.preventDefault();
    openLightbox(+tile.dataset.i);
  });

  // ---------- Router ----------
  function route() {
    const path = location.hash.replace(/^#\/?/, "") || "home";
    if (path === "collections") return;   // in-page anchor on home
    let view = path;
    if (bySlug[path]) view = "genre";
    else if (!["home", "about", "contact"].includes(path)) view = "home";

    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === view));
    tabs.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.route === path));
    const activeTab = tabs.querySelector("a.active");
    if (activeTab) activeTab.scrollIntoView({ block: "nearest", inline: "nearest" });

    if (view === "genre") renderGenre(path);
    onHome = view === "home";
    onHome ? startSlides() : clearInterval(slideTimer);
    updateHeader();
    if (onHome) requestAnimationFrame(parallax);

    document.title = view === "home" ? SITE
      : `${view === "genre" ? bySlug[path].label : path[0].toUpperCase() + path.slice(1)} — ${SITE}`;
    scrollTo({ top: 0, behavior: "instant" });
  }
  addEventListener("hashchange", route);
  // "Collections" anchor on the home page scrolls without changing the route
  document.querySelector(".scroll-cue").addEventListener("click", (e) => {
    e.preventDefault();
    $("#collections").scrollIntoView({ behavior: "smooth" });
  });
  route();

  // ---------- Lightbox ----------
  const lb = $("#lightbox"), lbImg = $("#lbImg");
  let at = 0, lastFocus = null;

  function show(i) {
    at = (i + current.length) % current.length;
    const p = current[at];
    lbImg.classList.add("swapping");
    const img = new Image();
    img.onload = () => {
      lbImg.src = p.src;
      lbImg.alt = p.title;
      lbImg.classList.remove("swapping");
    };
    img.src = p.src;
    $("#lbCaption").textContent = p.title;
    $("#lbCounter").textContent = `${at + 1} / ${current.length}`;
    [at + 1, at - 1].forEach((n) => { new Image().src = current[(n + current.length) % current.length].src; });
  }
  function openLightbox(i) {
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
    if (lastFocus) lastFocus.focus();
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
  // Swipe on touch screens
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
      const res = await fetch(form.action, {
        method: "POST", body: new FormData(form), headers: { Accept: "application/json" },
      });
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
