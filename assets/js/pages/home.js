/* ============================================================
   UMBRA — Home
   Hero overture, pinned horizontal rail, sticky craft chapters,
   velocity-reactive marquees.
   ============================================================ */

import { qs, qsa, hasGsap, reduced, on, mq, escapeHtml } from '../core/utils.js';
import { PRODUCTS, REVIEWS, img } from '../data/products.js';
import { renderCards } from '../core/ui.js';
import { split } from '../core/split.js';
import { getVelocity } from '../core/scroll.js';

export async function init() {
  renderRail();
  renderFeatured();
  renderReviews();

  heroOverture();
  horizontalRail();
  craftChapters();
  slabGhosts();
  marqueeVelocity();
}

/* ------------------------------------------------------------
   Content
   ------------------------------------------------------------ */

function renderRail() {
  const track = qs('[data-rail-cards]');
  if (!track) return;
  const picks = PRODUCTS.slice(0, 6);

  track.innerHTML = picks.map((p, i) => `
    <div class="rail__card">
      <p class="rail__index">${String(i + 1).padStart(2, '0')} / ${String(picks.length).padStart(2, '0')}</p>
      <article class="card" data-product="${p.id}">
        <div class="card__media">
          <img class="card__img card__img--main" src="${img(p.photos[0], 700, 980)}"
               alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">
          <img class="card__img card__img--alt" src="${img(p.photos[1] || p.photos[0], 700, 980)}"
               alt="" aria-hidden="true" loading="lazy">
          <a class="card__link" href="product.html?id=${p.id}" data-cursor="View"
             aria-label="View ${escapeHtml(p.name)}"></a>
        </div>
        <div class="card__head">
          <h3 class="card__name">${escapeHtml(p.name)}</h3>
          <p class="card__price">£${p.price}</p>
        </div>
        <div class="card__meta"><span>${escapeHtml(p.sub)}</span><span>Drop ${escapeHtml(p.drop)}</span></div>
      </article>
    </div>`).join('');
}

function renderFeatured() {
  const grid = qs('[data-featured]');
  if (!grid) return;
  renderCards(grid, PRODUCTS.slice(6, 10));
}

function renderReviews() {
  qsa('[data-reviews]').forEach((track, row) => {
    const list = row === 0 ? REVIEWS : [...REVIEWS].reverse();
    track.innerHTML = list.map((r) => `
      <div class="marquee__item">
        <div class="review">
          <span class="review__stars" aria-label="${r.stars} out of 5">${'★'.repeat(r.stars)}</span>
          <span class="review__text">${escapeHtml(r.text)}</span>
          <span class="review__who">${escapeHtml(r.who)}</span>
        </div>
      </div>`).join('');
  });
}

/* ------------------------------------------------------------
   Hero overture — held until the preloader clears
   ------------------------------------------------------------ */

