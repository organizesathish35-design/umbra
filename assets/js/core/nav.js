/* ============================================================
   UMBRA — Header behaviour
   • tucks away on scroll down, returns on scroll up
   • gains a frosted plate once off the top
   • inverts to white while any [data-theme="dark"] band is
     behind it — the reference's data-nav-dark trick
   • drives the full-screen menu overlay
   ============================================================ */

import { qs, qsa, hasGsap, on } from './utils.js';
import { stopScroll, startScroll } from './scroll.js';

export function initNav() {
  const header = qs('.header');
  if (!header) return;

  markCurrent();
  stickAndTuck(header);
  menu(header);
}

/**
 * Colour inversion over dark bands.
 *
 * Deliberately separate from initNav and called *after* the page
 * module has run: ScrollTrigger measures in creation order, so a
 * trigger built before a pinned section (the home rail) would keep
 * pre-pin positions through every later refresh.
 */
export function initThemeInversion() {
  const header = qs('.header');
  if (header) invertOverDark(header);
}

/* ---------------- current page link ---------------- */

function markCurrent() {
  const here = location.pathname.split('/').pop() || 'index.html';
  qsa('.nav a, .menu__link').forEach((a) => {
    const target = a.getAttribute('href');
    if (!target) return;
    if (target === here) {
      a.classList.add('link--active');
      a.setAttribute('aria-current', 'page');
    }
  });
}

/* ---------------- stick / tuck ---------------- */

function stickAndTuck(header) {
  let last = window.scrollY;

  on('scroll', ({ y }) => {
    header.classList.toggle('is-stuck', y > 30);

    const menuOpen = document.body.classList.contains('menu-open');
    const goingDown = y > last && y > 260;
    header.classList.toggle('is-tucked', goingDown && !menuOpen);
    last = y;
  });

  // Native-scroll fallback (reduced motion)
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('is-stuck', y > 30);
  }, { passive: true });
}

/* ---------------- colour inversion ---------------- */

function invertOverDark(header) {
  const bands = qsa('[data-theme="dark"]');
  if (!bands.length) return;

  if (hasGsap()) {
    bands.forEach((band) => {
      window.ScrollTrigger.create({
        trigger: band,
        start: 'top 58px',
        end: 'bottom 58px',
        onToggle: (self) => header.classList.toggle('is-inverted', self.isActive)
      });
    });
    return;
  }

  const check = () => {
    const probe = header.getBoundingClientRect().height * 0.6;
    const over = bands.some((b) => {
      const r = b.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    header.classList.toggle('is-inverted', over);
  };
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  check();
}

/* ---------------- full-screen menu ---------------- */

function menu(header) {
  const overlay = qs('.menu');
  const toggle = qs('[data-menu-toggle]', header);
  if (!overlay || !toggle) return;

  const links = qsa('.menu__link', overlay);
  const previews = qsa('.menu__preview img', overlay);
  const gsap = window.gsap;
  let open = false;
  let animating = false;

  const setOpen = (next) => {
    if (animating || next === open) return;
    open = next;
    animating = true;

    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-locked', open);
    overlay.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    open ? stopScroll() : startScroll();

    if (!gsap) {
      overlay.style.visibility = open ? 'visible' : 'hidden';
      overlay.style.clipPath = open ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)';
      animating = false;
      if (open) links[0]?.focus();
      return;
    }

    const tl = gsap.timeline({ onComplete: () => { animating = false; } });

    if (open) {
      tl.set(overlay, { visibility: 'visible' })
        .fromTo(overlay,
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 0.85, ease: 'expo.inOut' })
        .fromTo(links.map((l) => l.firstElementChild),
          { yPercent: 118 },
          { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, '-=0.45')
        .fromTo(qs('.menu__preview', overlay),
          { autoAlpha: 0, scale: 1.08 },
          { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, '-=0.7')
        .fromTo(qs('.menu__foot', overlay),
          { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.5')
        .add(() => links[0]?.focus());
    } else {
      tl.to(links.map((l) => l.firstElementChild),
          { yPercent: -110, duration: 0.45, ease: 'expo.in', stagger: 0.03 })
        .to(overlay, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut' }, '-=0.2')
        .set(overlay, { visibility: 'hidden' })
        .add(() => toggle.focus());
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });

  // Hovering a link swaps the preview plate
  links.forEach((link) => {
    link.addEventListener('pointerenter', () => {
      const key = link.dataset.preview;
      previews.forEach((p) => p.classList.toggle('is-active', p.dataset.previewFor === key));
    });
  });
}
