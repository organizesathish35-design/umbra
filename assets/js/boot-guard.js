/* ============================================================
   UMBRA — Boot guard

   The one script here that is not a module, and the only reason
   it is not is that it has to survive the thing it guards against.

   Everything else rides an ES module graph. A browser refuses to
   load one over file://, a blocked CDN or a dropped connection can
   leave it half-arrived, and a single 404 inside it stops the whole
   graph before a line of it runs. When that happens the markup is
   left exactly as it ships: `html.js` hides every [data-anim]
   element, and on home the entry panel sits over the page with
   nothing behind it left to take it away. That is the one failure
   with no floor — the visitor waits forever.

   So if the graph never signs in, this hands the page back to the
   no-JS styling: panel gone, content visible, scroll free. A page
   with no motion beats a page nobody can get past.

   `main.js` sets `__umbraBooted` the moment the graph resolves,
   which is the only signal to stand down — from there
   `core/preloader.js` has its own, tighter guarantees.
   ============================================================ */
(function () {
  // Long, because a false release costs a flash of unstyled entrance
  // while a missed one costs the whole page. Both failures that are
  // worth catching quickly are caught below without waiting for it.
  var GRACE = 6000;

  function release() {
    if (window.__umbraBooted) return;

    var root = document.documentElement;
    root.classList.remove('js');
    root.classList.add('no-js');

    var loader = document.querySelector('.loader');
    if (loader) loader.remove();
    if (document.body) document.body.classList.remove('is-locked');
  }

  // Off the disk the graph is not late, it is never coming: the
  // browser treats file:// as a null origin and blocks every module
  // inside it. Nothing to wait for, so do not make anyone wait.
  if (location.protocol === 'file:') {
    console.warn(
      '[umbra] Opened over file:// — the browser blocks ES modules there, ' +
      'so the site is running as plain markup. Serve it instead: python serve.py'
    );
    release();
    return;
  }

  // A fetch that fails after this script has run says so directly.
  var mod = document.querySelector('script[type="module"]');
  if (mod) mod.addEventListener('error', release);

  // Everything else — a failure that beat us here, a graph that
  // resolves but never executes — falls through to the clock.
  window.setTimeout(release, GRACE);
})();
