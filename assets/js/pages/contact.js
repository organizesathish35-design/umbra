/* ============================================================
   UMBRA — Contact
   The form itself is handled by core/ui.js (initForms). This
   module only adds the local clock and the field focus glide.
   ============================================================ */

import { qs, qsa, hasGsap, reduced } from '../core/utils.js';
import { refresh } from '../core/scroll.js';

export async function init() {
  clock();
  fieldFocus();
  refresh();
}

function clock() {
  const el = qs('[data-clock]');
  if (!el) return;

  const tick = () => {
    const now = new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    el.textContent = `${now} GMT`;
  };
  tick();
  setInterval(tick, 1000);
}

function fieldFocus() {
  if (!hasGsap() || reduced()) return;
  const gsap = window.gsap;

  qsa('.field').forEach((field) => {
    const input = qs('.field__input', field);
    if (!input) return;
    input.addEventListener('focus', () => gsap.to(field, { x: 6, duration: 0.5, ease: 'expo.out' }));
    input.addEventListener('blur', () => gsap.to(field, { x: 0, duration: 0.6, ease: 'expo.out' }));
  });
}
