/* Top-right signature: optional "Currently:" status + live time in Los Angeles. */
(function(){
  // Malik: set this to one short line (e.g. what you are working on). Leave empty to hide it.
  var CURRENTLY = '';

  var el=document.createElement('div'); el.className='la-clock';
  if (CURRENTLY) { var c=document.createElement('span'); c.className='la-now'; c.textContent='Currently: '+CURRENTLY; el.appendChild(c); }
  var t=document.createElement('span'); t.setAttribute('aria-label','Current time in Los Angeles'); el.appendChild(t);
  var f=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit'});
  function tick(){ t.textContent='Los Angeles '+f.format(new Date()); }
  tick(); setInterval(tick,15000);
  (document.body?Promise.resolve():new Promise(function(r){addEventListener('DOMContentLoaded',r)})).then(function(){document.body.appendChild(el)});
})();

/* Home: soft light that follows the cursor across the headline (fine pointers only). */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  addEventListener('DOMContentLoaded', function(){
    var h=document.querySelector('.intro h1'); if(!h) return;
    h.classList.add('lit-live');
    var x=50,y=50,raf=0;
    function paint(){ raf=0; h.style.setProperty('--lx',x+'%'); h.style.setProperty('--ly',y+'%'); }
    addEventListener('pointermove', function(e){
      var r=h.getBoundingClientRect();
      x=((e.clientX-r.left)/r.width*100).toFixed(1); y=((e.clientY-r.top)/r.height*100).toFixed(1);
      if(!raf) raf=requestAnimationFrame(paint);
    }, {passive:true});
  });
})();

/* Work: small preview image floats with the cursor over Special Projects tiles (desktop only). */
(function(){
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SRC = {'mugler':'assets/hero/mugler.jpg','alibi-lounge':'assets/alibi-lounge-tile.jpg','sxylk':'assets/hero/sxylk.jpg'};
  addEventListener('DOMContentLoaded', function(){
    if (!document.getElementById('groups')) return;
    var box=document.createElement('div'); box.className='peek'; box.setAttribute('aria-hidden','true');
    var img=document.createElement('img'); img.alt=''; img.decoding='async'; box.appendChild(img); document.body.appendChild(box);
    var cur=null, x=0, y=0, raf=0;
    function place(){ raf=0; box.style.transform='translate3d('+(x+24)+'px,'+(y+24)+'px,0)'; }
    document.addEventListener('pointermove', function(e){
      var a=e.target.closest && e.target.closest('.grid.duo a.tile');
      var slug=a && (a.getAttribute('href')||'').split('c=')[1];
      if (slug && SRC[slug]) {
        if (cur!==slug) { cur=slug; img.src=SRC[slug]; }   // loaded only on first hover
        box.classList.add('on');
      } else if (cur) { cur=null; box.classList.remove('on'); }
      x=e.clientX; y=e.clientY; if(!raf) raf=requestAnimationFrame(place);
    }, {passive:true});
    if (RM) box.classList.add('rm');
  });
})();
