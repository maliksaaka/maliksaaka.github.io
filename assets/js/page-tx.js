/* Page transitions: one simple fade. Load synchronously in <head>.
   Leaving: the page fades out (250ms). Arriving: the page fades in (400ms). Same easing for both.
   Reduced motion turns it off. */
(function () {
  var d = document, h = d.documentElement;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM) return;
  var EASE = 'cubic-bezier(.22,.61,.36,1)';
  var st = d.createElement('style');
  st.textContent =
    'html.pt-in body{opacity:0}' +
    'html.pt-on body{opacity:1;transition:opacity 400ms ' + EASE + '}' +
    'html.pt-out body{opacity:0!important;transition:opacity 250ms ' + EASE + '!important}';
  d.head.appendChild(st);
  h.classList.add('pt-in');
  function show() { requestAnimationFrame(function () { h.classList.add('pt-on'); h.classList.remove('pt-in', 'pt-out'); }); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', show); else show();
  // back/forward cache: never come back to a faded-out page
  addEventListener('pageshow', function (e) { if (e.persisted) { h.classList.remove('pt-out', 'pt-in'); h.classList.add('pt-on'); } });
  d.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return; // in-page hash links
    if (!/\.html$|\/$/.test(u.pathname)) return; // files such as PDFs
    e.preventDefault();
    h.classList.add('pt-out');
    setTimeout(function () { location.href = u.href; }, 250);
  });
})();
