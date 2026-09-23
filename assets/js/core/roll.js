/* ============================================================
   UMBRA — Letter-roll text
   Rewrites a label into two stacked copies of every character so
   hover can roll the first out of the top while the second rides
   in from below. Straight from the reference's button treatment,
   restyled for a monochrome house.

   Usage:  <span data-roll>Add to bag</span>
   ============================================================ */

import { qsa, once, escapeHtml } from './utils.js';

export function initRoll(root = document) {
  qsa('[data-roll]', root).forEach(build);
}

export function build(el) {
  if (!once(el, 'Roll')) return;

  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);

  const chars = [...text].map((ch, i) => {
    if (ch === ' ') return '<span class="roll__char" data-space aria-hidden="true"></span>';
    const safe = escapeHtml(ch);
    return `<span class="roll__char" style="--i:${i}" aria-hidden="true">` +
             `<span>${safe}</span><span>${safe}</span>` +
           `</span>`;
  }).join('');

  el.classList.add('roll');
  el.innerHTML = chars;
}

/** Re-label a roll element in place (e.g. "Add to bag" -> "Added"). */
export function setRollText(el, text) {
  delete el.dataset.umbraRoll;
  el.textContent = text;
  build(el);
}
