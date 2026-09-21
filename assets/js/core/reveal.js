/* ============================================================
   UMBRA — Declarative scroll animation layer

   Everything is opt-in from markup:
     data-anim="lines|chars|words|fade|img|stagger"
     data-delay="0.15"            seconds
     data-start="top 85%"         ScrollTrigger start
     data-parallax="-0.18"        y factor of scroll distance
     data-count="680" data-suffix="+"
     data-magnetic                cursor-following hover
     data-skew                    velocity skew on images
   ============================================================ */

import { qsa, hasGsap, reduced, once, clamp } from './utils.js';
import { split, watchResize } from './split.js';
import { getVelocity } from './scroll.js';

export function initReveal(root = document) {
  if (reduced()) { showAll(root); return; }
  if (!hasGsap()) { fallback(root); return; }

  textReveals(root);
  fadeReveals(root);
  imageReveals(root);
  staggerReveals(root);
  parallax(root);
  counters(root);
  magnetic(root);
  velocitySkew(root);
  rules(root);
}

/* ------------------------------------------------------------
   Headlines — per-line / per-char masked rise
   ------------------------------------------------------------ */
function textReveals(root) {
  const nodes = qsa('[data-anim="lines"], [data-anim="chars"], [data-anim="words"]', root);
  const gsap = window.gsap;

  const build = () => {
    nodes.forEach((el) => {
      const mode = el.dataset.anim;
      const parts = split(el, mode);
      if (!parts.length) return;

      gsap.killTweensOf(parts);
      el.style.visibility = 'visible';
      gsap.set(parts, { yPercent: 118 });

      const stagger = mode === 'chars' ? 0.018 : mode === 'words' ? 0.045 : 0.09;

      gsap.to(parts, {
        yPercent: 0,
        duration: mode === 'chars' ? 0.85 : 1.05,
        ease: 'expo.out',
        stagger,
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: {
          trigger: el,
          start: el.dataset.start || 'top 88%',
          once: true
        }
      });
    });
  };

  build();
  // Re-flow line masks on width change
  watchResize(nodes, () => {
    window.ScrollTrigger?.getAll().forEach((t) => {
      if (nodes.includes(t.trigger)) t.kill();
    });
    build();
    window.ScrollTrigger?.refresh();
  });
}

/* ------------------------------------------------------------
   Simple blocks
   ------------------------------------------------------------ */
function fadeReveals(root) {
  const gsap = window.gsap;
  qsa('[data-anim="fade"]', root).forEach((el) => {
    if (!once(el, 'Fade')) return;
    el.style.visibility = 'visible';
    gsap.fromTo(el,
      { autoAlpha: 0, y: 34 },
      {
        autoAlpha: 1, y: 0,
        duration: 1.1, ease: 'expo.out',
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: el.dataset.start || 'top 90%', once: true }
      }
    );
  });
}

/* ------------------------------------------------------------
   Images — clip open from the bottom while the picture
   settles back from a slight over-scale
   ------------------------------------------------------------ */
function imageReveals(root) {
  const gsap = window.gsap;
  qsa('[data-anim="img"]', root).forEach((el) => {
    if (!once(el, 'Img')) return;
    const media = el.querySelector('img') || el;
    el.style.visibility = 'visible';

    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: el.dataset.start || 'top 88%', once: true },
      delay: parseFloat(el.dataset.delay || 0)
    });

    tl.fromTo(el,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'expo.inOut' }
    ).fromTo(media,
      { scale: 1.24 },
      { scale: 1, duration: 1.6, ease: 'expo.out' },
      0
    );
  });
}

/* ------------------------------------------------------------
   Children stagger (grids, lists, stat strips)
   ------------------------------------------------------------ */
function staggerReveals(root) {
  const gsap = window.gsap;
  qsa('[data-anim="stagger"]', root).forEach((el) => {
    if (!once(el, 'Stagger')) return;
    const kids = el.children.length ? Array.from(el.children) : [el];
    el.style.visibility = 'visible';
    gsap.fromTo(kids,
      { autoAlpha: 0, y: 42 },
      {
        autoAlpha: 1, y: 0,
        duration: 1, ease: 'expo.out',
        stagger: parseFloat(el.dataset.stagger || 0.08),
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: el.dataset.start || 'top 88%', once: true }
      }
    );
  });
}

/* ------------------------------------------------------------
   Parallax — y offset scrubbed against scroll
   ------------------------------------------------------------ */
function parallax(root) {
  const gsap = window.gsap;
  qsa('[data-parallax]', root).forEach((el) => {
    if (!once(el, 'Parallax')) return;
    const factor = parseFloat(el.dataset.parallax) || 0.15;
    gsap.fromTo(el,
      { yPercent: -factor * 50 },
      {
        yPercent: factor * 50,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('[data-parallax-scope]') || el.parentElement || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  });
}

/* ------------------------------------------------------------
   Odometer counters
   ------------------------------------------------------------ */
function counters(root) {
  const gsap = window.gsap;
  qsa('[data-count]', root).forEach((el) => {
    if (!once(el, 'Count')) return;
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const obj = { v: 0 };
    el.textContent = (0).toFixed(decimals);

    gsap.to(obj, {
      v: target,
      duration: 2.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate() {
        el.textContent = obj.v.toLocaleString('en-GB', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      }
    });
  });
}

/* ------------------------------------------------------------
   Magnetic hover — element eases toward the pointer
   ------------------------------------------------------------ */
function magnetic(root) {
  if (window.matchMedia('(hover: none)').matches) return;
  const gsap = window.gsap;

  qsa('[data-magnetic]', root).forEach((el) => {
    if (!once(el, 'Magnet')) return;
    const strength = parseFloat(el.dataset.magnetic) || 0.35;

    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      gsap.to(el, { x, y, duration: 0.7, ease: 'power3.out' });
    };
    const reset = () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
  });
}

/* ------------------------------------------------------------
   Velocity skew — images lean into fast scrolling
   ------------------------------------------------------------ */
function velocitySkew(root) {
  const nodes = qsa('[data-skew]', root);
  if (!nodes.length) return;
  const gsap = window.gsap;
  let current = 0;

  const tick = () => {
    const target = clamp(getVelocity() * 0.28, -9, 9);
    current += (target - current) * 0.12;
    if (Math.abs(current) > 0.01) {
      gsap.set(nodes, { skewY: current, force3D: true });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ------------------------------------------------------------
   Hairlines draw themselves in
   ------------------------------------------------------------ */
function rules(root) {
  const gsap = window.gsap;
  qsa('.rule[data-anim-rule]', root).forEach((el) => {
    if (!once(el, 'Rule')) return;
    gsap.fromTo(el,
      { scaleX: 0 },
      {
        scaleX: 1, duration: 1.4, ease: 'expo.inOut',
        scrollTrigger: { trigger: el, start: 'top 95%', once: true }
      }
    );
  });
}

/* ------------------------------------------------------------
   Fallbacks
   ------------------------------------------------------------ */
function showAll(root) {
  qsa('[data-anim]', root).forEach((el) => { el.style.visibility = 'visible'; });
}

function fallback(root) {
  // No GSAP (offline CDN): reveal with IntersectionObserver + CSS transition.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.style.visibility = 'visible';
      e.target.style.transition = 'opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1)';
      e.target.style.opacity = '1';
      e.target.style.transform = 'none';
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  qsa('[data-anim]', root).forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(26px)';
    el.style.visibility = 'visible';
    io.observe(el);
  });

  qsa('[data-count]', root).forEach((el) => { el.textContent = el.dataset.count; });
}
