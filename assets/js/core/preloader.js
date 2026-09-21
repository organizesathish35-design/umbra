/* ============================================================
   UMBRA — Preloader

   HOME PAGE ONLY. The `.loader` markup lives in index.html and
   nowhere else, so this module no-ops on every inner page — an
   entrance is an arrival at the house, not a toll booth in front
   of each room. Moving it is a markup change, not a code change:
   paste the block back into another page and it runs there too.

   One second, start to gone. BUDGET is the whole life of the
   panel and every other number here is derived from it, so the
   entrance stays an entrance and never becomes a waiting room.

   The wordmark rise is CSS (see layout.css) so it plays from the
   first paint, with no script needed; the counted load is what
   this module adds — but only when there is a second to fill. If
   the page itself took longer than LATE to boot, the visitor has
   already been looking at this panel for too long: the count is
   skipped and the panel leaves on the short form.

   Three wall-clock guarantees, in order. `finish()` schedules the
   exit to land on the budget. If boot never calls it, GRACE starts
   the exit anyway. If the frame loop itself has stalled — rAF is
   throttled or suspended in a background tab, and every tween here
   rides it — HARD rips the panel out and unhides the page, because
   a visitor stranded behind a black panel with the scroll locked
   is the worst failure this site could have. All three are
   setTimeout, which keeps running when rAF does not.
   ============================================================ */

import { qs, hasGsap, reduced } from './utils.js';
import { stopScroll, startScroll } from './scroll.js';

const BUDGET = 1.0;   // seconds the panel is on screen, start to gone
const EXIT   = 0.48;  // length of the wipe, subtracted from the budget
const LATE   = 1.4;   // boot slower than this forfeits the intro
const GRACE  = 1.6;   // finish() never came — leave anyway
const HARD   = 3.0;   // frames have stopped — force the panel out

const LOADING_TITLE = 'Umbra | Loading';

export function startPreloader() {
  const el = qs('.loader');

  // No markup on this page (every page but home) — hand back a
  // no-op handle so main.js does not need to care.
  if (!el) return { finish: () => Promise.resolve() };

  if (reduced() || !hasGsap()) {
    el.remove();
    document.body.classList.remove('is-locked');
    return { finish: () => Promise.resolve() };
  }

  document.body.classList.add('is-locked');
  stopScroll();

  const gsap = window.gsap;
  const letters = el.querySelectorAll('.loader__letter');
  const count = qs('.loader__count', el);
  const bar = qs('.loader__bar', el);
  const original = document.title;
  const counter = { v: 0 };
  const t0 = performance.now();

  // A boot that already ate the budget: the visitor has been looking at
  // this panel long enough, so the count is dropped and all that is left
  // to play is the exit.
  const late = performance.now() > LATE * 1000;

  if (!late) document.title = LOADING_TITLE;

  /* ---- phase one: the intro, held at 92% ---- */

  const paint = () => {
    if (count) count.textContent = String(Math.round(counter.v)).padStart(3, '0');
  };

  // The wordmark is CSS and has been rising since first paint. All this
  // adds is the count and the bar, run over whatever the exit leaves of
  // the budget — so the wipe begins exactly as the letters land.
  if (!late) {
    gsap.timeline()
      .to(counter, { v: 92, duration: BUDGET - EXIT, ease: 'power2.out', onUpdate: paint }, 0)
      .to(bar, { scaleX: 0.92, duration: BUDGET - EXIT, ease: 'power2.out' }, 0);
  }

  /* ---- the exit, and the guarantee that it happens ---- */

  let resolveGone;
  const gone = new Promise((resolve) => { resolveGone = resolve; });

  let exiting = false;
  let settled = false;
  let scheduled = 0;
  const grace = setTimeout(() => startExit(), GRACE * 1000);
  const hard = setTimeout(() => {
    gsap.killTweensOf([el, ...letters, counter, count, bar].filter(Boolean));
    // Frames stopped, so boot may never have revealed the page.
    // Better a page with no entrance than an entrance with no page.
    document.querySelectorAll('[data-anim]').forEach((n) => { n.style.visibility = 'visible'; });
    done();
  }, HARD * 1000);

  function done() {
    if (settled) return;
    settled = true;
    clearTimeout(scheduled);
    clearTimeout(grace);
    clearTimeout(hard);
    document.title = original;
    el.remove();
    document.body.classList.remove('is-locked');
    startScroll();
    window.ScrollTrigger?.refresh();
    resolveGone();
  }

  function startExit() {
    if (exiting || settled) return;
    exiting = true;
    clearTimeout(grace);
    // Hands the letters back: the CSS rise has landed, and dropping it
    // here leaves them at rest for GSAP to carry out.
    el.classList.add('is-out');

    gsap.timeline({ onComplete: done })
      .to(counter, { v: 100, duration: 0.18, ease: 'power2.in', onUpdate: paint }, 0)
      .to(bar, { scaleX: 1, duration: 0.18, ease: 'power2.in' }, 0)
      .to(letters, { yPercent: -120, duration: 0.3, ease: 'expo.in', stagger: 0.02 }, 0.08)
      .to([count, bar], { autoAlpha: 0, duration: 0.2 }, 0.08)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.34, ease: 'expo.inOut' }, 0.14);
  }

  // Called once the page has an opening state worth uncovering.
  // The exit is placed so the panel clears on the budget, not so
  // many seconds after whenever boot happened to get here.
  const finish = () => {
    if (!exiting && !settled) {
      const spent = (performance.now() - t0) / 1000;
      scheduled = setTimeout(startExit, Math.max(0, BUDGET - EXIT - spent) * 1000);
    }
    return gone;
  };

  return { finish };
}
