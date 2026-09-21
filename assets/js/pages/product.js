/* ============================================================
   UMBRA — Product detail
   Reads ?id= from the URL and builds the page from the catalogue.
   Gallery with thumbs and pointer-tracked zoom, size selection,
   add-to-bag, spec accordion, related rail, mobile buy bar.
   ============================================================ */

import { qs, qsa, escapeHtml, hasGsap, reduced } from '../core/utils.js';
import { byId, related, img, price, PRODUCTS } from '../data/products.js';
import { add } from '../core/cart.js';
import { renderCards, initAccordions } from '../core/ui.js';
import { initRoll, setRollText } from '../core/roll.js';
import { refresh } from '../core/scroll.js';

let product = null;
let size = null;

export async function init() {
  const id = new URLSearchParams(location.search).get('id');
  product = byId(id) || PRODUCTS[0];

  document.title = `${product.name} — UMBRA`;

  paintHead();
  paintGallery();
  paintInfo();
  paintRelated();

  initAccordions();
  wireBuy();
  wireZoom();
  wireBuyBar();
  refresh();
}

/* ---------------- header / crumbs ---------------- */

function paintHead() {
  const crumb = qs('[data-crumb]');
  if (crumb) crumb.textContent = product.name;

  const cat = qs('[data-crumb-cat]');
  if (cat) {
    cat.textContent = product.category;
    cat.href = `shop.html?category=${product.category}`;
  }
}

/* ---------------- gallery ---------------- */

function paintGallery() {
  const figure = qs('[data-pdp-figure]');
  const thumbs = qs('[data-pdp-thumbs]');
  if (!figure || !thumbs) return;

  figure.innerHTML = `
    <img src="${img(product.photos[0], 1100, 1466)}"
         alt="${escapeHtml(product.name)} — ${escapeHtml(product.sub)}" decoding="async">
    <span class="pdp__zoomtag">Hover to zoom</span>`;

  // core/mobile.js builds a swipe gallery from this, so it never
  // needs to import the catalogue to know what the other shots are.
  figure.dataset.gallery = JSON.stringify(product.photos.map((p) => img(p, 1100, 1466)));

  thumbs.innerHTML = product.photos.map((p, i) => `
    <button class="pdp__thumb ${i === 0 ? 'is-active' : ''}" type="button"
            data-thumb="${i}" aria-label="View image ${i + 1}">
      <img src="${img(p, 260, 346)}" alt="" loading="lazy">
    </button>`).join('');

  thumbs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-thumb]');
    if (!btn) return;
    const i = Number(btn.dataset.thumb);
    qsa('.pdp__thumb', thumbs).forEach((t) => t.classList.toggle('is-active', t === btn));

    const image = qs('img', figure);
    const next = img(product.photos[i], 1100, 1466);

    if (hasGsap() && !reduced()) {
      window.gsap.to(image, {
        autoAlpha: 0, duration: 0.22,
        onComplete: () => {
          image.src = next;
          window.gsap.fromTo(image, { autoAlpha: 0, scale: 1.06 },
            { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'expo.out' });
        }
      });
    } else {
      image.src = next;
    }
  });
}

/* ---------------- info column ---------------- */

