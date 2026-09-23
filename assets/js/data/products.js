/* ============================================================
   UMBRA — Catalogue
   Placeholder imagery is pulled live from Unsplash's CDN and
   desaturated at the edge (sat=-100) so the whole house stays
   monochrome. Swap `photo` ids for real studio shots later —
   nothing else in the app needs to change.
   ============================================================ */

const CDN = 'https://images.unsplash.com/';

/** Build a responsive, desaturated CDN url. */
export function img(id, w = 900, h = 1200) {
  return `${CDN}${id}?auto=format&fit=crop&q=72&sat=-100&w=${w}&h=${h}`;
}

export const CURRENCY = { code: 'GBP', symbol: '£' };

export function price(n) {
  return CURRENCY.symbol + n.toLocaleString('en-GB', { minimumFractionDigits: 0 });
}

export const PRODUCTS = [
  {
    id: 'zero-tee',
    name: 'Zero Heavyweight Tee',
    sub: 'Optic White',
    price: 95,
    was: null,
    category: 'tops',
    tag: 'Core',
    colour: 'White',
    swatches: ['#f4f3f1', '#0b0b0b'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    soldOut: ['XS'],
    photos: ['photo-1581655353564-df123a1eb820', 'photo-1556630184-066f7ac4e15f', 'photo-1620799139652-715e4d5b232d', 'photo-1564584217132-2271feaeb3c5'],
    blurb: '260gsm compact-spun cotton, garment-washed twice so it lands soft and stays square. The shoulder seam sits a half-inch wide of natural — the only decoration is the way it hangs.',
    details: [
      ['Composition', '100% long-staple organic cotton, 260gsm'],
      ['Fit', 'Boxy. Take one down for a closer line.'],
      ['Origin', 'Knitted in Porto, cut and sewn in Portugal.'],
      ['Care', 'Cold machine wash. Dry flat. Never bleach.']
    ],
    drop: 'I',
    year: 2026
  },
  {
    id: 'null-hoodie',
    name: 'Null Oversized Hoodie',
    sub: 'Carbon Black',
    price: 210,
    was: 260,
    category: 'outerwear',
    tag: 'Drop I',
    colour: 'Black',
    swatches: ['#0b0b0b', '#6f6f6f'],
    sizes: ['S', 'M', 'L', 'XL'],
    soldOut: [],
    photos: ['photo-1610582144787-eda2e6f293b4', 'photo-1633292587737-f898a032e562', 'photo-1553728437-e15abbe95e6b', 'photo-1586791400644-b04429f7d808'],
    blurb: 'A 480gsm loopback fleece with a double-layer hood that holds its shape off the shoulder. Dyed in three passes to reach a black that does not fade to brown.',
    details: [
      ['Composition', '80% organic cotton, 20% recycled fibre, 480gsm'],
      ['Fit', 'Oversized. Dropped shoulder, cropped body.'],
      ['Origin', 'Woven and finished in Japan.'],
      ['Care', 'Wash inside out at 30°. Line dry in shade.']
    ],
    drop: 'I',
    year: 2026
  },
  {
    id: 'monolith-coat',
    name: 'Monolith Wool Overcoat',
    sub: 'Pitch',
    price: 680,
    was: null,
    category: 'outerwear',
    tag: 'Atelier',
    colour: 'Black',
    swatches: ['#0b0b0b'],
    sizes: ['S', 'M', 'L', 'XL'],
    soldOut: ['XL'],
    photos: ['photo-1638337935003-e17cf483ca8d', 'photo-1609565911206-04527a94436e', 'photo-1629511565591-a1d494ad6c58'],
    blurb: 'One shape, cut from a single 720g Italian wool melton. No lining, no shoulder pad — the weight of the cloth does the tailoring for you.',
    details: [
      ['Composition', '90% virgin wool, 10% cashmere, 720g melton'],
      ['Fit', 'Straight, knee-grazing, single closure.'],
      ['Origin', 'Cloth from Biella. Made in Italy.'],
      ['Care', 'Dry clean only. Brush after wear.']
    ],
    drop: 'ATELIER',
    year: 2026
  },
  {
    id: 'vellum-shirt',
    name: 'Vellum Poplin Shirt',
    sub: 'Paper White',
    price: 185,
    was: null,
    category: 'tops',
    tag: 'Core',
    colour: 'White',
    swatches: ['#ffffff', '#f4f3f1'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    soldOut: [],
    photos: ['photo-1621773881532-fe65715b5137', 'photo-1591047139829-d91aecb6caea', 'photo-1589785152613-cae7ef6afb3b', 'photo-1536924430914-91f9e2041b83'],
    blurb: 'Swiss poplin at 120/2, mercerised until it reads like paper under studio light. Mother-of-pearl buttons, French seams, a collar built to stand without fusing.',
    details: [
      ['Composition', '100% Swiss cotton poplin, 120/2'],
      ['Fit', 'Relaxed through the body, clean at the shoulder.'],
      ['Origin', 'Cloth from Switzerland. Made in Portugal.'],
      ['Care', 'Machine wash 30°. Iron damp on the reverse.']
    ],
    drop: 'I',
    year: 2026
  },
  {
    id: 'ash-tee',
    name: 'Ash Boxy Tee',
    sub: 'Mid Grey',
    price: 88,
    was: null,
    category: 'tops',
    tag: null,
    colour: 'Grey',
    swatches: ['#8c8c8c', '#0b0b0b'],
    sizes: ['S', 'M', 'L', 'XL'],
    soldOut: [],
    photos: ['photo-1556630184-066f7ac4e15f', 'photo-1581655353564-df123a1eb820', 'photo-1620799139652-715e4d5b232d'],
    blurb: 'The Zero body in a pigment-dyed grey that shifts a half-tone every wash. Intentional. It will look better in a year than it does today.',
    details: [
      ['Composition', '100% organic cotton, 240gsm, pigment dyed'],
      ['Fit', 'Boxy, same block as Zero.'],
      ['Origin', 'Made in Portugal.'],
      ['Care', 'Cold wash with like colours.']
    ],
    drop: 'I',
    year: 2026
  },
  {
    id: 'obscura-knit',
    name: 'Obscura Rib Turtleneck',
    sub: 'Ink',
    price: 245,
    was: null,
    category: 'knitwear',
    tag: 'Drop I',
    colour: 'Black',
    swatches: ['#0b0b0b', '#f4f3f1'],
    sizes: ['XS', 'S', 'M', 'L'],
    soldOut: ['S'],
    photos: ['photo-1587115924362-622c3fa065bd', 'photo-1605083608390-a397bb302853', 'photo-1567425601834-0768cf9f3c78'],
    blurb: 'Fully-fashioned merino rib, knitted to shape rather than cut from panel. The neck folds twice and sits exactly where it should, every time.',
    details: [
      ['Composition', '100% extra-fine merino, 14gg rib'],
      ['Fit', 'Second skin through the arm, easy at the body.'],
      ['Origin', 'Knitted in Scotland.'],
      ['Care', 'Hand wash cool. Dry flat, reshape while damp.']
    ],
    drop: 'I',
    year: 2026
  },
  {
    id: 'linen-seven',
    name: 'Linen No. 7 Shirt',
    sub: 'Off White',
    price: 165,
    was: 195,
    category: 'tops',
    tag: 'Last Pieces',
    colour: 'White',
    swatches: ['#f4f3f1'],
    sizes: ['S', 'M', 'L'],
    soldOut: ['L'],
    photos: ['photo-1589785148112-83debe32a7ff', 'photo-1536924430914-91f9e2041b83', 'photo-1591047139829-d91aecb6caea'],
    blurb: 'Belgian flax, stonewashed seven times — hence the name. Creases the moment you wear it, which is the entire point.',
    details: [
      ['Composition', '100% Belgian flax linen, 165gsm'],
      ['Fit', 'Loose. Open placket, no chest pocket.'],
      ['Origin', 'Flax from Normandy. Made in Portugal.'],
      ['Care', 'Machine wash 30°. Embrace the crease.']
    ],
    drop: 'I',
    year: 2026
  },
  {
    id: 'eclipse-blazer',
    name: 'Eclipse Tailored Blazer',
    sub: 'Pitch',
    price: 520,
    was: null,
    category: 'outerwear',
    tag: 'Atelier',
    colour: 'Black',
    swatches: ['#0b0b0b'],
    sizes: ['XS', 'S', 'M', 'L'],
    soldOut: [],
    photos: ['photo-1552393700-42696fb89bfa', 'photo-1548207775-a7676e36f20a', 'photo-1530904655194-92d55d4a006b'],
    blurb: 'A half-canvassed jacket with the padding taken out and the armhole raised. Structured where it counts, soft everywhere else.',
    details: [
      ['Composition', '98% virgin wool, 2% elastane'],
      ['Fit', 'Single breasted, slightly cropped, two button.'],
      ['Origin', 'Made in Italy.'],
      ['Care', 'Dry clean only.']
    ],
    drop: 'ATELIER',
    year: 2026
  },
  {
    id: 'chalk-blazer',
    name: 'Chalk Relaxed Blazer',
    sub: 'Bone',
    price: 495,
    was: null,
    category: 'outerwear',
    tag: null,
    colour: 'White',
    swatches: ['#f4f3f1', '#e8e6e2'],
    sizes: ['XS', 'S', 'M', 'L'],
    soldOut: ['XS'],
    photos: ['photo-1569444743503-f11ed614445b', 'photo-1569444744140-83c39a75198f', 'photo-1571513800374-df1bbe650e56'],
    blurb: 'The Eclipse block, unlined and cut a size generous, in an undyed bone wool-linen. Made to be thrown over everything else in this list.',
    details: [
      ['Composition', '62% wool, 38% linen, undyed'],
      ['Fit', 'Oversized, unstructured shoulder.'],
      ['Origin', 'Made in Portugal.'],
      ['Care', 'Dry clean. Air between wears.']
    ],
    drop: 'II',
    year: 2026
  },
  {
    id: 'silhouette-dress',
    name: 'Silhouette Bias Dress',
    sub: 'Pitch',
    price: 385,
    was: null,
    category: 'dresses',
    tag: 'Drop II',
    colour: 'Black',
    swatches: ['#0b0b0b'],
    sizes: ['XS', 'S', 'M', 'L'],
    soldOut: [],
    photos: ['photo-1568252542512-9fe8fe9c87bb', 'photo-1530904655194-92d55d4a006b', 'photo-1548207775-a7676e36f20a'],
    blurb: 'Cut on the true bias from sandwashed silk so it moves a half-second behind you. One seam at the side, nothing else in the way.',
    details: [
      ['Composition', '100% sandwashed silk, 19mm'],
      ['Fit', 'Fluid, floor-skimming, adjustable strap.'],
      ['Origin', 'Made in Italy.'],
      ['Care', 'Dry clean or gentle hand wash cool.']
    ],
    drop: 'II',
    year: 2026
  },
  {
    id: 'atelier-trench',
    name: 'Atelier Trench',
    sub: 'Stone',
    price: 620,
    was: null,
    category: 'outerwear',
    tag: 'Atelier',
    colour: 'Grey',
    swatches: ['#c9c6c1', '#6f6f6f'],
    sizes: ['S', 'M', 'L'],
    soldOut: [],
    photos: ['photo-1613915617430-8ab0fd7c6baf', 'photo-1586081493946-c75071ee57c0', 'photo-1619470149201-63960dec27cf'],
    blurb: 'Densely woven cotton gabardine with a storm flap that actually works. The belt is cut from the same cloth, never leather.',
    details: [
      ['Composition', '100% cotton gabardine, wax-free finish'],
      ['Fit', 'Long, double breasted, deep vent.'],
      ['Origin', 'Made in England.'],
      ['Care', 'Dry clean. Re-proof annually.']
    ],
    drop: 'ATELIER',
    year: 2026
  },
  {
    id: 'veil-scarf',
    name: 'Veil Wool Scarf',
    sub: 'Ivory',
    price: 130,
    was: null,
    category: 'accessories',
    tag: null,
    colour: 'White',
    swatches: ['#f4f3f1', '#0b0b0b'],
    sizes: ['One Size'],
    soldOut: [],
    photos: ['photo-1637102146291-c408b298e22b', 'photo-1650225336194-48887605eea0', 'photo-1643578545817-135602f5b9e2'],
    blurb: 'Two metres of brushed lambswool, hand-finished with a rolled edge. Wide enough to work as a wrap when the coat is not enough.',
    details: [
      ['Composition', '100% brushed lambswool'],
      ['Fit', '200 × 65cm.'],
      ['Origin', 'Woven in Scotland.'],
      ['Care', 'Dry clean. Store folded, never hung.']
    ],
    drop: 'I',
    year: 2026
  },
  {
    id: 'cinder-trouser',
    name: 'Cinder Wide Trouser',
    sub: 'Carbon',
    price: 260,
    was: null,
    category: 'trousers',
    tag: 'Drop II',
    colour: 'Black',
    swatches: ['#0b0b0b', '#6f6f6f'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    soldOut: ['XS', 'XL'],
    photos: ['photo-1589278042662-e60081fcb3d8', 'photo-1619470149201-63960dec27cf', 'photo-1638109879135-285a7b8b5924'],
    blurb: 'A flat-front wide leg with a hidden hook closure and no belt loops. Drapes from the hip, breaks once at the shoe.',
    details: [
      ['Composition', '54% wool, 46% recycled polyester tropical'],
      ['Fit', 'High rise, wide straight leg.'],
      ['Origin', 'Made in Portugal.'],
      ['Care', 'Dry clean. Press on low with a cloth.']
    ],
    drop: 'II',
    year: 2026
  },
  {
    id: 'halo-knit',
    name: 'Halo Crew Knit',
    sub: 'Ivory',
    price: 230,
    was: null,
    category: 'knitwear',
    tag: null,
    colour: 'White',
    swatches: ['#f4f3f1'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    soldOut: [],
    photos: ['photo-1571513800374-df1bbe650e56', 'photo-1603189343302-e603f7add05a', 'photo-1569444744140-83c39a75198f'],
    blurb: 'Undyed merino in its natural ivory, knitted at 7 gauge for weight without bulk. Ribbed cuff, saddle shoulder, nothing else.',
    details: [
      ['Composition', '100% undyed merino, 7gg'],
      ['Fit', 'Easy crew, slightly long in the body.'],
      ['Origin', 'Knitted in Scotland.'],
      ['Care', 'Hand wash cool. Dry flat.']
    ],
    drop: 'II',
    year: 2026
  }
];

/* Editorial imagery used across hero, lookbook and slabs. */
export const EDITORIAL = {
  hero:      'photo-1568252542512-9fe8fe9c87bb',
  heroAlt:   'photo-1638337935003-e17cf483ca8d',
  craft: [
    'photo-1556630184-066f7ac4e15f',
    'photo-1633292587737-f898a032e562',
    'photo-1637102146291-c408b298e22b',
    'photo-1621773881532-fe65715b5137'
  ],
  looks: [
    { id: 'photo-1638337935003-e17cf483ca8d', title: 'Monolith', note: 'Look 01 — Overcoat, Rib Turtleneck' },
    { id: 'photo-1568252542512-9fe8fe9c87bb', title: 'Silhouette', note: 'Look 02 — Bias Dress' },
    { id: 'photo-1613915617430-8ab0fd7c6baf', title: 'Atelier',   note: 'Look 03 — Trench, Wide Trouser' },
    { id: 'photo-1569444743503-f11ed614445b', title: 'Chalk',     note: 'Look 04 — Relaxed Blazer' },
    { id: 'photo-1552393700-42696fb89bfa',    title: 'Eclipse',   note: 'Look 05 — Tailored Blazer' },
    { id: 'photo-1629511565591-a1d494ad6c58', title: 'Nocturne',  note: 'Look 06 — Full black' },
    { id: 'photo-1589278042662-e60081fcb3d8', title: 'Cinder',    note: 'Look 07 — Wide Trouser' },
    { id: 'photo-1571513800374-df1bbe650e56', title: 'Halo',      note: 'Look 08 — Crew Knit' }
  ],
  studio: [
    'photo-1626576352171-211d1cc5ec73',
    'photo-1643578545817-135602f5b9e2',
    'photo-1650225336194-48887605eea0'
  ],
  team: [
    { id: 'photo-1536924430914-91f9e2041b83', name: 'Maren Voss',    role: 'Founder, Creative Direction' },
    { id: 'photo-1587115924362-622c3fa065bd', name: 'Ilya Novák',    role: 'Head of Cut & Construction' },
    { id: 'photo-1589785152613-cae7ef6afb3b', name: 'Rhea Kalinda',  role: 'Materials & Sourcing' },
    { id: 'photo-1605083608390-a397bb302853', name: 'Toma Berglund', role: 'Studio Production' }
  ]
};

export const REVIEWS = [
  { text: 'The coat is the last coat.',         who: '@vossanna',      stars: 5 },
  { text: 'Nothing else fits like this.',       who: '@studio.mkr',    stars: 5 },
  { text: 'Two washes in, still perfect.',      who: '@lior.eats',     stars: 5 },
  { text: 'Quiet, heavy, exactly right.',       who: '@thegreyroom',   stars: 5 },
  { text: 'I own it in both colours.',          who: '@dailyuniform',  stars: 5 },
  { text: 'Worth every single pound.',          who: '@archive.no6',   stars: 5 }
];

export function byId(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function related(id, n = 4) {
  const me = byId(id);
  if (!me) return PRODUCTS.slice(0, n);
  const same = PRODUCTS.filter((p) => p.id !== id && p.category === me.category);
  const rest = PRODUCTS.filter((p) => p.id !== id && p.category !== me.category);
  return [...same, ...rest].slice(0, n);
}
