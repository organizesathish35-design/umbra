/* ============================================================
   UMBRA — small helpers shared by every module
   ============================================================ */

export const qs  = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
export const lerp  = (a, b, t) => a + (b - a) * t;

export const gsap = () => window.gsap || null;
export const hasGsap = () => Boolean(window.gsap && window.ScrollTrigger);

export const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isTouch = () =>
  window.matchMedia('(hover: none), (pointer: coarse)').matches;

export const mq = (q) => window.matchMedia(q).matches;

/**
 * Wait for fonts + a paint so measurements are honest.
 *
 * Both waits are raced against a timer. requestAnimationFrame is
 * throttled or suspended in a background tab, and document.fonts
 * can stay pending if a webfont request hangs — without the race,
 * boot would stall behind either one and never reveal the page.
 */
export async function ready(fontTimeout = 3000, paintTimeout = 1000) {
  // Fonts get the longer leash: headline splitting measures line
  // breaks, so giving up early would split against fallback metrics.
  if (document.fonts && document.fonts.ready) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, fontTimeout))
      ]);
    } catch { /* ignore */ }
  }

  return new Promise((resolve) => {
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      resolve();
    };
    requestAnimationFrame(() => requestAnimationFrame(settle));
    setTimeout(settle, paintTimeout);
  });
}

/** Debounce trailing-edge. */
export function debounce(fn, wait = 160) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Fire once per element — prevents double-initialising on re-runs. */
export function once(el, key) {
  const flag = `umbra${key}`;
  if (el.dataset[flag]) return false;
  el.dataset[flag] = '1';
  return true;
}

/** Element -> HTML, for list rendering. */
export function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (values[i] ?? ''), '');
}

export function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Tiny event bus so modules stay decoupled. */
const bus = new EventTarget();
export const emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, { detail }));
export const on   = (name, fn) => bus.addEventListener(name, (e) => fn(e.detail));

/** localStorage that never throws (private mode, blocked cookies). */
export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }
};
