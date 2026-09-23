/* ============================================================
   UMBRA — Page transitions
   Intercepts same-origin navigations, wipes a black curtain up
   over the page, then lets the browser do the actual navigation.
   The incoming page drops the curtain away in initPreloader's
   short form, so the two halves read as one movement.
   ============================================================ */

import { qs, hasGsap, reduced } from './utils.js';

export function initTransition() {
  const curtain = qs('.curtain');
  if (!curtain || reduced() || !hasGsap()) return;

  const gsap = window.gsap;
  const label = qs('.curtain__label', curtain);

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    // Leave alone: new tabs, downloads, hashes, other origins, opt-outs
    if (
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 ||
      link.target === '_blank' ||
      link.hasAttribute('download') ||
      link.dataset.noTransition !== undefined ||
      !link.href
    ) return;

    let url;
    try { url = new URL(link.href, location.href); } catch { return; }

    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      // Same page — let anchors and filters behave normally
      return;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    e.preventDefault();

    if (label) {
      label.textContent = (link.dataset.transitionLabel || link.textContent || '').trim().slice(0, 24);
    }

    gsap.timeline()
      .set(curtain, { yPercent: 100 })
      .to(curtain, { yPercent: 0, duration: 0.72, ease: 'expo.inOut' })
      .fromTo(label, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.3')
      .add(() => { location.href = url.href; }, '+=0.05');
  });

  // Coming back via the bfcache: make sure the curtain is parked
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) gsap.set(curtain, { yPercent: 100 });
  });
}