function heroOverture() {
  const hero = qs('.hero');
  if (!hero) return;

  const lines = qsa('.hero__line', hero);
  const stage = qs('.hero__stage', hero);
  const stageImg = qs('.hero__stage img', hero);
  const notes = qsa('.hero__note', hero);
  const foot = qs('.hero__foot', hero);
  const header = qs('.header');

  if (reduced() || !hasGsap()) {
    [...lines, stage, foot, ...notes].forEach((el) => el && (el.style.visibility = 'visible'));
    return;
  }

  const gsap = window.gsap;

  // Pre-split so nothing flashes unsplit
  const groups = lines.map((l) => {
    const chars = split(l, 'chars');
    l.style.visibility = 'visible';
    gsap.set(chars, { yPercent: 115 });
    return chars;
  });

  gsap.set(stage, { clipPath: 'inset(100% 0% 0% 0%)', visibility: 'visible' });
  gsap.set(stageImg, { scale: 1.4 });
  gsap.set([foot, ...notes], { autoAlpha: 0, y: 26, visibility: 'visible' });
  if (header) gsap.set(header, { autoAlpha: 0, y: -20 });

  const play = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.to(stage, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
      .to(stageImg, { scale: 1, duration: 2.1 }, 0)
      .to(header, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.25);

    groups.forEach((chars, i) => {
      tl.to(chars, { yPercent: 0, duration: 1.1, stagger: 0.022 }, 0.35 + i * 0.09);
    });

    tl.to([foot, ...notes], { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.95);

    // Scroll-linked afterlife: type drifts up, picture lags behind
    gsap.to(lines, {
      yPercent: -38, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
    gsap.to(stageImg, {
      yPercent: 16, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
  };

  on('intro', play);
}

/* ------------------------------------------------------------
   Pinned horizontal rail
   The section pins and the track slides left by exactly its
   overflow width, so the last card lands flush with the gutter.
   ------------------------------------------------------------ */

function horizontalRail() {
  const rail = qs('.rail');
  const track = qs('.rail__track', rail || document);
  if (!rail || !track || !hasGsap() || reduced()) return;
  if (!mq('(min-width: 861px)')) return;

  const gsap = window.gsap;
  const bar = qs('.rail__bar i', rail);

  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: rail,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      // Measure the pin before anything downstream of it
      refreshPriority: 1,
      onUpdate: (self) => {
        if (bar) bar.style.transform = `scaleX(${self.progress})`;
      }
    }
  });

  // Cards lean in slightly as they cross the centre of the screen
  qsa('.rail__card', track).forEach((card) => {
    gsap.fromTo(card,
      { yPercent: 6, autoAlpha: 0.55 },
      {
        yPercent: 0, autoAlpha: 1, ease: 'none',
        scrollTrigger: {
          trigger: card,
          containerAnimation: tween,
          start: 'left 92%',
          end: 'left 55%',
          scrub: true
        }
      }
    );
  });
}

/* ------------------------------------------------------------
   Craft — chapter in view swaps the sticky plate
   ------------------------------------------------------------ */

function craftChapters() {
  const section = qs('.craft');
  if (!section) return;

  const chapters = qsa('.craft__chapter', section);
  const plates = qsa('.craft__sticky img', section);
  if (!chapters.length || !plates.length) return;

  const activate = (i) => {
    chapters.forEach((c, n) => c.classList.toggle('is-active', n === i));
    plates.forEach((p, n) => p.classList.toggle('is-active', n === i));
  };

  activate(0);

  if (hasGsap() && !reduced()) {
    chapters.forEach((chapter, i) => {
      window.ScrollTrigger.create({
        trigger: chapter,
        start: 'top 62%',
        end: 'bottom 62%',
        onToggle: (self) => { if (self.isActive) activate(i); }
      });
    });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) activate(chapters.indexOf(e.target));
    });
  }, { rootMargin: '-40% 0px -40% 0px' });
  chapters.forEach((c) => io.observe(c));
}

/* ------------------------------------------------------------
   Slab — outline words drift against the scroll
   ------------------------------------------------------------ */

function slabGhosts() {
  const slab = qs('.slab');
  if (!slab || !hasGsap() || reduced()) return;
  const gsap = window.gsap;

  const top = qs('.slab__ghost--top', slab);
  const bottom = qs('.slab__ghost--bottom', slab);
  const common = {
    ease: 'none',
    scrollTrigger: { trigger: slab, start: 'top bottom', end: 'bottom top', scrub: 0.7 }
  };

  if (top) gsap.fromTo(top, { xPercent: -8 }, { xPercent: -30, ...common });
  if (bottom) gsap.fromTo(bottom, { xPercent: -30 }, { xPercent: -6, ...common });
}

/* ------------------------------------------------------------
   Marquees react to scroll speed — faster when you move, and
   they briefly reverse when you scroll back up.
   ------------------------------------------------------------ */

function marqueeVelocity() {
  const tracks = qsa('.marquee[data-velocity] .marquee__track');
  if (!tracks.length || reduced()) return;

  let current = 1;
  const tick = () => {
    const v = getVelocity();
    const target = 1 + Math.min(Math.abs(v) * 0.05, 3.2);
    current += (target - current) * 0.08;
    const dir = v < -0.4 ? 'reverse' : 'normal';
    tracks.forEach((t) => {
      t.style.animationDuration = `${38 / current}s`;
      t.style.animationDirection = t.closest('.marquee--reverse')
        ? (dir === 'reverse' ? 'normal' : 'reverse')
        : dir;
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
