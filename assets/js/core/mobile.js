/* ============================================================
   UMBRA — Mobile behaviour

   Everything in here is gated on a single matchMedia check and
   never runs on a desktop viewport. Where a mobile pattern needs
   different markup from the desktop one, the DOM is restructured
   here at runtime rather than duplicated in seven HTML files —
   and each restructure adds a class (`rail--swipe`, `pdp--swipe`)
   that the mobile stylesheet keys off, so desktop CSS can't be
   reached even if someone resizes the window afterwards.

   Crossing the breakpoint by resizing needs a reload. That is a
   deliberate trade: re-entrant teardown of three carousels buys
   almost nothing on a device that cannot change width.
   ============================================================ */

import { qs, qsa, once } from './utils.js';
import { refresh } from './scroll.js';

const MOBILE = '(max-width: 860px)';

export function initMobile() {
  if (!window.matchMedia(MOBILE).matches) return;

  document.documentElement.classList.add('is-mobile');

  railCarousel();
  craftStack();
  pdpGallery();
  shopFilters();
  lightboxSwipe();

  refresh();
}

/* ------------------------------------------------------------
   Craft — give each chapter its own plate.
   The desktop sticky cross-fade has no room to run in a single
   column, so the four images are redistributed into the four
   chapters rather than fought with.
   ------------------------------------------------------------ */

function craftStack() {
  const craft = qs('.craft');
  if (!craft || !once(craft, 'CraftStack')) return;

  const plates = qsa('.craft__sticky img', craft);
  const chapters = qsa('.craft__chapter', craft);
  if (!plates.length || !chapters.length) return;

  chapters.forEach((chapter, i) => {
    const image = plates[i];
    if (!image) return;
    image.classList.remove('is-active');
    image.loading = 'lazy';
    const plate = document.createElement('div');
    plate.className = 'craft__plate';
    plate.appendChild(image);
    chapter.prepend(plate);
  });

  craft.classList.add('craft--stacked');
}

/* ------------------------------------------------------------
   Rail — the desktop pin/scrub becomes a snap carousel.
   Swiping is the right verb on a phone; a scrubbed pin fights
   the browser's own scroll and feels broken under a thumb.
   ------------------------------------------------------------ */

function railCarousel() {
  const rail = qs('.rail');
  const viewport = qs('.rail__viewport', rail || document);
  const track = qs('.rail__track', rail || document);
  if (!rail || !viewport || !track || !once(rail, 'RailSwipe')) return;

  const intro = qs('.rail__intro', track);
  const outro = qs('.rail__outro', track);
  const bar = qs('.rail__bar', rail);
  const cards = qsa('.rail__card', track);
  if (!cards.length) return;

  // Lift the copy out of the scroller so only product slides swipe
  if (intro) {
    const head = document.createElement('div');
    head.className = 'rail__head';
    head.appendChild(intro);
    rail.insertBefore(head, viewport);
  }

  // Index readout under the progress bar
  const meta = document.createElement('div');
  meta.className = 'rail__swipe-meta';
  meta.innerHTML = `<span>Swipe the rail</span><span><b data-rail-index>01</b> / ${String(cards.length).padStart(2, '0')}</span>`;
  rail.insertBefore(meta, bar ? bar.nextSibling : null);

  if (outro) rail.appendChild(outro);

  rail.classList.add('rail--swipe');

  const fill = bar ? qs('i', bar) : null;
  const indexOut = qs('[data-rail-index]', meta);

  let ticking = false;
  const update = () => {
    ticking = false;
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 0;
    if (fill) fill.style.transform = `scaleX(${p})`;

    // Whichever card is nearest the centre of the viewport
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const c = card.offsetLeft + card.offsetWidth / 2;
      const d = Math.abs(c - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    if (indexOut) indexOut.textContent = String(best + 1).padStart(2, '0');
  };

  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  update();
}

/* ------------------------------------------------------------
   Product gallery — swipeable slides + dots.
   Photo urls come from a data attribute written by pages/product.js,
   so this module never has to import the catalogue.
   ------------------------------------------------------------ */

function pdpGallery() {
  const pdp = qs('.pdp');
  const figure = qs('[data-pdp-figure]');
  if (!pdp || !figure || !once(pdp, 'PdpSwipe')) return;

  let photos = [];
  try { photos = JSON.parse(figure.dataset.gallery || '[]'); } catch { photos = []; }
  if (photos.length < 1) return;

  const alt = qs('img', figure)?.alt || '';

  const swipe = document.createElement('div');
  swipe.className = 'pdp__swipe';
  swipe.setAttribute('role', 'group');
  swipe.setAttribute('aria-label', 'Product images, swipe to browse');
  swipe.innerHTML = photos.map((src, i) => `
    <figure class="pdp__slide">
      <img src="${src}" alt="${i === 0 ? alt : ''}" ${i === 0 ? '' : 'aria-hidden="true"'}
           loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">
    </figure>`).join('');

  const dots = document.createElement('div');
  dots.className = 'pdp__dots';
  dots.innerHTML = photos.map((_, i) =>
    `<button class="pdp__dot ${i === 0 ? 'is-active' : ''}" type="button"
             data-pdp-dot="${i}" aria-label="Go to image ${i + 1}"></button>`).join('');

  const gallery = qs('.pdp__gallery', pdp) || figure.parentElement;
  gallery.prepend(dots);
  gallery.prepend(swipe);
  pdp.classList.add('pdp--swipe');

  const slides = qsa('.pdp__slide', swipe);
  const dotEls = qsa('.pdp__dot', dots);

  dots.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pdp-dot]');
    if (!btn) return;
    const target = slides[Number(btn.dataset.pdpDot)];
    if (target) swipe.scrollTo({ left: target.offsetLeft - swipe.offsetLeft, behavior: 'smooth' });
  });

  let ticking = false;
  swipe.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const mid = swipe.scrollLeft + swipe.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      dotEls.forEach((d, i) => d.classList.toggle('is-active', i === best));
    });
  }, { passive: true });
}

