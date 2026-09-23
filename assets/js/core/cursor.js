/* ============================================================
   UMBRA — Custom cursor
   A difference-blended ring that trails the pointer, swells over
   interactive elements and inflates into a labelled disc when an
   element declares `data-cursor="View"`.
   ============================================================ */

import { isTouch, reduced, lerp } from './utils.js';

export function initCursor() {
  if (isTouch() || reduced()) return;

  const ring = document.createElement('div');
  ring.className = 'cursor';
  ring.innerHTML = '<span class="cursor__text"></span>';
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.append(ring, dot);

  const label = ring.firstElementChild;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let visible = false;

  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!visible) { visible = true; ring.classList.remove('is-hidden'); rx = mx; ry = my; }
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    visible = false;
    ring.classList.add('is-hidden');
  });

  // Ring lags behind the dot — that lag is the whole effect
  const tick = () => {
    rx = lerp(rx, mx, 0.16);
    ry = lerp(ry, my, 0.16);
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Delegated state changes so dynamically rendered cards work too
  const INTERACTIVE = 'a, button, [role="button"], input, select, textarea, .card, .look';

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    if (labelled) {
      label.textContent = labelled.dataset.cursor;
      ring.classList.add('is-label');
      ring.classList.remove('is-hover');
      return;
    }
    if (e.target.closest(INTERACTIVE)) {
      ring.classList.add('is-hover');
      ring.classList.remove('is-label');
    }
  });

  document.addEventListener('pointerout', (e) => {
    const from = e.target.closest('[data-cursor]') || e.target.closest(INTERACTIVE);
    const to = e.relatedTarget?.closest?.('[data-cursor]') || e.relatedTarget?.closest?.(INTERACTIVE);
    if (from && from !== to) {
      ring.classList.remove('is-hover', 'is-label');
      label.textContent = '';
    }
  });

  document.addEventListener('pointerdown', () => ring.classList.add('is-hover'));
  document.addEventListener('pointerup', () => {
    if (!document.querySelector('.cursor.is-label')) ring.classList.remove('is-hover');
  });
}
