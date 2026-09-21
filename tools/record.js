/**
 * UMBRA screen recorder — zero dependencies.
 *
 * Drives a real headless Chrome over the DevTools Protocol and captures
 * Page.startScreencast frames, so what lands in the video is the actual
 * GSAP/Lenis animation rather than a series of stills. Scrolling is driven
 * with real wheel events so Lenis's easing is what gets recorded.
 *
 *   node record.js <profile>
 *
 * Writes numbered jpegs plus an ffmpeg concat list into ./frames-<profile>.
 */

import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const BASE = 'http://localhost:5179';
const OUT_ROOT = process.argv[3] || '.';

/* ------------------------------------------------------------------ */
/* Journeys                                                            */
/* ------------------------------------------------------------------ */

const PROFILES = {
  desktop: {
    width: 1440,
    height: 900,
    dsf: 1,
    mobile: false,
    maxW: 1440,
    maxH: 900,
    journey: [
      { go: '/index.html' },
      { wait: 3600, note: 'preloader + hero overture' },
      { scroll: 1500, ms: 3200 },      // manifesto + counters
      { wait: 700 },
      { scroll: 1400, ms: 2600 },      // into the pinned rail
      { wait: 500 },
      { scroll: 2600, ms: 5200 },      // rail travels horizontally
      { wait: 600 },
      { scroll: 1500, ms: 2800 },      // scallop seam + dark slab
      { wait: 800 },
      { scroll: 1800, ms: 3400 },      // craft chapters
      { wait: 500 },
      { scroll: 1500, ms: 2800 },      // new in grid + editorial
      { wait: 500 },
      { scroll: 1800, ms: 3200 },      // reviews + CTA
      { wait: 500 },
      { scroll: 1400, ms: 2600 },      // footer cloth
      { wait: 1200 },

      { go: '/shop.html' },
      { wait: 2600 },
      { scroll: 700, ms: 1600 },
      { click: '[data-filter="category:outerwear"]', wait: 1800 },
      { click: '[data-filter="category:all"]', wait: 1600 },
      { hover: '.card', wait: 1200 },
      { wait: 400 },

      { go: '/product.html?id=monolith-coat' },
      { wait: 2600 },
      { click: '[data-sizes] .pill:nth-child(2)', wait: 900 },
      { click: '[data-add]', wait: 2400 },
      { click: '[data-drawer-close]', wait: 1400 },

      { go: '/lookbook.html' },
      { wait: 2400 },
      { scroll: 1600, ms: 3400 },
      { wait: 900 }
    ]
  },

  mobile: {
    width: 390,
    height: 844,
    dsf: 2,
    mobile: true,
    maxW: 780,
    maxH: 1688,
    journey: [
      { go: '/index.html' },
      { wait: 3600, note: 'preloader + hero blend' },
      { scroll: 900, ms: 2400 },       // manifesto
      { wait: 700 },
      { scroll: 900, ms: 2200 },       // stats
      { wait: 500 },
      { scroll: 700, ms: 1800 },       // into the rail
      { wait: 600 },
      { swipe: '.rail__track', to: 0.34, ms: 900, wait: 700 },
      { swipe: '.rail__track', to: 0.68, ms: 900, wait: 700 },
      { swipe: '.rail__track', to: 1.0, ms: 900, wait: 900 },
      { scroll: 900, ms: 2200 },       // slab
      { wait: 700 },
      { scroll: 1500, ms: 3000 },      // craft plates
      { wait: 500 },
      { scroll: 1400, ms: 2800 },      // 2-col grid
      { wait: 600 },
      { scroll: 1600, ms: 3000 },      // reviews + CTA
      { wait: 500 },
      { scroll: 1400, ms: 2600 },      // footer
      { wait: 1000 },

      { go: '/shop.html' },
      { wait: 2600 },
      { scroll: 420, ms: 1200 },
      { swipe: '.filters__scroll', to: 1.0, ms: 900, wait: 700 },
      { click: '.filters__more', wait: 1300 },
      { click: '[data-filter="colour:Black"]', wait: 1800 },
      { click: '.filters__more', wait: 1200 },
      { scroll: 700, ms: 1800 },
      { wait: 700 },

      { go: '/product.html?id=null-hoodie' },
      { wait: 2600 },
      { swipe: '.pdp__swipe', to: 0.5, ms: 800, wait: 800 },
      { swipe: '.pdp__swipe', to: 1.0, ms: 800, wait: 800 },
      { scroll: 620, ms: 1600 },
      { click: '[data-sizes] .pill:nth-child(3)', wait: 900 },
      { click: '[data-add]', wait: 2400 },
      { click: '[data-drawer-close]', wait: 1300 },

      { go: '/lookbook.html' },
      { wait: 2400 },
      { scroll: 1500, ms: 3200 },
      { wait: 900 }
    ]
  }
};

/* ------------------------------------------------------------------ */
/* Minimal CDP client                                                  */
/* ------------------------------------------------------------------ */

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) {
        (this.handlers.get(msg.method) || []).forEach((fn) => fn(msg.params));
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  eval(expression) {
    return this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    }).then((r) => r.result?.value);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect(port) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
          ws.addEventListener('open', resolve, { once: true });
          ws.addEventListener('error', reject, { once: true });
        });
        return new CDP(ws);
      }
    } catch { /* chrome still starting */ }
    await sleep(300);
  }
  throw new Error('could not attach to Chrome');
}

/* ------------------------------------------------------------------ */
/* Scroll / swipe helpers                                              */
/* ------------------------------------------------------------------ */

