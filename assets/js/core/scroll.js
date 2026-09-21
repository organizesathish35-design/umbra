/* ============================================================
   UMBRA — Smooth scroll spine
   Lenis drives the page; ScrollTrigger is slaved to it so pinned
   sections and scrubbed timelines stay in lockstep with the lerp.
   ============================================================ */

import { qs, reduced, emit } from './utils.js';

let lenis = null;
let velocity = 0;

export function initScroll() {
  const { gsap, ScrollTrigger, Lenis } = window;

  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    // Mobile browsers resize the viewport when the address bar hides,
    // which would otherwise re-measure every trigger mid-scroll and
    // make pinned/sticky sections jump. No effect on desktop.
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  if (Lenis && !reduced()) {
    lenis = new Lenis({
      // `duration`/`easing` drive programmatic scrollTo; `lerp` drives
      // the wheel. A lower lerp means more lag between the wheel and
      // the page, which is what reads as weight — the scrubbed effects
      // in core/scrollfx.js ride on that glide.
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      lerp: 0.075
    });

    lenis.on('scroll', (e) => {
      velocity = e.velocity || 0;
      if (ScrollTrigger) ScrollTrigger.update();
      emit('scroll', { y: e.scroll ?? window.scrollY, velocity });
    });

    if (gsap) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } else {
    // Reduced motion / no library: native scroll, still broadcast.
    let last = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      velocity = y - last;
      last = y;
      emit('scroll', { y, velocity });
    }, { passive: true });
  }

  initProgress();
  initToTop();

  // Recalculate once imagery has settled.
  window.addEventListener('load', () => refresh());
  return lenis;
}

export function scrollTo(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { duration: 1.2, ...opts });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
  else qs(target)?.scrollIntoView({ behavior: 'smooth' });
}

export const stopScroll  = () => lenis?.stop();
export const startScroll = () => lenis?.start();
export const getVelocity = () => velocity;
export const refresh     = () => window.ScrollTrigger?.refresh();

/* ---------------- Scroll progress bar ---------------- */

function initProgress() {
  const bar = qs('.progress');
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = `scaleX(${p})`;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ---------------- Back to top ---------------- */

function initToTop() {
  const btn = qs('.to-top');
  if (!btn) return;
  btn.addEventListener('click', () => scrollTo(0));
  const update = () => btn.classList.toggle('is-on', window.scrollY > window.innerHeight * 1.2);
  window.addEventListener('scroll', update, { passive: true });
  update();
}
