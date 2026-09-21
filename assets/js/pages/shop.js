/* ============================================================
   UMBRA — Shop
   Category / colour filters and sorting, with a FLIP pass so
   cards glide to their new slots instead of snapping.
   Filter state lives in the URL, so a filtered grid is linkable.
   ============================================================ */

import { qs, qsa, hasGsap, reduced } from '../core/utils.js';
import { PRODUCTS } from '../data/products.js';
import { renderCards } from '../core/ui.js';
import { refresh } from '../core/scroll.js';
import { initReveal } from '../core/reveal.js';

const SORTS = {
  featured: (a, b) => PRODUCTS.indexOf(a) - PRODUCTS.indexOf(b),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name)
};

const state = { category: 'all', colour: 'all', sort: 'featured' };

export async function init() {
  const grid = qs('[data-shop-grid]');
  if (!grid) return;

  readUrl();
  wireControls();
  render(grid, false);
}

function readUrl() {
  const params = new URLSearchParams(location.search);
  if (params.get('category')) state.category = params.get('category');
  if (params.get('colour')) state.colour = params.get('colour');
  if (params.get('sort') && SORTS[params.get('sort')]) state.sort = params.get('sort');
}

function writeUrl() {
  const params = new URLSearchParams();
  if (state.category !== 'all') params.set('category', state.category);
  if (state.colour !== 'all') params.set('colour', state.colour);
  if (state.sort !== 'featured') params.set('sort', state.sort);
  const q = params.toString();
  history.replaceState(null, '', q ? `?${q}` : location.pathname);
}

function wireControls() {
  qsa('[data-filter]').forEach((btn) => {
    const [key, value] = btn.dataset.filter.split(':');
    btn.setAttribute('aria-pressed', String(state[key] === value));

    btn.addEventListener('click', () => {
      state[key] = value;
      qsa(`[data-filter^="${key}:"]`).forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.filter === `${key}:${value}`));
      });
      writeUrl();
      render(qs('[data-shop-grid]'), true);
    });
  });

  const sort = qs('[data-sort]');
  if (sort) {
    sort.value = state.sort;
    sort.addEventListener('change', () => {
      state.sort = sort.value;
      writeUrl();
      render(qs('[data-shop-grid]'), true);
    });
  }
}

function matches(p) {
  if (state.category !== 'all' && p.category !== state.category) return false;
  if (state.colour !== 'all' && p.colour !== state.colour) return false;
  return true;
}

function render(grid, animate) {
  const list = PRODUCTS.filter(matches).sort(SORTS[state.sort] || SORTS.featured);

  const countEl = qs('[data-shop-count]');
  if (countEl) {
    countEl.textContent = `${String(list.length).padStart(2, '0')} ${list.length === 1 ? 'piece' : 'pieces'}`;
  }

  const empty = qs('[data-shop-empty]');
  if (empty) empty.hidden = list.length > 0;

  if (!list.length) {
    grid.innerHTML = '';
    return;
  }

  // FLIP: remember where the surviving cards are before the swap
  const before = new Map();
  if (animate && hasGsap() && !reduced()) {
    qsa('.card', grid).forEach((c) => before.set(c.dataset.product, c.getBoundingClientRect()));
  }

  renderCards(grid, list, { eager: false });

  if (animate && hasGsap() && !reduced()) {
    const gsap = window.gsap;
    qsa('.card', grid).forEach((card, i) => {
      card.style.visibility = 'visible';
      const prev = before.get(card.dataset.product);
      const next = card.getBoundingClientRect();

      if (prev) {
        gsap.fromTo(card,
          { x: prev.left - next.left, y: prev.top - next.top },
          { x: 0, y: 0, duration: 0.75, ease: 'expo.out' }
        );
      } else {
        gsap.fromTo(card,
          { autoAlpha: 0, y: 34, scale: 0.97 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out', delay: i * 0.035 }
        );
      }
    });
  } else {
    initReveal(grid);
  }

  refresh();
}
