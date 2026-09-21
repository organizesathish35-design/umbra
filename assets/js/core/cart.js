/* ============================================================
   UMBRA — Bag
   A tiny persisted store plus the drawer that renders it.
   Nothing here talks to a server: swap `checkout()` for a real
   session call and the rest of the UI is unchanged.
   ============================================================ */

import { qs, qsa, store, escapeHtml, emit, on } from './utils.js';
import { byId, img, price } from '../data/products.js';
import { stopScroll, startScroll } from './scroll.js';
import { initRoll } from './roll.js';

const KEY = 'umbra:bag';
const FREE_SHIPPING = 250;

let items = store.get(KEY, []);

/* ------------------------------------------------------------
   Store
   ------------------------------------------------------------ */

const lineKey = (id, size) => `${id}::${size}`;

export function getItems() { return items; }

export function count() {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function subtotal() {
  return items.reduce((n, i) => {
    const p = byId(i.id);
    return n + (p ? p.price * i.qty : 0);
  }, 0);
}

function persist() {
  store.set(KEY, items);
  emit('bag:change', { items, count: count(), subtotal: subtotal() });
}

/**
 * @param {boolean} [reveal] open the drawer afterwards. True for a
 * deliberate add on the product page; false for grid quick-adds, where
 * the toast and the count bump are confirmation enough and a drawer
 * would block the next add.
 */
export function add(id, size, qty = 1, reveal = false) {
  const product = byId(id);
  if (!product) return false;
  const key = lineKey(id, size);
  const found = items.find((i) => lineKey(i.id, i.size) === key);
  if (found) found.qty = Math.min(found.qty + qty, 9);
  else items.push({ id, size, qty });
  persist();
  emit('bag:add', { product, size, qty, reveal });
  return true;
}

export function setQty(id, size, qty) {
  const key = lineKey(id, size);
  const found = items.find((i) => lineKey(i.id, i.size) === key);
  if (!found) return;
  if (qty <= 0) return remove(id, size);
  found.qty = Math.min(qty, 9);
  persist();
}

export function remove(id, size) {
  const key = lineKey(id, size);
  items = items.filter((i) => lineKey(i.id, i.size) !== key);
  persist();
}

/* ------------------------------------------------------------
   Drawer
   ------------------------------------------------------------ */

export function initCart() {
  const drawer = qs('.drawer');
  const veil = qs('.drawer-veil');
  if (!drawer || !veil) return;

  const body = qs('[data-bag-body]', drawer);
  const foot = qs('[data-bag-foot]', drawer);
  const sub = qs('[data-bag-sub]', drawer);
  const total = qs('[data-bag-total]', drawer);
  const shipMsg = qs('[data-ship-msg]', drawer);
  const shipFill = qs('[data-ship-fill]', drawer);

  let open = false;

  const setOpen = (next) => {
    open = next;
    drawer.classList.toggle('is-open', open);
    veil.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);
    // Styling hook only — the mobile layer uses it to get toasts
    // out from under the drawer's checkout button.
    document.body.classList.toggle('drawer-open', open);
    open ? stopScroll() : startScroll();
    if (open) qs('[data-drawer-close]', drawer)?.focus();
  };

  qsa('[data-bag-open]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    setOpen(true);
  }));
  qsa('[data-drawer-close]').forEach((b) => b.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });

  // Delegated line-item controls
  body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-line-action]');
    if (!btn) return;
    const { id, size } = btn.dataset;
    const line = items.find((i) => i.id === id && i.size === size);
    if (!line) return;

    if (btn.dataset.lineAction === 'inc') setQty(id, size, line.qty + 1);
    if (btn.dataset.lineAction === 'dec') setQty(id, size, line.qty - 1);
    if (btn.dataset.lineAction === 'remove') remove(id, size);
  });

  qs('[data-checkout]', drawer)?.addEventListener('click', (e) => {
    e.preventDefault();
    checkout();
  });

  function render() {
    const n = count();
    const value = subtotal();

    if (!items.length) {
      body.innerHTML = `
        <div class="drawer__empty">
          <p>Your bag is empty</p>
          <a class="btn btn--sm" href="shop.html"><span data-roll>Browse the collection</span></a>
        </div>`;
      foot.hidden = true;
      sub.textContent = 'Nothing chosen yet';
      initRoll(body);
      return;
    }

    body.innerHTML = items.map((i) => {
      const p = byId(i.id);
      if (!p) return '';
      return `
        <article class="line-item">
          <img src="${img(p.photos[0], 200, 266)}" alt="${escapeHtml(p.name)}" loading="lazy">
          <div>
            <h4 class="line-item__name">${escapeHtml(p.name)}</h4>
            <p class="line-item__meta">${escapeHtml(p.sub)} — Size ${escapeHtml(i.size)}</p>
            <div class="line-item__foot">
              <div class="qty">
                <button type="button" data-line-action="dec" data-id="${p.id}" data-size="${escapeHtml(i.size)}"
                        aria-label="Decrease quantity">−</button>
                <span>${i.qty}</span>
                <button type="button" data-line-action="inc" data-id="${p.id}" data-size="${escapeHtml(i.size)}"
                        aria-label="Increase quantity">+</button>
              </div>
              <span class="line-item__price">${price(p.price * i.qty)}</span>
            </div>
            <button class="line-item__remove" type="button" data-line-action="remove"
                    data-id="${p.id}" data-size="${escapeHtml(i.size)}">Remove</button>
          </div>
        </article>`;
    }).join('');

    foot.hidden = false;
    sub.textContent = `${n} ${n === 1 ? 'piece' : 'pieces'}`;
    total.textContent = price(value);

    const remaining = Math.max(0, FREE_SHIPPING - value);
    shipMsg.textContent = remaining > 0
      ? `${price(remaining)} away from free shipping`
      : 'Free shipping unlocked';
    shipFill.style.transform = `scaleX(${Math.min(1, value / FREE_SHIPPING)})`;

    initRoll(body);
  }

  on('bag:change', render);
  on('bag:add', ({ reveal }) => { if (reveal && !open) setOpen(true); });
  render();
  syncCounts();
  on('bag:change', syncCounts);
}

/* ------------------------------------------------------------
   Header count + toast
   ------------------------------------------------------------ */

function syncCounts() {
  const n = count();
  qsa('[data-bag-count]').forEach((el) => {
    el.textContent = String(n).padStart(2, '0');
    const wrap = el.closest('.bag-count') || el;
    wrap.classList.remove('is-bumping');
    void wrap.offsetWidth; // restart the animation
    if (n > 0) wrap.classList.add('is-bumping');
  });
}

export function initToasts() {
  const stack = qs('[data-toasts]');
  if (!stack) return;

  on('bag:add', ({ product, size }) => {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `
      <img src="${img(product.photos[0], 120, 160)}" alt="" aria-hidden="true">
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <span>Size ${escapeHtml(size)} — added</span>
      </div>`;
    stack.appendChild(el);

    const gsap = window.gsap;
    if (gsap) {
      gsap.fromTo(el, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'expo.out' });
      gsap.to(el, { autoAlpha: 0, x: 40, duration: 0.4, delay: 2.6, onComplete: () => el.remove() });
    } else {
      setTimeout(() => el.remove(), 3000);
    }
  });
}

/* ------------------------------------------------------------
   Checkout stub
   ------------------------------------------------------------ */

function checkout() {
  const stack = qs('[data-toasts]');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div><strong>Demo store</strong><span>Checkout is not connected</span></div>`;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}
