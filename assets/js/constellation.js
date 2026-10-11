/* Constellation / star chart. Vanilla canvas, no dependencies.
   Stars of varying magnitude drift slowly; small clusters are joined by thin
   constellation lines (minimum spanning tree of each cluster), and stars near the
   cursor link to it and ease toward it. Colour comes from the CSS var --star on the
   hero (falls back to --ink). Sits behind the content, pointer-events off.
   Host: the first [data-constellation] element (else .hero). Optional config on the host:
     data-density="0.5"  star/cluster count multiplier (default 1)
     data-opacity="0.5"  canvas opacity (default 1) */
(function () {
  var hero = document.querySelector('[data-constellation]') || document.querySelector('.hero');
  if (!hero || !window.HTMLCanvasElement || !window.MSStar) return;
  var DENS = parseFloat(hero.getAttribute('data-density')) || 1;
  var OPAC = parseFloat(hero.getAttribute('data-opacity'));
  var cv = document.createElement('canvas');
  cv.className = 'constellation';
  cv.setAttribute('aria-hidden', 'true');
  if (OPAC >= 0 && OPAC <= 1) cv.style.opacity = OPAC;
  hero.insertBefore(cv, hero.firstChild);
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var W = 0, H = 0, dpr = 1, rgb = '0,0,0';
  var field = [], clusters = [], all = [];
  var mouse = { x: -1e4, y: -1e4, on: false };
  var lastDpr = 0, CURSOR = 180, running = false, visible = true, raf = 0, last = 0, T = 0;
  var rnd = Math.random;

  function readColor() {
    var cs = getComputedStyle(hero);
    var v = (cs.getPropertyValue('--star') || cs.getPropertyValue('--ink') || '').trim();
    var m = v.match(/rgba?\(([^)]+)\)/), n;
    if (m) rgb = m[1].split(',').slice(0, 3).map(parseFloat).join(',');
    else if (/^#([0-9a-f]{3}){1,2}$/i.test(v)) {
      if (v.length === 4) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
      n = parseInt(v.slice(1), 16); rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
    }
  }

  // magnitude: many faint specks, some medium, a few bright
  function mag(bright) {
    var u = rnd();
    if (bright || u > 0.93) return { r: 4.2 + rnd() * 2.6, a: 1, b: 1 };       // bright
    if (u > 0.68) return { r: 2.1 + rnd() * 1.2, a: 0.85, b: 0 };              // medium
    return { r: 0.9 + rnd() * 0.8, a: 0.5 + rnd() * 0.25, b: 0 };              // tiny 7-point specks
  }

  // ---- organic 7-pointed star sprites -------------------------------------
  // Each star gets its own shape: 7 rays of random length (0.45–1.0 R), angular
  // jitter, a slight curl on each flank and a random rotation. Rendered once to a
  // small offscreen canvas (at devicePixelRatio) and blitted every frame.
  // star geometry is shared with the cursor: assets/js/star-shape.js (window.MSStar)
  var shape = MSStar.shape, paintStar = MSStar.paint;
  function sprite(p) {
    var S = Math.ceil((p.r * 1.1 + 2) * dpr) * 2, c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d'); g.fillStyle = 'rgb(' + rgb + ')';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintStar(g, S / 2 / dpr, S / 2 / dpr, p.rays, p.r);
    p.spr = c; p.sz = S / dpr;
  }
  var glow = null;
  function glowSprite() {     // generic soft halo, scaled per star
    var S = 128, c = document.createElement('canvas'); c.width = c.height = S;
    var g = c.getContext('2d'), gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(' + rgb + ',0.20)'); gr.addColorStop(0.35, 'rgba(' + rgb + ',0.08)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S); glow = c;
  }
  function eachStar(fn) { field.forEach(fn); clusters.forEach(function (c) { c.st.forEach(fn); }); }
  function rebuild() { glowSprite(); eachStar(sprite); }
  function star(x, y, bright) {
    var m = mag(bright);
    // every star twinkles on its own clock: a faint shimmer at its own speed/phase,
    // plus irregular brighten/dim events (mean gap 2.5–16s per star), sometimes a flare
    var s = { x: x, y: y, r: m.r, a: m.a, bright: m.b, ox: 0, oy: 0,
              sp: 0.00015 + rnd() * 0.0006, ph: rnd() * 6.283, sh: 0.08 + rnd() * 0.14,
              gap: 2500 + rnd() * 13500, ev: null };
    s.rays = shape(m.r);
    s.next = T + expo(s.gap) * rnd();
    return s;
  }
  function expo(mean) { return -Math.log(1 - rnd()) * mean; }
  function twinkle(p) {          // multiplier for alpha (and radius on flares)
    if (!running) return 1;      // static frames (reduced motion, paused): no twinkle
    if (!p.ev && T >= p.next) {
      var flare = rnd() < (p.bright ? 0.18 : 0.08);
      p.ev = { t0: T, dur: (flare ? 1000 : 1300) + rnd() * 2200,
               amp: flare ? 1.0 + rnd() * 0.8 : (rnd() < 0.5 ? -0.65 : 0.6) * (0.5 + rnd() * 0.5), flare: flare };
    }
    var f = 1 + p.sh * Math.sin(T * p.sp * 6.283 + p.ph), g = 0;
    if (p.ev) {
      var u = (T - p.ev.t0) / p.ev.dur;
      if (u >= 1) { p.ev = null; p.next = T + expo(p.gap); }
      else g = p.ev.amp * Math.sin(Math.PI * u) * Math.sin(Math.PI * u);
    }
    p.fl = p.ev && p.ev.flare ? g : 0;
    return Math.max(0.15, f + g);
  }
  function vel() { var a = rnd() * 6.283, s = 0.04 + rnd() * 0.07; return [Math.cos(a) * s, Math.sin(a) * s]; }

  // Prim's MST over a cluster's stars, plus occasionally one closing edge
  function mst(st) {
    var n = st.length, inT = [0], edges = [], used = {};
    while (inT.length < n) {
      var best = null, bd = 1e12;
      for (var i = 0; i < inT.length; i++) for (var j = 0; j < n; j++) {
        if (inT.indexOf(j) > -1) continue;
        var dx = st[inT[i]].dx - st[j].dx, dy = st[inT[i]].dy - st[j].dy, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = [inT[i], j]; }
      }
      edges.push(best); used[best.join('-')] = 1; inT.push(best[1]);
    }
    if (n > 4 && rnd() < 0.45) {                 // one loop, like a real asterism
      var a = 0, b = n - 1; if (!used[a + '-' + b] && !used[b + '-' + a]) edges.push([a, b]);
    }
    return edges;
  }

  function seed() {
    var area = W * H, small = W < 600;
    var nField = Math.round(area / (small ? 5200 : 6500));
    nField = Math.round(Math.max(40, Math.min(nField, small ? 90 : 240)) * DENS);
    var nCl = Math.max(DENS < 1 ? 2 : 3, Math.round(Math.max(3, Math.min(Math.round(area / 150000), small ? 4 : 9)) * DENS));
    field = []; clusters = [];
    for (var i = 0; i < nField; i++) { var s = star(rnd() * W, rnd() * H); s.v = vel(); field.push(s); }
    // place cluster centres on a jittered grid so they spread out
    var cols = Math.ceil(Math.sqrt(nCl * W / H)), rows = Math.ceil(nCl / cols), k = 0;
    var cells = []; for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) cells.push([c, r]);
    cells.sort(function () { return rnd() - 0.5; });
    for (k = 0; k < nCl; k++) {
      var cell = cells[k], cw = W / cols, ch = H / rows;
      var cx = (cell[0] + 0.2 + rnd() * 0.6) * cw, cy = (cell[1] + 0.2 + rnd() * 0.6) * ch;
      var spread = (small ? 55 : 85) + rnd() * (small ? 35 : 70), n = 4 + Math.floor(rnd() * 4), st = [];
      for (var j = 0; j < n; j++) {
        var ang = rnd() * 6.283, d = spread * (0.35 + rnd() * 0.65);
        var s2 = star(0, 0, j === 0); s2.dx = Math.cos(ang) * d; s2.dy = Math.sin(ang) * d * 0.8;
        st.push(s2);
      }
      clusters.push({ cx: cx, cy: cy, v: vel(), st: st, e: mst(st) });
    }
  }

  function resize() {
    var r = hero.getBoundingClientRect();
    var nw = Math.max(1, Math.round(r.width)), nh = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var reseed = !W || Math.abs(nw * nh - W * H) / Math.max(1, W * H) > 0.25;
    if (W && !reseed) {
      var sx = nw / W, sy = nh / H;
      field.forEach(function (p) { p.x *= sx; p.y *= sy; });
      clusters.forEach(function (c) { c.cx *= sx; c.cy *= sy; });
    }
    W = nw; H = nh;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CURSOR = W < 600 ? 130 : 180;
    if (reseed) seed();
    if (reseed || dpr !== lastDpr) { rebuild(); lastDpr = dpr; }
    if (!running) draw(0);
  }

  function wrap(o, m) { if (o.x < -m) o.x += W + 2 * m; else if (o.x > W + m) o.x -= W + 2 * m;
                        if (o.y < -m) o.y += H + 2 * m; else if (o.y > H + m) o.y -= H + 2 * m; }
  function pull(p, k) {
    var tx = 0, ty = 0;
    if (mouse.on) {
      var dx = mouse.x - p.px, dy = mouse.y - p.py, d = Math.sqrt(dx * dx + dy * dy);
      if (d < CURSOR && d > 1) { var f = (1 - d / CURSOR) * 0.2; tx = dx * f; ty = dy * f; }
    }
    p.ox += (tx - p.ox) * 0.06 * k; p.oy += (ty - p.oy) * 0.06 * k;
  }

  function step(dt) {
    var k = dt / 16.67, i, j, c, p, o;
    T += dt;
    for (i = 0; i < field.length; i++) {
      p = field[i]; p.x += p.v[0] * k; p.y += p.v[1] * k; wrap(p, 10);
      p.px = p.x; p.py = p.y; pull(p, k);
    }
    for (i = 0; i < clusters.length; i++) {
      c = clusters[i]; c.cx += c.v[0] * k; c.cy += c.v[1] * k;
      o = { x: c.cx, y: c.cy }; wrap(o, 180); c.cx = o.x; c.cy = o.y;
      for (j = 0; j < c.st.length; j++) { p = c.st[j]; p.px = c.cx + p.dx; p.py = c.cy + p.dy; pull(p, k); }
    }
  }
  function posAll() {   // used for static frames
    field.forEach(function (p) { p.px = p.x; p.py = p.y; });
    clusters.forEach(function (c) { c.st.forEach(function (p) { p.px = c.cx + p.dx; p.py = c.cy + p.dy; }); });
  }

  function dot(p) {
    var k = twinkle(p), a = Math.min(1, p.a * k), fl = running ? (p.fl || 0) : 0;
    var x = p.px + p.ox, y = p.py + p.oy;
    // brightening beyond full opacity shows as a slight swell; flares lengthen the rays
    var sc = 1 + Math.max(0, p.a * k - 1) * 0.35 + 0.55 * fl;
    if (p.bright || fl > 0.15) {     // soft light-grey halo, blooms during a flare
      var hs = p.r * (p.bright ? 5 : 3) * (1 + 1.2 * fl);
      ctx.globalAlpha = Math.min(1, (p.bright ? 0.55 : 0) + 0.9 * fl);
      ctx.drawImage(glow, x - hs, y - hs, hs * 2, hs * 2);
    }
    ctx.globalAlpha = a;
    var d = p.sz * sc;
    ctx.drawImage(p.spr, x - d / 2, y - d / 2, d, d);
    ctx.globalAlpha = 1;
  }

  function draw(dt) {
    if (dt) step(dt); else posAll();
    ctx.clearRect(0, 0, W, H);
    var i, j, c, a, b;
    ctx.lineWidth = 0.6; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(' + rgb + ',0.3)';
    ctx.beginPath();
    for (i = 0; i < clusters.length; i++) {
      c = clusters[i];
      for (j = 0; j < c.e.length; j++) {
        a = c.st[c.e[j][0]]; b = c.st[c.e[j][1]];
        ctx.moveTo(a.px + a.ox, a.py + a.oy); ctx.lineTo(b.px + b.ox, b.py + b.oy);
      }
    }
    ctx.stroke();
    if (mouse.on) {
      ctx.lineWidth = 0.6;
      var near = [];
      for (i = 0; i < field.length; i++) near.push(field[i]);
      for (i = 0; i < clusters.length; i++) for (j = 0; j < clusters[i].st.length; j++) near.push(clusters[i].st[j]);
      for (i = 0; i < near.length; i++) {
        a = near[i]; var dx = a.px + a.ox - mouse.x, dy = a.py + a.oy - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < CURSOR) {
          ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.28 * (1 - d / CURSOR)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(a.px + a.ox, a.py + a.oy); ctx.stroke();
        }
      }
    }
    for (i = 0; i < field.length; i++) dot(field[i]);
    for (i = 0; i < clusters.length; i++) for (j = 0; j < clusters[i].st.length; j++) dot(clusters[i].st[j]);
  }

  function loop(t) { var dt = last ? Math.min(t - last, 50) : 16.67; last = t; draw(dt); raf = requestAnimationFrame(loop); }
  function start() { if (running || (reduce && reduce.matches) || document.hidden || !visible) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function sync() { if ((reduce && reduce.matches) || document.hidden || !visible) { stop(); draw(0); } else start(); }

  function setPt(e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; if (!running) draw(0); }
  hero.addEventListener('pointermove', setPt, { passive: true });
  hero.addEventListener('pointerdown', setPt, { passive: true });
  hero.addEventListener('pointerleave', function () { mouse.on = false; if (!running) draw(0); });
  hero.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') mouse.on = false; });
  hero.addEventListener('pointercancel', function () { mouse.on = false; });

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  if (reduce) { if (reduce.addEventListener) reduce.addEventListener('change', sync); else if (reduce.addListener) reduce.addListener(sync); }
  var rt; function later() { clearTimeout(rt); rt = setTimeout(resize, 120); }
  window.addEventListener('resize', later);
  if ('ResizeObserver' in window) new ResizeObserver(later).observe(hero);   // host height can change (e.g. hero image loads)
  new MutationObserver(function () { readColor(); rebuild(); if (!running) draw(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] });

  readColor(); resize(); sync();
})();
