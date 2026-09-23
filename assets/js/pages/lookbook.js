/* ============================================================
   UMBRA — Lookbook
   Editorial grid with per-tile parallax and a keyboard-navigable
   lightbox.
   ============================================================ */

import { qs, qsa, escapeHtml, hasGsap, reduced } from '../core/utils.js';
import { EDITORIAL, img } from '../data/products.js';
import { stopScroll, startScroll, refresh } from '../core/scroll.js';

const SHAPES = ['a', 'b', 'c', 'd', 'wide', 'e', 'f', 'g'];
let index = 0;

export async function init() {
  paint();
  parallaxTiles();
  lightbox();
  refresh();
}

function paint() {
  const grid = qs('[data-look-grid]');
  if (!grid) return;

  grid.innerHTML = EDITORIAL.looks.map((look, i) => `
    <figure class="look look--${SHAPES[i % SHAPES.length]}" data-look="${i}" data-cursor="Open">
      <img src="${img(look.id, 1100, 1400)}" alt="${escapeHtml(look.title)} — ${escapeHtml(look.note)}"
           loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async" data-look-img>
      <figcaption class="look__cap">
        <span>${escapeHtml(look.title)}</span>
        <span>${escapeHtml(look.note)}</span>
      </figcaption>
    </figure>`).join('');
}

function parallaxTiles() {
  if (!hasGsap() || reduced()) return;
  const gsap = window.gsap;

  qsa('[data-look-img]').forEach((image, i) => {
    gsap.fromTo(image,
      { yPercent: -9, scale: 1.14 },
      {
        yPercent: 9, ease: 'none',
        scrollTrigger: {
          trigger: image.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6 + (i % 3) * 0.2
        }
      }
    );
    gsap.fromTo(image.parentElement,
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'expo.inOut',
        scrollTrigger: { trigger: image.parentElement, start: 'top 90%', once: true }
      }
    );
  });
}

function lightbox() {
  const box = qs('.lightbox');
  if (!box) return;

  const image = qs('img', box);
  const caption = qs('[data-lb-caption]', box);
  const counter = qs('[data-lb-count]', box);

  const show = (i) => {
    index = (i + EDITORIAL.looks.length) % EDITORIAL.looks.length;
    const look = EDITORIAL.looks[index];
    image.src = img(look.id, 1600, 2000);
    image.alt = `${look.title} — ${look.note}`;
    if (caption) caption.textContent = `${look.title} — ${look.note}`;
    if (counter) {
      counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(EDITORIAL.looks.length).padStart(2, '0')}`;
    }
  };

  const open = (i) => {
    show(i);
    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    stopScroll();
    qs('.lightbox__close', box)?.focus();
  };

  const close = () => {
    box.classList.remove('is-open');
    box.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    startScroll();
  };

  document.addEventListener('click', (e) => {
    const tile = e.target.closest('[data-look]');
    if (tile) { open(Number(tile.dataset.look)); return; }
    if (e.target.closest('[data-lb-close]')) close();
    if (e.target.closest('[data-lb-prev]')) show(index - 1);
    if (e.target.closest('[data-lb-next]')) show(index + 1);
    if (e.target === box) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
}
