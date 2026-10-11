/* Star-chart cursor. A small organic 7-pointed star replaces the cursor and leaves a
   fading trail of faint linked points; over links/buttons it grows and gains a thin ring.
   Fine pointers only; touch and prefers-reduced-motion keep the native cursor.
   One fixed canvas on top (pointer-events none), one rAF loop that idles when nothing moves.
   Drawn in white with mix-blend-mode:difference, so it reads black on white and light on dark photos.
   Needs assets/js/star-shape.js (window.MSStar). */
(function () {
  var mm = window.matchMedia;
  if (!mm || !window.MSStar || !window.HTMLCanvasElement) return;
  var reduce = mm('(prefers-reduced-motion: reduce)'), fine = mm('(hover: hover) and (pointer: fine)');
  if (reduce.matches || !fine.matches) return;

  var root = document.documentElement;
  var css = document.createElement('style');
  css.textContent =
    'html.sc,html.sc *{cursor:none!important}' +
    'html.sc input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]),html.sc textarea,html.sc select,html.sc [contenteditable=""],html.sc [contenteditable=true]{cursor:auto!important}' +
    '#star-cursor{position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;pointer-events:none;display:block;mix-blend-mode:difference}';
  document.head.appendChild(css);

  var cv = document.createElement('canvas');
  cv.id = 'star-cursor'; cv.setAttribute('aria-hidden', 'true');
  var g = cv.getContext('2d');
  if (!g) return;
  document.body.appendChild(cv);

  var W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener('resize', size);

  var R = 7, rays = MSStar.shape(R), pts = [], LIFE = 1600, GAP = 34;
  var m = { x: -100, y: -100, on: false }, s = { x: -100, y: -100 }, lastP = null, rot = 0, hot = 0, hk = 0;
  var raf = 0, dead = false, lastMove = 0, nearFrame = false, frames = document.getElementsByTagName('iframe');
  // Cross-origin embeds swallow pointer events, so the page may never hear that the pointer
  // went inside one. If the last move was close to an iframe and moves stop, hide the star.
  function nearIframe(x, y) {
    for (var i = 0; i < frames.length; i++) {
      var r = frames[i].getBoundingClientRect();
      if (r.width && x > r.left - 48 && x < r.right + 48 && y > r.top - 48 && y < r.bottom + 48) return true;
    }
    return false;
  }
  var TEXT = 'input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]),textarea,select,[contenteditable=""],[contenteditable=true]';

  function show(on) {           // the native cursor is hidden only while the star is drawn
    m.on = on; root.classList.toggle('sc', on);
    if (!on) lastP = null;
    kick();
  }
  function kick() { if (!raf && !dead) raf = requestAnimationFrame(frame); }
  function fail() {             // anything goes wrong: give the native cursor back for good
    dead = true; cancelAnimationFrame(raf); raf = 0;
    root.classList.remove('sc'); if (cv.parentNode) cv.parentNode.removeChild(cv);
  }

  addEventListener('pointermove', function (e) {
    if (dead || e.pointerType !== 'mouse') return;
    var t = e.target && e.target.closest ? e.target : null;
    var under = document.elementFromPoint(e.clientX, e.clientY);      // events can retarget at an iframe's edge
    if (under && under.tagName === 'IFRAME') t = under;
    if (t && (t.tagName === 'IFRAME' || t.closest(TEXT))) { if (m.on) show(false); return; }  // native cursor in iframes / text fields
    if (!m.on) { s.x = e.clientX; s.y = e.clientY; show(true); }
    m.x = e.clientX; m.y = e.clientY; lastMove = performance.now(); nearFrame = nearIframe(m.x, m.y);
    hot = t && t.closest('a,button,[role=button],label,summary') ? 1 : 0;
    if (!lastP || Math.hypot(m.x - lastP.x, m.y - lastP.y) > GAP) {
      // drop a chart point slightly off the path, so the trail reads as stars, not a line
      lastP = { x: m.x + (Math.random() - .5) * 14, y: m.y + (Math.random() - .5) * 14, t: performance.now(), r: .8 + Math.random() * 1.4 };
      pts.push(lastP);
    }
    kick();
  }, { passive: true });
  // pointer leaves the window, or focus moves into an embed: hide the star
  document.addEventListener('pointerover', function (e) {
    var u = document.elementFromPoint(e.clientX, e.clientY);
    if (m.on && ((e.target && e.target.tagName === 'IFRAME') || (u && u.tagName === 'IFRAME'))) show(false);
  }, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && m.on) show(false); });
  addEventListener('blur', function () { if (m.on) show(false); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && m.on) show(false); });

  function frame(t) {
    raf = 0;
    try {
      g.clearRect(0, 0, W, H);
      while (pts.length && t - pts[0].t > LIFE) pts.shift();
      g.lineWidth = .6; g.lineCap = 'round';
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], al = Math.max(0, 1 - (t - a.t) / LIFE);
        g.strokeStyle = 'rgba(255,255,255,' + (.34 * al).toFixed(3) + ')';
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
      for (i = 0; i < pts.length; i++) {
        var p = pts[i], al2 = Math.max(0, 1 - (t - p.t) / LIFE);
        g.fillStyle = 'rgba(255,255,255,' + (.6 * al2).toFixed(3) + ')';
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
      }
      var moving = false;
      if (m.on && nearFrame && t - lastMove > 90) show(false);
      if (m.on) {
        s.x += (m.x - s.x) * .5; s.y += (m.y - s.y) * .5;
        hk += (hot - hk) * .15; rot += .004 + hk * .02;
        g.save(); g.translate(s.x, s.y); g.rotate(rot); var sc = 1 + hk * .5; g.scale(sc, sc);
        g.fillStyle = '#fff'; MSStar.paint(g, 0, 0, rays, R); g.restore();
        if (hk > .02) { g.strokeStyle = 'rgba(255,255,255,' + (.3 * hk).toFixed(3) + ')'; g.beginPath(); g.arc(s.x, s.y, 16, 0, 6.283); g.stroke(); }
        moving = true;   // the star slowly rotates while visible
      }
      if (moving || pts.length) raf = requestAnimationFrame(frame);
    } catch (err) { fail(); if (window.console) console.warn('star-cursor disabled:', err); }
  }
  if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) fail(); });
})();
