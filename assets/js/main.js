/* ============================================================
   UMBRA — Bootstrap
   Order matters: scroll spine first (everything else measures
   against it), then chrome, then the page module, then reveals.
   The preloader runs alongside all of it, not after it — and it
   leaves on its own clock, once the page module has staged the
   opening. Nothing after that point is allowed to hold it down.
   ============================================================ */

import { ready, emit } from './core/utils.js';
import { initScroll, refresh } from './core/scroll.js';
import { mountChrome } from './core/chrome.js';
import { initNav, initThemeInversion } from './core/nav.js';
import { initCart, initToasts } from './core/cart.js';
import { initCursor } from './core/cursor.js';
import { startPreloader } from './core/preloader.js';
import { initTransition } from './core/transition.js';
import { initRoll } from './core/roll.js';
import { initReveal } from './core/reveal.js';
import { initScrollFX } from './core/scrollfx.js';
import { initFabric } from './core/fabric.js';
import { initMobile } from './core/mobile.js';
import { initQuickAdd, initAccordions, initForms, initMarquees } from './core/ui.js';

/* The graph resolved, so every module below exists and boot() is about to
   run. assets/js/boot-guard.js watches for this and stands down. */
window.__umbraBooted = true;

const PAGES = {
  home:     () => import('./pages/home.js'),
  shop:     () => import('./pages/shop.js'),
  product:  () => import('./pages/product.js'),
  lookbook: () => import('./pages/lookbook.js'),
  about:    () => import('./pages/about.js'),
  contact:  () => import('./pages/contact.js')
};

async function boot() {
  document.documentElement.classList.add('js');

  initScroll();

  // Kicks off immediately so the counter never sits frozen
  const loader = startPreloader();

  mountChrome();
  initNav();
  initCart();
  initToasts();
  initQuickAdd();
  initCursor();
  initTransition();

  // Page-specific markup must exist before reveals are armed
  const page = document.body.dataset.page;
  if (page && PAGES[page]) {
    try {
      const mod = await PAGES[page]();
      await mod.init?.();
    } catch (err) {
      console.error(`[umbra] page module "${page}" failed`, err);
    }
  }

  // Restructures the rail, PDP gallery and filters on small screens.
  // Runs before the reveal layer so triggers measure the final DOM,
  // and is a no-op above 860px.
  initMobile();

  // After the page module, so it measures against any pinned sections
  initThemeInversion();

  initMarquees();
  initAccordions();
  initForms();
  initRoll();
  initFabric();

  // The page now has an opening state worth uncovering, so the panel
  // can start leaving. Everything below runs while it wipes: waiting
  // on fonts and arming the reveal layer are honest work, but neither
  // is a reason to hold a visitor behind a black screen.
  const curtain = loader.finish();
  // Pages hold their opening timeline until the loader is out of the way
  curtain.then(() => emit('intro'));

  // Fonts settle before anything measures line breaks
  await ready();
  initReveal();
  // Scrubbed motion is armed after the one-shot reveals so both are
  // measuring the same settled layout
  initScrollFX();

  await curtain;
  refresh();
}

boot().catch((err) => {
  // Never leave the page invisible if something above throws
  console.error('[umbra] boot failed', err);
  document.documentElement.classList.remove('js');
  document.documentElement.classList.add('no-js');
  document.querySelector('.loader')?.remove();
  document.body.classList.remove('is-locked');
});
