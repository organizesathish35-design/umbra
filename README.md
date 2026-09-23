# UMBRA — monochrome e-commerce

A full multi-page storefront for a fictional premium clothing label: fourteen
pieces, black and white only. Built as static HTML with ES modules — no build
step, no framework, no `node_modules`.

The motion vocabulary is modelled on [palmo.co.in](https://www.palmo.co.in):
masked per-letter headline reveals, a pinned scroll-driven rail, animated
counters, a light→dark scallop seam with a nav that inverts over it, two-speed
testimonial marquees, corner-dot CTA cards, and an interactive canvas easter egg
in the footer. Translated to a monochrome fashion house rather than a drinks brand.

---

## Run it

ES modules can't load over `file://` — the browser blocks them as cross-origin —
so opening `index.html` straight off the disk gives you a page whose scripts
never run. Serve it over http instead:

```bash
python serve.py
```

Then open <http://localhost:5178>. Any static server works equally well
(`npx serve`, `php -S`, Live Server); `serve.py` just adds no-cache headers,
binds dual-stack so `localhost` does not stall on a refused `::1`, holds the
connection open across the module graph, and routes unknown paths to the styled
404 page.

If the modules never arrive — off the disk, a blocked CDN, a dropped connection
— `assets/js/boot-guard.js` hands the page back to its no-JS styling instead of
leaving the entry panel sitting over it. A readable static page and a console
note, rather than a black screen with no way past it.

---

## Recordings

`recordings/` holds a walkthrough of each breakpoint, captured from a real
headless Chrome over the DevTools Protocol — the actual GSAP/Lenis animation,
not a slideshow of stills. Scrolling is driven with real wheel events so the
recorded easing is Lenis's own.

| File | Size | Length |
| --- | --- | --- |
| `umbra-desktop-1440x900.mp4` | 1440 × 900 | 2:12 |
| `umbra-mobile-390x844.mp4` | 390 × 844 @2x (780 × 1688) | 2:11 |

Both cover home → shop → product → lookbook, including the preloader, the
pinned/swipe rail, the dark slab seam, filtering, add-to-bag and the drawer.

Re-record after changes with the dev server running:

```bash
node tools/record.js desktop .
```

Then encode the frames it writes:

```bash
ffmpeg -f concat -safe 0 -i frames-desktop/list.txt -vf "fps=30,format=yuv420p" -c:v libx264 -crf 24 out.mp4
```

`tools/record.js` has no dependencies — it uses Node's built-in `WebSocket` and
Chrome's own debugging port. Edit the `PROFILES` object to change the journey.

---

## Structure

```
umbra/
├── index.html          Home — hero, manifesto, pinned rail, dark slab, craft, CTA
├── shop.html           Catalogue with category/colour filters and sorting
├── product.html        PDP, driven by ?id= from the catalogue
├── lookbook.html       Editorial grid + lightbox
├── about.html          Studio story, values, timeline, team
├── contact.html        Form, studio info, FAQ
├── 404.html
├── serve.py            Local dev server
└── assets/
    ├── css/
    │   ├── tokens.css      Colour, type scale, spacing, easing — edit here first
    │   ├── base.css        Reset, elements, typography + layout primitives
    │   ├── components.css  Buttons, cards, marquee, accordion, fields, scallop
    │   ├── layout.css      Preloader, cursor, header, menu, drawer, footer
    │   ├── pages.css       Per-page sections
    │   └── mobile.css      Phone/tablet layer — loaded last (see Mobile)
    └── js/
        ├── main.js         Bootstrap + page routing
        ├── boot-guard.js   Not a module: releases the page if the graph dies
        ├── data/
        │   └── products.js Catalogue, editorial imagery, reviews
        ├── core/
        │   ├── utils.js       Helpers, event bus, safe localStorage
        │   ├── scroll.js      Lenis + ScrollTrigger spine, progress, back-to-top
        │   ├── split.js       Line/word/char splitting into animatable masks
        │   ├── reveal.js      Declarative `data-anim` scroll animation layer
        │   ├── roll.js        Letter-roll button labels
        │   ├── cursor.js      Difference-blended custom cursor
        │   ├── preloader.js   Counted load + wordmark + wipe
        │   ├── transition.js  Curtain between pages
        │   ├── chrome.js      Injects menu, drawer, curtain, toasts, back-to-top
        │   ├── nav.js         Header stick/tuck, menu overlay, dark-band inversion
        │   ├── cart.js        Bag store + drawer + toasts
        │   ├── ui.js          Product card, quick-add, accordions, forms, marquees
        │   ├── fabric.js      Footer verlet-cloth easter egg
        │   └── mobile.js      Phone/tablet behaviour (see Mobile)
        └── pages/
            ├── home.js  shop.js  product.js  lookbook.js  about.js  contact.js
```

Header and footer are written into each HTML file so they exist and are
crawlable without JavaScript. The overlay menu, bag drawer, cursor, curtain and
toast stack are injected by `core/chrome.js`, because duplicating them seven
times would guarantee they drift apart.

**The preloader is home-only, and lasts one second.** The `.loader` block lives
in `index.html` and nowhere else — an entrance is an arrival at the house, not a
toll booth in front of every room. `core/preloader.js` no-ops when the markup is
absent, so moving or removing the splash is a markup change, not a code change.
Inner pages paint immediately.

`BUDGET` in that module is the whole life of the panel and every other number is
derived from it, so retiming the entrance is one constant. Two things keep it
honest: the wordmark rise is a CSS animation (`layout.css`), so it plays from the
first paint instead of waiting for the module graph to land; and `main.js` calls
`loader.finish()` as soon as the page has an opening state worth uncovering,
leaving the font wait and the reveal layer to finish underneath the wipe rather
than in front of it. A boot slower than `LATE` forfeits the count and leaves on
the short form — by then the visitor has waited long enough.

---

## Dependencies

Three CDN scripts, loaded `defer` ahead of the module:

| Library | Why |
| --- | --- |
| GSAP 3.12.5 | Timelines and tweens |
| ScrollTrigger | Pinning, scrubbing, enter/leave |
| Lenis 1.1.20 | Smooth scroll, synced to ScrollTrigger |

If any of them fails to load, `core/reveal.js` falls back to IntersectionObserver
+ CSS transitions and the site still works — nothing is permanently invisible.
`prefers-reduced-motion` takes the same path with animation switched off.

Fonts: Inter Tight (display/body), Bodoni Moda italic (accents), Space Mono (labels).

---

## The animation layer

Most motion is declared in markup, not wired up by hand:

```html
<h2 data-anim="lines">Split into per-line masks and raised in sequence</h2>
<h1 data-anim="chars" data-delay="0.2">Per letter</h1>
<div data-anim="img">Clip-reveal with a settling over-scale</div>
<div data-anim="stagger" data-stagger="0.1">Children, one after another</div>
<img data-parallax="-0.2">          <!-- scrubbed y offset -->
<span data-count="680">0</span>     <!-- odometer -->
<a data-magnetic="0.3">             <!-- eases toward the cursor -->
<img data-skew>                     <!-- leans into fast scrolling -->
<span data-roll>Add to bag</span>   <!-- letter-roll on hover -->
<a data-cursor="View">              <!-- cursor inflates into a label -->
<section data-theme="dark">         <!-- header inverts over this -->
```

Three things worth knowing if you extend it:

- **`data-anim` elements start hidden** (`visibility: hidden` under `html.js`)
  so nothing flashes unsplit. If you add an element and it never appears, its
  ScrollTrigger never fired.
- **Triggers are measured in creation order.** Anything created before a pinned
  section keeps pre-pin positions through every later refresh. That's why
  `initThemeInversion()` runs after the page module rather than inside
  `initNav()`, and why the home rail's pin sets `refreshPriority: 1`.
- **Anything that gates the reveal needs a wall-clock escape hatch.** GSAP and
  `ready()` both run on `requestAnimationFrame`, which browsers suspend in a
  background tab. Without a `setTimeout` fallback a visitor who opens the site
  in a background tab can come back to a black panel over a scroll-locked page.
  `core/preloader.js` arms three `setTimeout` guarantees at start, not in
  `finish()` (which is itself downstream of an rAF wait): the scheduled exit,
  a 1.6s grace if `finish()` never comes, and a 3s hard removal that also
  unhides `[data-anim]` in case boot never got that far. `ready()` races both
  of its waits.

---

## Mobile

Phones get their own treatment rather than a squeezed desktop. Two files own
it, and both are built so the desktop composition cannot be touched:

- **`assets/css/mobile.css`** — loaded last. Every rule sits inside a
  `max-width` or pointer media query. Add rules inside one of the numbered
  blocks; never at the top level of the file.
- **`assets/js/core/mobile.js`** — the whole module returns early unless
  `(max-width: 860px)` matches. Where a mobile pattern needs different markup
  it restructures the DOM at runtime and tags it with a class
  (`rail--swipe`, `craft--stacked`, `pdp--swipe`) that the stylesheet keys off,
  so even a resize cannot leak mobile styling onto a desktop layout.

What changes, and why:

| Desktop | Mobile | Reason |
| --- | --- | --- |
| Pinned horizontal rail, scrubbed | Snap carousel with progress + index | A scrubbed pin fights the browser's own scroll under a thumb. Section went 4067px → 919px. |
| Sticky plate beside cross-fading chapters | One plate per chapter | In a single-column grid a sticky item's containing block is its own row, so it has nowhere to travel; overlapping the columns put body copy on top of a photograph. |
| 4-col grid, hover swaps to alt shot | 2-col grid, no alt shot | There is no hover to swap on. |
| Quick-add bar slides up on hover | Frosted "+" in the image corner | Same reason; left open the bar covers a third of the picture. |
| Filter pills wrap freely | One scrolling row + a "Filter" sheet | The sticky bar was 180px of a 844px screen. Now 63px. |
| Static figure + thumb strip | Swipe gallery with dots | The expected idiom, and thumbs are tiny at 82px. |
| Menu links at 8rem | 14vw, ~55px, 62px tall rows | `8vw` of a phone is 31px — the clamp floor was doing all the work and the "giant" menu read as body copy. |
| Hover preview plate in the menu | All four looks as a strip | Nothing to hover. |
| Custom cursor, magnetic buttons | `:active` press states | Pointer-only effects. |

Also on mobile: safe-area insets on the header, drawer, buy bar and back-to-top;
16px form inputs so iOS does not zoom the page on focus; 44px minimum tap
targets on sizes, pills and accordions; swipe to page the lookbook lightbox; and
`ScrollTrigger.config({ ignoreMobileResize: true })` so the address bar
appearing does not re-measure every trigger mid-scroll.

**Crossing the 860px breakpoint by resizing a window needs a reload.** That is
deliberate — re-entrant teardown of three carousels buys nothing on a device
that cannot change width. Desktop layout was diffed against a captured baseline
after this work and is unchanged at 1024, 1280 and 1440px.

---

## Product data

`assets/js/data/products.js` is the single source. Each entry carries name, sub,
price, category, colour, swatches, sizes, sold-out sizes, photos, copy and a spec
table. Add an object and it appears on the shop grid, in filters and sorting, on
its own PDP at `product.html?id=<id>`, and in related products — no other file
needs touching.

Imagery is pulled live from the Unsplash CDN and desaturated at the edge
(`sat=-100`) so everything stays monochrome regardless of source. The `img()`
helper builds the URLs; swap the `photos` ids for real studio shots and the
rest of the app is unchanged.

---

## The bag

`core/cart.js` persists to `localStorage` under `umbra:bag`, every read and write
wrapped so private mode and blocked storage degrade quietly rather than throwing.
Quick-adds from a grid show a toast and bump the count; adds from the product
page open the drawer, on the grounds that one is a browse and the other is a
decision.

**Checkout is a stub.** `checkout()` shows a notice and nothing leaves the
browser. The contact and newsletter forms are the same — client-side only, no
endpoint. Wire those three to a real backend before this goes anywhere near a
customer.

---

## Footer easter egg

A verlet-integrated cloth mesh pinned along the top of the footer. Drag through
it and it swings; drag hard enough and threads snap, counted in the corner.
Double-click to re-weave. ~500 points and three relaxation passes, and the loop
parks itself via IntersectionObserver whenever the footer is off screen.

---

## Known limits

- Checkout, contact and newsletter are demo stubs (above).
- The horizontal rail pins on screens ≥861px and becomes a swipe carousel below.
- Resizing across 860px needs a reload (see Mobile).
- `split()` in `chars` mode flattens inline markup; `lines` mode preserves it.
  Use `lines` for any headline containing `<em>` or a styled `<span>`.
- Placeholder imagery is hotlinked from Unsplash, so the site needs a network
  connection to look right. Replace with local assets for production.
