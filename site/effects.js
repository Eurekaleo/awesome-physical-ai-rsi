// Visual effects for the project page: the Van Gogh night sky behind the hero, scroll reveals, and the chapter
// pager. Everything degrades to a static page: without JavaScript the content shows as is, and with
// prefers-reduced-motion the sky is painted once and nothing moves.

const still = matchMedia("(prefers-reduced-motion: reduce)");

// ---------- Starry Night sky ----------
// Short impasto strokes follow a flow field made of a gentle wind plus a few vortices and the halos of stars;
// a wheat field is painted along the bottom. The scene is baked once per size; only a few gold glints drift.
const SKY = ["#13286b", "#1b3a8a", "#24489a", "#2f5cb8", "#3d6fc4", "#5a86d0"];
const LIGHT = ["#8fb0e0", "#b9cde8", "#e9e2c4"];
const GOLD = ["#f2c14e", "#f6d77a", "#e8a93a", "#fbe7a8"];
const FIELD = ["#c98b2a", "#dba63d", "#a8742a", "#7d8a3a", "#e6bd52", "#5f6e33"];

function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function hash(x, y) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const s = (v) => v * v * (3 - 2 * v);
  const u = s(x - xi), v = s(y - yi);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function scene(w, h) {
  const r = rng(29);
  const ground = h * (w < 700 ? 0.86 : 0.8);
  // vortices and stars avoid the text column on wide screens
  const vortices = [
    { x: w * 0.56, y: h * 0.3, r: Math.min(w, h) * 0.32, s: 1 },
    { x: w * 0.82, y: h * 0.18, r: Math.min(w, h) * 0.22, s: -1 },
    { x: w * 0.34, y: h * 0.56, r: Math.min(w, h) * 0.18, s: 1 },
  ];
  const stars = [];
  for (let i = 0; i < Math.max(5, Math.round(w / 210)); i++)
    stars.push({ x: (0.06 + 0.9 * r()) * w, y: (0.07 + 0.55 * r()) * ground, r: 9 + r() * 15 });
  return { r, ground, vortices, stars };
}

function field(sc, x, y) {
  let vx = 1, vy = Math.sin(x * 0.004 + noise(x * 0.003, y * 0.003) * 4) * 0.35;
  for (const v of [...sc.vortices, ...sc.stars]) {
    const dx = x - v.x, dy = y - v.y, d2 = dx * dx + dy * dy, rr = (v.s ? 1 : 2.6) * v.r;
    const k = Math.exp(-d2 / (rr * rr)) * (v.s ? 2.4 : 1.6);
    const len = Math.sqrt(d2) || 1, dir = v.s || 1;
    vx += (-dy / len) * k * dir;
    vy += (dx / len) * k * dir;
  }
  return Math.atan2(vy, vx);
}