/* ------------------------------------------------------------
   Shop filters — categories stay on one scrolling row, colour
   and sort move into a sheet so the sticky bar is 56px, not 180.
   The original controls are *moved*, not rebuilt, so every
   listener shop.js attached keeps working.
   ------------------------------------------------------------ */

function shopFilters() {
  const filters = qs('.filters');
  if (!filters || !once(filters, 'MobileFilters')) return;

  const rows = qsa('.pill-row', filters);
  const categoryRow = rows[0];
  const colourRow = rows[1];
  const select = qs('.select', filters);
  if (!categoryRow) return;

  // Category row becomes a masked horizontal scroller
  const scroller = document.createElement('div');
  scroller.className = 'filters__scroll';
  filters.insertBefore(scroller, categoryRow);
  scroller.appendChild(categoryRow);

  if (!colourRow && !select) return;

  // Toggle + sheet
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'filters__more';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = 'Filter <i data-filter-badge></i>';

  const sheet = document.createElement('div');
  sheet.className = 'filters__sheet';
  sheet.dataset.open = 'false';
  sheet.innerHTML = '<div><div class="filters__sheet-inner"></div></div>';
  const inner = qs('.filters__sheet-inner', sheet);

  if (colourRow) {
    const block = document.createElement('div');
    block.innerHTML = '<h4>Colour</h4>';
    block.appendChild(colourRow);
    inner.appendChild(block);
  }
  if (select) {
    const block = document.createElement('div');
    block.innerHTML = '<h4>Sort</h4>';
    block.appendChild(select);
    inner.appendChild(block);
  }

  // The old flex wrapper is empty now
  qsa(':scope > div', filters).forEach((d) => {
    if (d !== scroller && !d.children.length) d.remove();
  });

  filters.appendChild(toggle);
  filters.after(sheet);

  const badge = qs('[data-filter-badge]', toggle);
  const sheetId = 'filters-sheet';
  sheet.id = sheetId;
  toggle.setAttribute('aria-controls', sheetId);

  const syncBadge = () => {
    // "Any"/"Featured" are the defaults — only count real narrowing
    const colourActive = colourRow
      ? qsa('[aria-pressed="true"]', colourRow).some((b) => !b.dataset.filter.endsWith(':all'))
      : false;
    const sortActive = select ? qs('select', select)?.value !== 'featured' : false;
    const n = (colourActive ? 1 : 0) + (sortActive ? 1 : 0);
    badge.textContent = n ? `(${n})` : '';
  };

  toggle.addEventListener('click', () => {
    const open = sheet.dataset.open !== 'true';
    sheet.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    setTimeout(refresh, 480);
  });

  filters.addEventListener('click', syncBadge);
  sheet.addEventListener('click', syncBadge);
  sheet.addEventListener('change', syncBadge);
  syncBadge();

  // Keep the selected category in view when the page loads filtered
  const active = qs('[aria-pressed="true"]', categoryRow);
  if (active) scroller.scrollLeft = Math.max(0, active.offsetLeft - 16);
}

/* ------------------------------------------------------------
   Lightbox — horizontal swipe moves between looks
   ------------------------------------------------------------ */

function lightboxSwipe() {
  const box = qs('.lightbox');
  if (!box || !once(box, 'LbSwipe')) return;

  let x0 = null;
  let y0 = null;

  box.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    x0 = t.clientX;
    y0 = t.clientY;
  }, { passive: true });

  box.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - x0;
    const dy = t.clientY - y0;
    x0 = null;

    // Ignore mostly-vertical drags so a scroll gesture doesn't page
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    qs(dx < 0 ? '[data-lb-next]' : '[data-lb-prev]', box)?.click();
  }, { passive: true });
}
