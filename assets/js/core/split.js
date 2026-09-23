/* ============================================================
   UMBRA — Text splitting
   Wraps characters, words or lines in overflow-clipped masks so
   they can be driven from y:110% to 0 — the reveal used across
   every headline on the site.

   Original markup is stashed on the node so a resize can re-split
   lines without losing the source text, and aria-label keeps the
   whole string readable to assistive tech.
   ============================================================ */

import { qsa, debounce } from './utils.js';

const STASH = new WeakMap();

/**
 * @param {HTMLElement} el
 * @param {'chars'|'words'|'lines'} mode
 * @returns {HTMLElement[]} the animatable inner spans
 */
export function split(el, mode = 'lines') {
  if (!STASH.has(el)) STASH.set(el, el.innerHTML);
  const source = STASH.get(el);

  const plain = el.textContent.trim().replace(/\s+/g, ' ');
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', plain);

  el.innerHTML = source;

  if (mode === 'chars') return splitChars(el);
  if (mode === 'words') return splitWords(el);
  return splitLines(el);
}

/* ------------------------------------------------------------
   Characters — each glyph in its own mask, words kept unbroken
   ------------------------------------------------------------ */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  const out = [];

  text.split(/(\s+)/).forEach((chunk) => {
    if (!chunk) return;
    if (/^\s+$/.test(chunk)) {
      el.appendChild(document.createTextNode(' '));
      return;
    }
    const word = document.createElement('span');
    word.className = 'split-word';
    word.setAttribute('aria-hidden', 'true');

    [...chunk].forEach((ch) => {
      const c = document.createElement('span');
      c.className = 'split-char';
      c.textContent = ch;
      word.appendChild(c);
      out.push(c);
    });

    el.appendChild(word);
  });

  markHidden(el);
  return out;
}

/* ------------------------------------------------------------
   Words — one mask per word
   ------------------------------------------------------------ */
function splitWords(el) {
  const text = el.textContent;
  el.textContent = '';
  const out = [];

  text.split(/\s+/).filter(Boolean).forEach((w, i, arr) => {
    const mask = document.createElement('span');
    mask.className = 'split-word';
    mask.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'split-char';
    inner.textContent = w;
    mask.appendChild(inner);
    el.appendChild(mask);
    if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    out.push(inner);
  });

  markHidden(el);
  return out;
}

/* ------------------------------------------------------------
   Lines — measure word tops, then group into per-line masks.
   Inline markup (<em>, <span class="dim">) is preserved by
   wrapping word-level spans rather than flattening to text.
   ------------------------------------------------------------ */
function splitLines(el) {
  wrapWordsPreservingMarkup(el);

  const words = qsa('[data-w]', el);
  if (!words.length) return [];

  // Group by vertical offset
  const lines = [];
  let currentTop = null;
  words.forEach((w) => {
    const top = Math.round(w.offsetTop);
    if (currentTop === null || Math.abs(top - currentTop) > 4) {
      currentTop = top;
      lines.push([]);
    }
    lines[lines.length - 1].push(w);
  });

  // Rebuild: one .split-line mask per group
  const frag = document.createDocumentFragment();
  const out = [];

  lines.forEach((group) => {
    const mask = document.createElement('span');
    mask.className = 'split-line';
    mask.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');

    group.forEach((w, i) => {
      // move the original node (keeps <em> etc.)
      inner.appendChild(w);
      if (i < group.length - 1) inner.appendChild(document.createTextNode(' '));
    });

    mask.appendChild(inner);
    frag.appendChild(mask);
    out.push(inner);
  });

  el.innerHTML = '';
  el.appendChild(frag);
  markHidden(el);
  return out;
}

function wrapWordsPreservingMarkup(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);

  texts.forEach((node) => {
    const parts = node.nodeValue.split(/(\s+)/).filter((s) => s !== '');
    if (!parts.length) return;

    // Ancestors between this text and the host, innermost first.
    // Each word carries its own copy of them, so a word can later be
    // lifted into a line mask without losing its <em>/<span class>.
    const chain = [];
    for (let p = node.parentNode; p && p !== el; p = p.parentNode) chain.push(p);

    const frag = document.createDocumentFragment();

    parts.forEach((part) => {
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(' '));
        return;
      }
      let content = document.createTextNode(part);
      chain.forEach((ancestor) => {
        const shell = ancestor.cloneNode(false); // tag + attributes, no children
        shell.appendChild(content);
        content = shell;
      });

      const s = document.createElement('span');
      s.setAttribute('data-w', '');
      s.style.display = 'inline-block';
      s.appendChild(content);
      frag.appendChild(s);
    });

    node.parentNode.replaceChild(frag, node);
  });
}

function markHidden(el) {
  Array.from(el.children).forEach((c) => c.setAttribute('aria-hidden', 'true'));
}

/**
 * Wrap every word in a bare inline-block span and hand them back.
 *
 * Unlike split(el, 'words') there are no overflow masks: these are for
 * effects that animate the glyphs themselves — colour, opacity, scale —
 * rather than sliding them out from behind an edge. Inline markup is
 * preserved, so an <em> inside the sentence keeps its styling.
 */
export function words(el) {
  if (!STASH.has(el)) STASH.set(el, el.innerHTML);
  el.innerHTML = STASH.get(el);

  const plain = el.textContent.trim().replace(/\s+/g, ' ');
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', plain);

  wrapWordsPreservingMarkup(el);
  return qsa('[data-w]', el);
}

/** Re-split line-based nodes when the box width changes. */
export function watchResize(nodes, rebuild) {
  const run = debounce(() => {
    let w = window.innerWidth;
    if (w === watchResize._w) return;
    watchResize._w = w;
    rebuild();
  }, 220);
  watchResize._w = window.innerWidth;
  window.addEventListener('resize', run);
  return () => window.removeEventListener('resize', run);
}
