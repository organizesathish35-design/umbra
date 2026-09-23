/* ============================================================
   UMBRA — Studio page
   Renders the team grid and gives the timeline rows a scrubbed
   entrance. Everything else on the page is declarative markup.
   ============================================================ */

import { qs, qsa, escapeHtml, hasGsap, reduced } from '../core/utils.js';
import { EDITORIAL, img } from '../data/products.js';
import { refresh } from '../core/scroll.js';

export async function init() {
  paintTeam();
  timelineRows();
  refresh();
}

function paintTeam() {
  const grid = qs('[data-team]');
  if (!grid) return;

  grid.innerHTML = EDITORIAL.team.map((m, i) => `
    <article class="card team__card">
      <div class="card__media reveal-img">
        <img class="card__img card__img--main" src="${img(m.id, 640, 800)}"
             alt="${escapeHtml(m.name)}" loading="lazy" decoding="async">
      </div>
      <div class="card__head">
        <h3 class="card__name">${escapeHtml(m.name)}</h3>
        <span class="card__price">${String(i + 1).padStart(2, '0')}</span>
      </div>
      <p class="card__meta"><span>${escapeHtml(m.role)}</span></p>
    </article>`).join('');
}

function timelineRows() {
  if (!hasGsap() || reduced()) return;
  const gsap = window.gsap;

  qsa('.timeline__row').forEach((row, i) => {
    gsap.fromTo(row,
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: (i % 3) * 0.05,
        scrollTrigger: { trigger: row, start: 'top 90%', once: true }
      }
    );
  });
}
