/* ============================================================
   UMBRA — Shared UI pieces
   Product card template, accordions, quick-add wiring, forms.
   ============================================================ */

import { qs, qsa, once, escapeHtml } from './utils.js';
import { img, price } from '../data/products.js';
import { add } from './cart.js';
import { initRoll } from './roll.js';

/* ------------------------------------------------------------
   Product card
   ------------------------------------------------------------ */

export function cardHTML(p, opts = {}) {
  const { index = null, eager = false, className = '' } = opts;
  const alt = p.photos[1] || p.photos[0];
  const firstSize = p.sizes.find((s) => !p.soldOut.includes(s)) || p.sizes[0];

  return `
  <article class="card ${className}" data-product="${p.id}" data-anim="fade">
    <div class="card__media reveal-img">
      ${p.tag ? `<span class="card__tag">${escapeHtml(p.tag)}</span>` : ''}
      <img class="card__img card__img--main" src="${img(p.photos[0], 700, 933)}"
           alt="${escapeHtml(p.name)} — ${escapeHtml(p.sub)}"
           loading="${eager ? 'eager' : 'lazy'}" decoding="async">
      <img class="card__img card__img--alt" src="${img(alt, 700, 933)}" alt="" aria-hidden="true" loading="lazy">
      <a class="card__link" href="product.html?id=${p.id}" data-cursor="View"
         aria-label="View ${escapeHtml(p.name)}"></a>
      <div class="card__quick">
        <button class="card__quick-btn" type="button"
                data-quick-add="${p.id}" data-size="${escapeHtml(firstSize)}"
                aria-label="Add ${escapeHtml(p.name)}, size ${escapeHtml(firstSize)}, to bag">
          <span data-roll>Add — ${escapeHtml(firstSize)}</span>
        </button>
      </div>
    </div>

    <div class="card__head">
      <h3 class="card__name">${escapeHtml(p.name)}</h3>
      <p class="card__price">
        ${p.was ? `<s style="opacity:.45">${price(p.was)}</s> ` : ''}${price(p.price)}
      </p>
    </div>

    <div class="card__meta">
      <span>${index !== null ? String(index).padStart(2, '0') + ' — ' : ''}${escapeHtml(p.sub)}</span>
      <span class="swatches" aria-label="Available colours">
        ${p.swatches.map((c) => `<i class="swatch" style="background:${c}"></i>`).join('')}
      </span>
    </div>
  </article>`;
}

export function renderCards(target, products, opts = {}) {
  const el = typeof target === 'string' ? qs(target) : target;
  if (!el) return;
  el.innerHTML = products.map((p, i) => cardHTML(p, { ...opts, index: i + 1 })).join('');
  initRoll(el);
}

/* ------------------------------------------------------------
   Quick add — delegated so it survives re-renders
   ------------------------------------------------------------ */

export function initQuickAdd() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-quick-add]');
    if (!btn) return;
    e.preventDefault();
    add(btn.dataset.quickAdd, btn.dataset.size, 1);
  });
}

/* ------------------------------------------------------------
   Accordions
   ------------------------------------------------------------ */

export function initAccordions(root = document) {
  qsa('.acc', root).forEach((acc) => {
    if (!once(acc, 'Acc')) return;

    qsa('.acc__btn', acc).forEach((btn) => {
      const item = btn.closest('.acc__item');
      const panel = qs('.acc__panel', item);
      const id = panel.id || `acc-${Math.random().toString(36).slice(2, 8)}`;
      panel.id = id;
      btn.setAttribute('aria-controls', id);
      btn.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');

      btn.addEventListener('click', () => {
        const open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));

        if (acc.dataset.accSingle !== undefined && open) {
          qsa('.acc__item', acc).forEach((other) => {
            if (other === item) return;
            other.classList.remove('is-open');
            qs('.acc__btn', other)?.setAttribute('aria-expanded', 'false');
          });
        }
        window.ScrollTrigger?.refresh();
      });
    });
  });
}

/* ------------------------------------------------------------
   Forms — client-side only; no data leaves the browser
   ------------------------------------------------------------ */

export function initForms(root = document) {
  qsa('form[data-demo-form]', root).forEach((form) => {
    if (!once(form, 'Form')) return;
    const status = qs('[data-form-status]', form) || qs(form.dataset.demoForm || '');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const name = (qs('[name="name"]', form)?.value || '').trim().split(' ')[0];
      if (status) {
        status.textContent = name
          ? `Thank you, ${name}. This demo does not send mail.`
          : 'Received. This demo does not send mail.';
      }
      form.reset();
    });
  });

  // Footer signup
  qsa('[data-signup]', root).forEach((form) => {
    if (!once(form, 'Signup')) return;
    const msg = qs('.signup__msg', form.parentElement) || qs('[data-signup-msg]', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = qs('input', form);
      if (!input?.value.includes('@')) {
        if (msg) msg.textContent = 'Enter a valid address';
        return;
      }
      if (msg) msg.textContent = 'On the list. Demo only — nothing was sent.';
      form.reset();
    });
  });
}

/* ------------------------------------------------------------
   Marquee — duplicate the track so the loop is seamless
   ------------------------------------------------------------ */

export function initMarquees(root = document) {
  qsa('.marquee', root).forEach((m) => {
    if (!once(m, 'Marquee')) return;
    const track = qs('.marquee__track', m);
    if (!track) return;
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    m.appendChild(clone);
  });
}