/** Real wheel events, so Lenis's easing is what gets recorded. */
async function wheelScroll(cdp, distance, ms, viewport) {
  const step = 16;                       // ~60 ticks a second
  const ticks = Math.max(1, Math.round(ms / step));
  const perTick = distance / ticks;
  const x = Math.round(viewport.width / 2);
  const y = Math.round(viewport.height / 2);

  for (let i = 0; i < ticks; i++) {
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x, y,
      deltaX: 0,
      deltaY: perTick,
      pointerType: 'mouse'
    });
    await sleep(step);
  }
}

/** Native overflow scrollers (rail, gallery, filter row). */
async function swipe(cdp, selector, to, ms) {
  await cdp.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return 'missing';
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: max * ${to}, behavior: 'smooth' });
    return 'ok';
  })()`);
  await sleep(ms);
}

/* ------------------------------------------------------------------ */
/* Record                                                              */
/* ------------------------------------------------------------------ */

async function record(name) {
  const profile = PROFILES[name];
  if (!profile) throw new Error(`unknown profile ${name}`);

  const outDir = path.join(OUT_ROOT, `frames-${name}`);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  if (!existsSync(CHROME)) throw new Error(`chrome not found at ${CHROME}`);

  // Chrome resolves a relative --user-data-dir against its own cwd
  const userDir = path.resolve(OUT_ROOT, `chrome-profile-${name}`);
  await rm(userDir, { recursive: true, force: true });
  await mkdir(userDir, { recursive: true });

  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDir}`,
    `--window-size=${profile.width},${profile.height}`,
    '--hide-scrollbars',
    // Must match the emulated DPR, otherwise it clamps the screencast
    // back down to CSS pixels and the phone capture comes out soft.
    `--force-device-scale-factor=${profile.dsf}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--force-color-profile=srgb',
    '--font-render-hinting=none',
    'about:blank'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  chrome.on('error', (e) => console.error('chrome spawn error:', e.message));
  chrome.on('exit', (code, sig) => console.error('chrome exited', code, sig));
  chrome.stderr.on('data', (d) => {
    const s = d.toString().trim();
    if (s && !/DevTools listening|Fontconfig|GPU|Voice/i.test(s)) console.error('chrome:', s.slice(0, 200));
  });

  const cdp = await connect(PORT);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: profile.width,
    height: profile.height,
    deviceScaleFactor: profile.dsf,
    mobile: profile.mobile,
    screenWidth: profile.width,
    screenHeight: profile.height
  });
  if (profile.mobile) {
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }

  /* ---- collect frames ---- */

  const frames = [];
  cdp.on('Page.screencastFrame', async (p) => {
    frames.push({ data: p.data, t: p.metadata.timestamp });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: p.sessionId }); } catch { /* closing */ }
  });

  const navigate = async (url) => {
    const done = new Promise((resolve) => {
      const off = (params) => { if (params) resolve(); };
      cdp.on('Page.loadEventFired', off);
    });
    await cdp.send('Page.navigate', { url: BASE + url });
    await Promise.race([done, sleep(8000)]);
  };

  // Warm the first page up before the camera rolls
  await navigate(profile.journey[0].go);
  await sleep(1500);
  await cdp.eval('sessionStorage.clear()');

  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    maxWidth: profile.maxW,
    maxHeight: profile.maxH,
    everyNthFrame: 1
  });

  const viewport = { width: profile.width, height: profile.height };

  for (const step of profile.journey) {
    if (step.go) {
      await navigate(step.go);
      continue;
    }
    if (step.scroll) await wheelScroll(cdp, step.scroll, step.ms || 1500, viewport);
    if (step.swipe) await swipe(cdp, step.swipe, step.to ?? 1, step.ms || 800);
    if (step.click) {
      await cdp.eval(`(() => {
        const el = document.querySelector(${JSON.stringify(step.click)});
        if (el) el.click();
        return !!el;
      })()`);
    }
    if (step.hover) {
      await cdp.eval(`(() => {
        const el = document.querySelector(${JSON.stringify(step.hover)});
        if (!el) return false;
        const r = el.getBoundingClientRect();
        el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, clientX: r.left + r.width/2, clientY: r.top + r.height/2 }));
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        return true;
      })()`);
    }
    if (step.wait) await sleep(step.wait);
  }

  await cdp.send('Page.stopScreencast');
  await sleep(300);

  /* ---- write frames + ffmpeg concat list ---- */

  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const file = `f${String(i).padStart(5, '0')}.jpg`;
    await writeFile(path.join(outDir, file), Buffer.from(frames[i].data, 'base64'));
    const next = frames[i + 1];
    const dur = next ? Math.max(0.008, Math.min(0.5, next.t - frames[i].t)) : 0.08;
    lines.push(`file '${file}'`, `duration ${dur.toFixed(4)}`);
  }
  // concat demuxer needs the last file repeated to honour its duration
  if (frames.length) lines.push(`file 'f${String(frames.length - 1).padStart(5, '0')}.jpg'`);
  await writeFile(path.join(outDir, 'list.txt'), lines.join('\n'));

  const span = frames.length ? frames[frames.length - 1].t - frames[0].t : 0;
  console.log(`${name}: ${frames.length} frames over ${span.toFixed(1)}s -> ${outDir}`);

  try { cdp.ws.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(500);
  await rm(userDir, { recursive: true, force: true }).catch(() => {});
}

await record(process.argv[2] || 'desktop');