function paintSky(ctx, w, h) {
  const sc = scene(w, h), { r, ground } = sc;
  const pick = (a) => a[Math.floor(r() * a.length)];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0c1a45");
  g.addColorStop(0.6, "#1a347c");
  g.addColorStop(1, "#22408e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.lineCap = "round";
  // sky strokes, each a short curve along the field
  const n = Math.floor((w * ground) / 70);
  for (let i = 0; i < n; i++) {
    let x = r() * w, y = r() * ground;
    const near = sc.stars.reduce((m, s) => Math.min(m, Math.hypot(x - s.x, y - s.y) / (s.r * 3.2)), 9);
    const roll = r();
    const color = near < 1 && roll < 0.7 ? pick(GOLD) : roll < 0.12 ? pick(LIGHT) : pick(SKY);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.55 + r() * 0.4;
    ctx.lineWidth = 2.6 + r() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = 3, step = 4 + r() * 4;
    for (let k = 0; k < steps; k++) {
      const a = field(sc, x, y);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // stars: a glow, concentric rings of strokes and a bright core
  for (const s of sc.stars) {
    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
    glow.addColorStop(0, "rgba(251,231,168,0.55)");
    glow.addColorStop(1, "rgba(251,231,168,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.fillRect(s.x - s.r * 3, s.y - s.r * 3, s.r * 6, s.r * 6);
    for (let ring = 1; ring <= 3; ring++)
      for (let k = 0; k < 10 + ring * 8; k++) {
        const a = r() * Math.PI * 2, rad = s.r * (0.55 + ring * 0.42) + (r() - 0.5) * 3;
        ctx.strokeStyle = pick(GOLD);
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rad, a, a + 0.32 + r() * 0.3);
        ctx.stroke();
      }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff3c8";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  // wheat field: rolling rows of warm strokes
  for (let i = 0; i < Math.floor((w * (h - ground)) / 26); i++) {
    const x = r() * w, y = ground + r() * (h - ground) + Math.sin(x * 0.01) * 6;
    const a = -0.35 + Math.sin(x * 0.006 + y * 0.02) * 0.5;
    ctx.strokeStyle = pick(FIELD);
    ctx.globalAlpha = 0.7 + r() * 0.3;
    ctx.lineWidth = 3 + r() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * (9 + r() * 9), y + Math.sin(a) * (9 + r() * 9));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return sc;
}

function initSky(canvas) {
  const hero = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  const base = document.createElement("canvas");
  let sc, w = 0, h = 0, dpr = 1, glints = [], raf = 0, visible = true;

  function bake() {
    w = hero.clientWidth;
    h = hero.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    for (const c of [canvas, base]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const b = base.getContext("2d");
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    sc = paintSky(b, w, h);
    const r = rng(7);
    glints = Array.from({ length: Math.round(w / 22) }, () => ({ x: r() * w, y: r() * sc.ground, trail: [], life: r() * 400 }));
    frame();
  }

  function frame() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(base, 0, 0);
    if (still.matches || !sc) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    for (const g of glints) {
      const a = field(sc, g.x, g.y);
      g.x += Math.cos(a) * 0.9;
      g.y += Math.sin(a) * 0.9;
      g.trail.push([g.x, g.y]);
      if (g.trail.length > 22) g.trail.shift();
      if (--g.life < 0 || g.x > w + 20 || g.y < -20 || g.y > sc.ground) {
        g.x = Math.random() * w * 0.9;
        g.y = Math.random() * sc.ground;
        g.trail = [];
        g.life = 300 + Math.random() * 300;
      }
      if (g.trail.length < 2) continue;
      // one path per glint: a faint tail and a brighter head
      const half = Math.floor(g.trail.length / 2);
      for (const [from, alpha] of [[0, 0.28], [half, 0.75]]) {
        ctx.strokeStyle = `rgba(251, 231, 168, ${alpha})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(...g.trail[from]);
        for (let k = from + 1; k < g.trail.length; k++) ctx.lineTo(...g.trail[k]);
        ctx.stroke();
      }
    }
    if (visible) raf = requestAnimationFrame(frame);
  }

  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(bake, 120);
  }).observe(hero);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(frame);
  }).observe(hero);
  still.addEventListener("change", () => {
    cancelAnimationFrame(raf);
    frame();
  });
  bake();
}

// ---------- scroll reveal ----------
// A block fades in once its top comes within the lower edge of the viewport. Driven by scroll position rather
// than an observer, so a block can never stay hidden.
function initReveal() {
  if (still.matches) return;
  let pending = [...document.querySelectorAll("[data-reveal]")];
  document.documentElement.classList.add("reveal-ready");
  function update() {
    const edge = innerHeight * 0.92;
    pending = pending.filter((item) => {
      if (item.getBoundingClientRect().top > edge) return true;
      item.classList.add("is-revealed");
      return false;
    });
    if (!pending.length) {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    }
  }
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  addEventListener("load", update);
  update();
}

// ---------- chapter pager ----------
function initPager() {
  const pager = document.getElementById("pager");
  if (!pager) return;
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const links = chapters.map((chapter) => {
    const link = document.createElement("a");
    link.href = `#${chapter.id}`;
    link.title = chapter.dataset.chapter;
    link.setAttribute("aria-label", chapter.dataset.chapter);
    const label = document.createElement("span");
    label.textContent = chapter.dataset.chapter;
    link.append(label);
    pager.append(link);
    return link;
  });
  // the current chapter is the last one whose top has passed the middle of the viewport
  function update() {
    const middle = innerHeight * 0.45;
    let current = 0;
    chapters.forEach((chapter, i) => {
      if (chapter.getBoundingClientRect().top <= middle) current = i;
    });
    links.forEach((link, i) => link.toggleAttribute("aria-current", i === current));
  }
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  addEventListener("load", update);
  update();
}

const sky = document.querySelector(".hero-sky");
if (sky) initSky(sky);
initReveal();
initPager();
