/* ============================================================
   UMBRA — Shared chrome
   The menu overlay, cart drawer, curtain, progress bar, toast
   stack and back-to-top button are identical on every page, so
   they are injected once here instead of being copy-pasted into
   seven HTML files. Header and footer stay in the markup — they
   carry real links and should exist without JavaScript.
   ============================================================ */

import { qs } from './utils.js';
import { img, EDITORIAL } from '../data/products.js';

const NAV = [
  { href: 'shop.html',     label: 'Shop',     index: '01', preview: EDITORIAL.looks[0].id },
  { href: 'lookbook.html', label: 'Lookbook', index: '02', preview: EDITORIAL.looks[1].id },
  { href: 'about.html',    label: 'Studio',   index: '03', preview: EDITORIAL.looks[4].id },
  { href: 'contact.html',  label: 'Contact',  index: '04', preview: EDITORIAL.looks[2].id }
];

export function mountChrome() {
  if (qs('.menu')) return;

  const frag = document.createElement('div');
  frag.innerHTML = `
    <div class="curtain" aria-hidden="true"><span class="curtain__label"></span></div>
    <div class="progress" aria-hidden="true"></div>

    <nav class="menu" id="menu" aria-label="Main" aria-hidden="true">
      <div class="menu__links">
        ${NAV.map((n) => `
          <a class="menu__link" href="${n.href}" data-preview="${n.preview}">
            <span>${n.label}<i>${n.index}</i></span>
          </a>`).join('')}
      </div>
      <div class="menu__preview" aria-hidden="true">
        ${NAV.map((n, i) => `
          <img src="${img(n.preview, 800, 1000)}" alt="" loading="lazy"
               class="${i === 0 ? 'is-active' : ''}" data-preview-for="${n.preview}">`).join('')}
      </div>
      <div class="menu__foot">
        <a href="mailto:studio@umbra.supply">studio@umbra.supply</a>
        <span>London — 51.5074° N</span>
        <span>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a> /
          <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer">Pinterest</a>
        </span>
      </div>
    </nav>

    <div class="drawer-veil" data-drawer-close></div>
    <aside class="drawer" id="drawer" aria-label="Shopping bag" aria-hidden="true">
      <div class="drawer__head">
        <div>
          <p class="drawer__title">Bag</p>
          <p class="drawer__sub" data-bag-sub>Nothing chosen yet</p>
        </div>
        <button class="icon-btn" type="button" data-drawer-close aria-label="Close bag">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </div>
      <div class="drawer__body" data-bag-body></div>
      <div class="drawer__foot" data-bag-foot hidden>
        <div class="meter">
          <div class="drawer__totals" style="font-size:var(--t-xs)">
            <span data-ship-msg></span>
          </div>
          <div class="meter__track"><i class="meter__fill" data-ship-fill></i></div>
        </div>
        <div class="drawer__totals">
          <span>Subtotal</span>
          <strong data-bag-total>£0</strong>
        </div>
        <a class="btn btn--solid btn--block" href="#" data-checkout>
          <span data-roll>Checkout</span>
        </a>
        <p class="drawer__note">Shipping and taxes calculated at checkout</p>
      </div>
    </aside>

    <div class="toast-stack" data-toasts aria-live="polite"></div>

    <button class="to-top" type="button" aria-label="Back to top">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;

  while (frag.firstElementChild) document.body.appendChild(frag.firstElementChild);
}
