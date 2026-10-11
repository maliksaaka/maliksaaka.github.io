/* Page transitions. Load synchronously in <head> (no defer) on index.html, work.html and
   work/company.html: it opts the pages into cross-document View Transitions and has to set
   classes before the first paint.
   1) Blinds: only for the splash "Welcome" link into work.html. The splash closes the blinds
      in JS, stores a short-lived flag, then navigates; work.html starts closed and sweeps open.
   2) Tile morph: Special Projects tiles on work.html morph into the detail page hero (and back).
      The shared name "ms-hero" is set per navigation, on pageswap (old page) and pagereveal
      (new page), so only the one tile involved takes part.
   Everything else gets a quick crossfade. Browsers without cross-document view transitions
   navigate normally; reduced motion turns all of it off. */
(function () {
  var d = document, h = d.documentElement, ss = window.sessionStorage;
  var VT = !!window.CSSViewTransitionRule && ('onpagereveal' in window);
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = 28, NAME = 'ms-hero';
  var SPECIAL = { 'mugler': 1, 'alibi-lounge': 1, 'sxylk': 1 };
  var SAME = { 'sxylk': 1 };                         // tile and hero are the same photo: true image morph
  var DIMS = { 'mugler': [1280, 600], 'sxylk': [1000, 2168] };   // hero sizes, so the frame is right before the image loads

  var css = '' +
    '@view-transition{navigation:auto}' +
    '@media (prefers-reduced-motion:reduce){@view-transition{navigation:none}}' +
    '::view-transition-old(root),::view-transition-new(root){animation-duration:.22s}' +
    /* blinds */
    'html.ms-bl-in::view-transition-old(root),html.ms-bl-in::view-transition-new(root){animation:none}' +
    'html.ms-bl-in:not(.ms-bl-ready) body::before{content:"";position:fixed;inset:0;z-index:9000;pointer-events:none;background:#fff repeating-linear-gradient(#fff 0 calc(100vh / ' + N + ' - 1px),rgba(0,0,0,.55) calc(100vh / ' + N + ' - 1px) calc(100vh / ' + N + '))}' +
    '.ms-blinds{position:fixed;inset:0;z-index:9000;pointer-events:none;display:flex;flex-direction:column}' +
    '.ms-blinds i{flex:1;display:flex;flex-direction:column;justify-content:flex-start}' +
    '.ms-blinds i::before{content:"";display:block;height:0;background:#fff;border-bottom:1px solid transparent;box-sizing:content-box;transition:height .42s cubic-bezier(.65,0,.35,1) calc(var(--i) * 15ms),border-color .2s calc(var(--i) * 15ms)}' +
    'html.ms-bl-shut .ms-blinds i::before,html.ms-bl-closed .ms-blinds i::before{height:100%;border-color:rgba(0,0,0,.55)}' +
    'html.ms-bl-closed .ms-blinds i::before{transition:none}' +
    'html.ms-bl-open .ms-blinds i{justify-content:flex-end}' +
    'html.ms-bl-open .ms-blinds i::before{height:0;border-bottom:0;border-top:1px solid rgba(0,0,0,.55);transition:height .5s cubic-bezier(.65,0,.35,1) calc(120ms + var(--i) * 15ms),border-color .3s calc(420ms + var(--i) * 15ms)}' +
    'html.ms-bl-open.ms-bl-fade .ms-blinds i::before{border-color:transparent}' +
    /* morph */
    'html.ms-morph::view-transition-group(' + NAME + '){animation-duration:.75s;animation-timing-function:cubic-bezier(.7,0,.2,1)}' +
    'html.ms-morph::view-transition-old(' + NAME + '),html.ms-morph::view-transition-new(' + NAME + '){height:100%;width:100%;object-fit:cover;animation-duration:.75s}' +
    'html.ms-morph::view-transition-old(root){animation:ms-out .3s ease both}' +
    'html.ms-morph::view-transition-new(root){animation:ms-in .45s ease .25s both}' +
    /* same photo, to the detail page: at the start the hero image, cropped like the tile, is
       pixel-identical to the tile, so it takes over at once and simply uncrops as the frame grows */
    'html.ms-same::view-transition-old(' + NAME + '),html.ms-same::view-transition-new(' + NAME + '){mix-blend-mode:normal}' +
    'html.ms-same.ms-to-detail::view-transition-new(' + NAME + '){object-position:50% 27.2%;animation:ms-in .1s linear both}' +
    'html.ms-same.ms-to-detail::view-transition-old(' + NAME + '){animation:ms-out .01s linear .1s both}' +
    /* same photo, back to work: the hero crops down to exactly the tile, then the tile fades in on top */
    'html.ms-same.ms-to-work::view-transition-old(' + NAME + '){object-position:50% 27.2%;animation:none}' +
    'html.ms-same.ms-to-work::view-transition-new(' + NAME + '){animation:ms-in .1s linear .65s both}' +
    /* Alibi has no hero photo: the tile grows into the constellation band, so its photo clears early */
    'html.ms-band.ms-to-detail::view-transition-old(' + NAME + '){animation:ms-out .35s ease both}' +
    'html.ms-band.ms-to-detail::view-transition-new(' + NAME + '){animation:ms-in .5s ease .1s both}' +
    'html.ms-band.ms-to-work::view-transition-old(' + NAME + '){animation:ms-out .4s ease both}' +
    'html.ms-band.ms-to-work::view-transition-new(' + NAME + '){animation:ms-in .35s ease .4s both}' +
    '.tile.ms-src .media::after{opacity:0!important;transition:none!important}.tile.ms-src .media img{transform:none!important;transition:none!important}' +
    '@keyframes ms-out{to{opacity:0}}@keyframes ms-in{from{opacity:0}}';
  var st = d.createElement('style'); st.id = 'page-tx'; st.textContent = css; d.head.appendChild(st);

  var page = /\/work\/company\.html$/.test(location.pathname) ? 'detail' : /\/work\.html$/.test(location.pathname) ? 'work' : /(\/|\/index\.html)$/.test(location.pathname) ? 'splash' : '';
  function slugOf(url) {
    try { var u = new URL(url, location.href); return /\/work\/company\.html$/.test(u.pathname) ? (u.searchParams.get('c') || 'solo-funds') : null; } catch (e) { return null; }
  }
  function isWork(url) { try { return /\/work\.html$/.test(new URL(url, location.href).pathname); } catch (e) { return false; } }
  function inView(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }
  function tileFor(slug) {
    var a = d.querySelector('.grid.duo a.tile[href$="company.html?c=' + slug + '"]');
    return a && a.querySelector('.media') ? a : null;
  }
  function heroFor(slug) {                           // photo heroes morph the image; Alibi (no hero) morphs the band
    var im = d.querySelector('#hframe:not([hidden]) img');
    if (im) {
      if (!im.complete && DIMS[slug] && !im.getAttribute('width')) { im.width = DIMS[slug][0]; im.height = DIMS[slug][1]; }
      return im;
    }
    return d.getElementById('banner');
  }
  function clearNames() { d.querySelectorAll('[data-ms-vt]').forEach(function (el) { el.style.viewTransitionName = ''; el.removeAttribute('data-ms-vt'); }); }
  function name(el) { clearNames(); el.style.viewTransitionName = NAME; el.setAttribute('data-ms-vt', ''); }

  /* ---------- morph ---------- */
  if (VT && !RM) {
    addEventListener('pageswap', function (e) {      // old page, just before its snapshot
      if (!e.viewTransition || !e.activation) return;
      var to = e.activation.entry && e.activation.entry.url;
      if (page === 'work') {
        var s = slugOf(to), t = s && SPECIAL[s] && tileFor(s);
        if (t && inView(t)) { t.classList.add('ms-src'); name(t.querySelector('.media')); }
      } else if (page === 'detail' && isWork(to)) {
        var s2 = slugOf(location.href);
        if (SPECIAL[s2]) { var hero = heroFor(s2); if (hero && inView(hero)) name(hero); }
      }
    });
    addEventListener('pagereveal', function (e) {    // new page, before its first render
      clearNames();
      if (!e.viewTransition) return;
      var from = window.navigation && navigation.activation && navigation.activation.from && navigation.activation.from.url;
      if (!from) return;
      var el = null, slug;
      if (page === 'detail' && isWork(from)) {
        slug = slugOf(location.href); if (SPECIAL[slug]) el = heroFor(slug);
        if (el) h.classList.add('ms-to-detail');
      } else if (page === 'work') {
        slug = slugOf(from);
        var t = slug && SPECIAL[slug] && tileFor(slug);
        if (t) {
          // the work page reveals groups on scroll; show them now so the tile isn't mid-fade
          d.querySelectorAll('.rv').forEach(function (r) { r.style.transition = 'none'; r.classList.add('in'); });
          if (inView(t)) { el = t.querySelector('.media'); h.classList.add('ms-to-work'); }
        }
      }
      if (!el) return;
      name(el); h.classList.add('ms-morph'); if (SAME[slug]) h.classList.add('ms-same'); if (slug === 'alibi-lounge') h.classList.add('ms-band');
      e.viewTransition.finished.finally(function () {
        clearNames(); h.classList.remove('ms-morph', 'ms-same', 'ms-band', 'ms-to-detail', 'ms-to-work');
        d.querySelectorAll('.rv').forEach(function (r) { r.style.transition = ''; });
      });
    });
  }

  /* ---------- blinds ---------- */
  var flag = null;
  try { flag = JSON.parse(ss.getItem('ms-tx') || 'null'); ss.removeItem('ms-tx'); } catch (e) {}
  var arriving = page === 'work' && VT && !RM && flag && flag.k === 'blinds' && Date.now() - flag.t < 5000;
  if (arriving) h.classList.add('ms-bl-in');
  var bl = null;
  function build() {
    bl = d.createElement('div'); bl.className = 'ms-blinds'; bl.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < N; i++) { var b = d.createElement('i'); b.style.setProperty('--i', i); bl.appendChild(b); }
    d.body.appendChild(bl);
  }
  function unblind() { if (bl) bl.remove(); bl = null; h.classList.remove('ms-bl-shut', 'ms-bl-closed', 'ms-bl-open', 'ms-bl-fade', 'ms-bl-in', 'ms-bl-ready'); }
  function onReady(fn) { if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', fn); else fn(); }
  if (arriving) onReady(function () {
    build(); h.classList.add('ms-bl-closed', 'ms-bl-ready');
    setTimeout(function () {
      h.classList.remove('ms-bl-closed'); h.classList.add('ms-bl-open');
      setTimeout(function () { h.classList.add('ms-bl-fade'); }, 120 + 500 + N * 15);
      setTimeout(unblind, 120 + 500 + N * 15 + 350);
    }, 160);
  });
  if (page === 'splash' && VT && !RM) {
    var busy = false;
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.enter');
      if (!a || busy || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); busy = true;
      build(); bl.offsetHeight; h.classList.add('ms-bl-shut');
      setTimeout(function () {
        try { ss.setItem('ms-tx', JSON.stringify({ k: 'blinds', t: Date.now() })); } catch (x) {}
        location.href = a.href;
      }, 420 + N * 15 + 60);
    });
    // coming back from work.html via the back button restores this page from the bfcache, still shut
    addEventListener('pageshow', function (e) { if (e.persisted) { busy = false; unblind(); } });
  }
  addEventListener('pageshow', function (e) { if (e.persisted) d.querySelectorAll('.tile.ms-src').forEach(function (t) { t.classList.remove('ms-src'); }); });
})();
