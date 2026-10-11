/* Shared organic 7-pointed star geometry (used by constellation.js and star-cursor.js).
   shape(R) -> rays; trace(g, cx, cy, rays, R) builds the outline path; paint() fills it plus a solid core. */
window.MSStar = window.MSStar || (function () {
  var rnd = Math.random, TAU = Math.PI * 2;
  function shape(R) {
    // 7 rays of random length (0.45-1.0 R), angular jitter, slight curl, random rotation
    var rot = rnd() * TAU, rays = [], step = TAU / 7;
    for (var i = 0; i < 7; i++) rays.push({
      a: rot + i * step + (rnd() - 0.5) * step * 0.32,
      L: R * (0.45 + rnd() * 0.55),
      w: 0.16 + rnd() * 0.1,
      c: (rnd() - 0.5) * 0.5
    });
    return rays;
  }
  function trace(g, cx, cy, rays, R) {
    for (var i = 0; i < 7; i++) {
      var r = rays[i], n = rays[(i + 1) % 7];
      var na = n.a < r.a ? n.a + TAU : n.a, va = (r.a + na) / 2, vr = R * r.w;
      if (i === 0) {
        var pa = rays[6].a > r.a ? rays[6].a - TAU : rays[6].a, pva = (pa + r.a) / 2;
        g.moveTo(cx + Math.cos(pva) * R * rays[6].w, cy + Math.sin(pva) * R * rays[6].w);
      }
      var ca = r.a - 0.22 + r.c * 0.25, cb = r.a + 0.22 + r.c * 0.25, cr = r.L * 0.45;
      g.quadraticCurveTo(cx + Math.cos(ca) * cr, cy + Math.sin(ca) * cr, cx + Math.cos(r.a) * r.L, cy + Math.sin(r.a) * r.L);
      g.quadraticCurveTo(cx + Math.cos(cb) * cr, cy + Math.sin(cb) * cr, cx + Math.cos(va) * vr, cy + Math.sin(va) * vr);
    }
    g.closePath();
  }
  function paint(g, cx, cy, rays, R) {
    g.beginPath(); trace(g, cx, cy, rays, R); g.fill();
    g.beginPath(); g.arc(cx, cy, R * 0.2, 0, TAU); g.fill();
  }
  return { shape: shape, trace: trace, paint: paint };
})();