function paintInfo() {
  const info = qs('[data-pdp-info]');
  if (!info) return;

  size = product.sizes.find((s) => !product.soldOut.includes(s)) || product.sizes[0];

  info.innerHTML = `
    <p class="label label-row">${escapeHtml(product.tag || `Drop ${product.drop}`)} — ${product.year}</p>

    <h1 class="pdp__title display" data-anim="chars">${escapeHtml(product.name)}</h1>

    <p class="pdp__price">
      ${product.was ? `<del>${price(product.was)}</del>` : ''}
      <span>${price(product.price)}</span>
    </p>

    <p class="body-copy">${escapeHtml(product.blurb)}</p>

    <div class="pdp__row">
      <div class="pdp__row-head">
        <span class="label">Size — <b data-size-out>${escapeHtml(size)}</b></span>
        <button class="pdp__guide" type="button" data-size-guide>Size guide</button>
      </div>
      <div class="pill-row" data-sizes>
        ${product.sizes.map((s) => {
          const out = product.soldOut.includes(s);
          return `<button class="pill ${s === size ? 'is-active' : ''}" type="button"
                    data-size="${escapeHtml(s)}" ${out ? 'disabled aria-disabled="true"' : ''}>
                    ${escapeHtml(s)}
                  </button>`;
        }).join('')}
      </div>
    </div>

    <div class="pdp__buy">
      <button class="btn btn--solid btn--lg" type="button" data-add>
        <span data-roll>Add to bag — ${price(product.price)}</span>
      </button>
      <button class="wish" type="button" aria-label="Save for later" aria-pressed="false" data-wish>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z"
                stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="pdp__assure">
      <span>Free shipping over £250</span>
      <span>30-day returns</span>
      <span>Made in Europe</span>
    </div>

    <div class="acc" data-acc-single>
      ${product.details.map(([k, v], i) => `
        <div class="acc__item ${i === 0 ? 'is-open' : ''}">
          <button class="acc__btn" type="button">
            <span>${escapeHtml(k)}</span><span class="acc__icon" aria-hidden="true"></span>
          </button>
          <div class="acc__panel"><div class="acc__inner">
            <p class="acc__body">${escapeHtml(v)}</p>
          </div></div>
        </div>`).join('')}
      <div class="acc__item">
        <button class="acc__btn" type="button">
          <span>Shipping &amp; returns</span><span class="acc__icon" aria-hidden="true"></span>
        </button>
        <div class="acc__panel"><div class="acc__inner">
          <p class="acc__body">Dispatched within two working days from London. Free on orders over £250,
          otherwise £8 tracked. Returns accepted for 30 days, unworn with tags, at our cost.</p>
        </div></div>
      </div>
    </div>`;

  initRoll(info);
}

/* ---------------- related ---------------- */

function paintRelated() {
  const grid = qs('[data-related]');
  if (!grid) return;
  renderCards(grid, related(product.id, 4));
}

/* ---------------- interactions ---------------- */

function wireBuy() {
  const info = qs('[data-pdp-info]');
  if (!info) return;

  qs('[data-sizes]', info)?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-size]');
    if (!btn || btn.disabled) return;
    size = btn.dataset.size;
    qsa('[data-size]', info).forEach((b) => b.classList.toggle('is-active', b === btn));
    const out = qs('[data-size-out]', info);
    if (out) out.textContent = size;
  });

  const addBtn = qs('[data-add]', info);
  addBtn?.addEventListener('click', () => {
    add(product.id, size, 1, true);
    const label = qs('[data-roll]', addBtn);
    if (label) {
      setRollText(label, 'Added to bag');
      setTimeout(() => setRollText(label, `Add to bag — ${price(product.price)}`), 2200);
    }
  });

  const wish = qs('[data-wish]', info);
  wish?.addEventListener('click', () => {
    const on = wish.classList.toggle('is-on');
    wish.setAttribute('aria-pressed', String(on));
  });

  qs('[data-size-guide]', info)?.addEventListener('click', () => {
    qs('[data-size-guide-section]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* Pointer-tracked zoom on the main plate */
function wireZoom() {
  const figure = qs('[data-pdp-figure]');
  if (!figure || window.matchMedia('(hover: none)').matches) return;

  figure.addEventListener('pointerenter', () => figure.classList.add('is-zoom'));
  figure.addEventListener('pointerleave', () => {
    figure.classList.remove('is-zoom');
    const image = qs('img', figure);
    if (image) image.style.transformOrigin = 'center center';
  });
  figure.addEventListener('pointermove', (e) => {
    const r = figure.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const image = qs('img', figure);
    if (image) image.style.transformOrigin = `${x}% ${y}%`;
  });
}

/* Mobile sticky buy bar appears once the main CTA scrolls away */
function wireBuyBar() {
  const bar = qs('.buybar');
  const anchor = qs('[data-add]');
  if (!bar || !anchor) return;

  qs('[data-buybar-name]', bar).textContent = `${product.name} — ${price(product.price)}`;
  qs('[data-buybar-add]', bar)?.addEventListener('click', () => add(product.id, size, 1, true));

  const io = new IntersectionObserver(([entry]) => {
    bar.classList.toggle('is-on', !entry.isIntersecting && entry.boundingClientRect.top < 0);
  }, { threshold: 0 });
  io.observe(anchor);
}
