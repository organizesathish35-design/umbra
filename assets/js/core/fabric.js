/* ============================================================
   UMBRA — Footer easter egg
   A verlet-integrated cloth pinned along the top of the footer.
   Drag through it and the mesh swings; drag hard and threads
   snap. Thematic answer to the reference's footer mini-game.

   Cheap by design: ~500 points, 3 relaxation passes, and the
   whole loop parks itself whenever the footer is off screen.
   ============================================================ */

import { qs, reduced, isTouch } from './utils.js';

const GRAVITY = 0.32;
const DAMPING = 0.985;
const PASSES = 3;
const TEAR = 62;          // px a thread may stretch before it snaps
const CURSOR_R = 52;

export function initFabric() {
  const canvas = qs('.footer__canvas');
  if (!canvas) return;

  const scoreEl = qs('[data-threads]');
  if (reduced()) {
    canvas.remove();
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  let points = [];
  let links = [];
  let w = 0, h = 0, dpr = 1;
  let torn = 0;
  let running = false;
  let rafId = 0;

  const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, down: false };

  /* ---------------- build ---------------- */

  function build() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = Math.max(14, Math.min(40, Math.round(w / 46)));
    const spacing = w / cols;
    const rows = Math.max(6, Math.min(18, Math.round((h * 0.72) / spacing)));

    points = [];
    links = [];
    torn = 0;
    if (scoreEl) scoreEl.textContent = '00';

    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        const px = x * spacing;
        const py = y * spacing * 0.92;
        points.push({
          x: px, y: py, ox: px, oy: py,
          pinned: y === 0 && x % 2 === 0
        });
      }
    }

    const idx = (x, y) => y * (cols + 1) + x;
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        if (x < cols) links.push({ a: idx(x, y), b: idx(x + 1, y), len: spacing, dead: false });
        if (y < rows) links.push({ a: idx(x, y), b: idx(x, y + 1), len: spacing * 0.92, dead: false });
      }
    }
  }

  /* ---------------- simulate ---------------- */

  function step() {
    for (const p of points) {
      if (p.pinned) continue;

      // pointer interaction — push the cloth around the cursor
      if (pointer.x > -9000) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < CURSOR_R) {
          const force = (1 - d / CURSOR_R) * (pointer.down ? 2.6 : 1.1);
          p.ox = p.x - (pointer.x - pointer.px) * force;
          p.oy = p.y - (pointer.y - pointer.py) * force;
        }
      }

      const vx = (p.x - p.ox) * DAMPING;
      const vy = (p.y - p.oy) * DAMPING;
      p.ox = p.x; p.oy = p.y;
      p.x += vx;
      p.y += vy + GRAVITY;
    }

    for (let pass = 0; pass < PASSES; pass++) {
      for (const l of links) {
        if (l.dead) continue;
        const a = points[l.a];
        const b = points[l.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;

        if (dist > TEAR + l.len) {
          l.dead = true;
          torn++;
          if (scoreEl) scoreEl.textContent = String(torn).padStart(2, '0');
          continue;
        }

        const diff = ((l.len - dist) / dist) * 0.5;
        const ox = dx * diff;
        const oy = dy * diff;
        if (!a.pinned) { a.x -= ox; a.y -= oy; }
        if (!b.pinned) { b.x += ox; b.y += oy; }
      }
    }

    pointer.px = pointer.x;
    pointer.py = pointer.y;
  }

  /* ---------------- draw ---------------- */

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(244, 243, 241, 0.16)';
    ctx.beginPath();
    for (const l of links) {
      if (l.dead) continue;
      const a = points[l.a];
      const b = points[l.b];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    // Pinned anchors read as stitches along the top
    ctx.fillStyle = 'rgba(244, 243, 241, 0.45)';
    for (const p of points) {
      if (!p.pinned) continue;
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
  }

  function loop() {
    step();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  /* ---------------- input ---------------- */

  const setPointer = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    if (pointer.px < -9000) { pointer.px = pointer.x; pointer.py = pointer.y; }
  };

  canvas.addEventListener('pointermove', setPointer);
  canvas.addEventListener('pointerdown', (e) => { pointer.down = true; setPointer(e); });
  window.addEventListener('pointerup', () => { pointer.down = false; });
  canvas.addEventListener('pointerleave', () => {
    pointer.x = pointer.y = -9999;
    pointer.px = pointer.py = -9999;
  });

  // Double tap / click resets the weave
  canvas.addEventListener('dblclick', build);
  qs('[data-fabric-reset]')?.addEventListener('click', build);

  /* ---------------- lifecycle ---------------- */

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      if (!points.length) build();
      loop();
    } else if (!entry.isIntersecting && running) {
      running = false;
      cancelAnimationFrame(rafId);
    }
  }, { rootMargin: '120px' });

  io.observe(canvas);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 240);
  });

  // Touch devices get the weave but no hint about dragging
  if (isTouch()) canvas.style.cursor = 'grab';
}
