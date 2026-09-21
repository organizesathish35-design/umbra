/* ============================================================
   UMBRA — Scroll-linked motion

   The reveal layer (core/reveal.js) fires animations once, when an
   element arrives. This module is the other half: motion that is
   *scrubbed* — bound frame by frame to scroll position, so it runs
   forwards when you scroll down and backwards when you scroll up.
   That reversibility is what makes a page feel like it is being
   driven rather than merely triggered.

   Declared from markup, same as the reveal layer:

     data-fx="highlight"   words light up in sequence as you read past
     data-fx="depth"       section recedes as it leaves the viewport
     data-fx="exit"        hero-style scale + lift on the way out
     data-fx="clip"        image uncovers itself across its own travel
     data-fx="drift"       layered parallax, optional rotation

   Optional tuning:
     data-fx-from / data-fx-to    ScrollTrigger start / end
     data-fx-amount               effect strength, 0–1 (default 1)
   ============================================================ */

import { qsa, hasGsap, reduced, once, clamp } from './utils.js';
import { words } from './split.js';
import { getVelocity } from './scroll.js';

export function initScrollFX(root = document) {
  if (reduced() || !hasGsap()) return;

  highlight(root);
  depth(root);
  exit(root);
  clipReveal(root);
  drift(root);
  cardLift(root);
}

/* ------------------------------------------------------------
   Word highlight
   The sentence sits dim and lights up word by word as it passes
   through the middle of the screen. Scrubbed, so reading back up
   dims it again.
   ------------------------------------------------------------ */

function highlight(root) {
  const gsap = window.gsap;

  qsa('[data-fx="highlight"]', root).forEach((el) => {
    if (!once(el, 'FxHighlight')) return;

    const parts = words(el);
    if (!parts.length) return;

    el.style.visibility = 'visible';
    el.classList.add('fx-highlight');
    parts.forEach((w) => w.classList.add('fx-word'));

    gsap.fromTo(parts,
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.6,
        scrollTrigger: {
          trigger: el,
          start: el.dataset.fxFrom || 'top 78%',
          end: el.dataset.fxTo || 'bottom 52%',
          scrub: 0.6
        }
      }
    );
  });
}

/* ------------------------------------------------------------
   Depth
   A band settles back a little as it leaves — the thing that makes
   consecutive sections read as stacked planes instead of a single
   flat ribbon. Deliberately small: at full strength it looks like a
   slideshow rather than a page.
   ------------------------------------------------------------ */

function depth(root) {
  const gsap = window.gsap;

  qsa('[data-fx="depth"]', root).forEach((el) => {
    if (!once(el, 'FxDepth')) return;
    const amount = clamp(parseFloat(el.dataset.fxAmount ?? 1), 0, 1);

    gsap.fromTo(el,
      { scale: 1, opacity: 1 },
      {
        scale: 1 - 0.055 * amount,
        opacity: 1 - 0.45 * amount,
        ease: 'none',
        transformOrigin: 'center top',
        scrollTrigger: {
          trigger: el,
          start: el.dataset.fxFrom || 'bottom 88%',
          end: el.dataset.fxTo || 'bottom 18%',
          scrub: 0.5
        }
      }
    );
  });
}

/* ------------------------------------------------------------
   Exit
   The hero's own send-off: lifts and shrinks slightly as the next
   section climbs over it.
   ------------------------------------------------------------ */

function exit(root) {
  const gsap = window.gsap;

  qsa('[data-fx="exit"]', root).forEach((el) => {
    if (!once(el, 'FxExit')) return;
    const amount = clamp(parseFloat(el.dataset.fxAmount ?? 1), 0, 1);

    gsap.fromTo(el,
      { scale: 1, yPercent: 0, opacity: 1 },
      {
        scale: 1 - 0.09 * amount,
        yPercent: -6 * amount,
        opacity: 1 - 0.55 * amount,
        ease: 'none',
        transformOrigin: 'center center',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5
        }
      }
    );
  });
}

/* ------------------------------------------------------------
   Clip reveal
   The picture uncovers itself across its own travel through the
   viewport instead of snapping open once. Pairs with `drift` on the
   inner image for the classic window-onto-a-moving-scene look.
   ------------------------------------------------------------ */

function clipReveal(root) {
  const gsap = window.gsap;

  qsa('[data-fx="clip"]', root).forEach((el) => {
    if (!once(el, 'FxClip')) return;

    gsap.fromTo(el,
      { clipPath: 'inset(0% 0% 26% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: el.dataset.fxFrom || 'top 92%',
          end: el.dataset.fxTo || 'top 42%',
          scrub: 0.5
        }
      }
    );
  });
}

/* ------------------------------------------------------------
   Drift
   Parallax with an optional touch of rotation. Negative amounts
   travel against the scroll, positive with it.
   ------------------------------------------------------------ */

function drift(root) {
  const gsap = window.gsap;

  qsa('[data-fx="drift"]', root).forEach((el) => {
    if (!once(el, 'FxDrift')) return;

    const amount = parseFloat(el.dataset.fxAmount ?? 0.12);
    const spin = parseFloat(el.dataset.fxSpin ?? 0);
    const scope = el.closest('[data-fx-scope]') || el.parentElement || el;

    gsap.fromTo(el,
      { yPercent: -amount * 50, rotate: -spin },
      {
        yPercent: amount * 50,
        rotate: spin,
        ease: 'none',
        scrollTrigger: {
          trigger: scope,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.4
        }
      }
    );
  });
}

/* ------------------------------------------------------------
   Card lift
   Product cards ease back a touch while the page is moving fast and
   settle when it stops. Ties the grid to the scroll rather than
   leaving it sitting still underneath it.
   ------------------------------------------------------------ */

function cardLift(root) {
  const cards = qsa('[data-fx-lift] .card', root);
  if (!cards.length) return;

  const gsap = window.gsap;
  let current = 0;

  const tick = () => {
    const target = clamp(Math.abs(getVelocity()) * 0.004, 0, 0.035);
    current += (target - current) * 0.09;
    if (current > 0.0005) {
      gsap.set(cards, { scale: 1 - current, force3D: true });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
