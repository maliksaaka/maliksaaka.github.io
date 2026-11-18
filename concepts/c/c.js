const k=document.body.dataset.kind,S=CP.setup(k),C=S.copy;CP.chrome('c',k);
const e=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
document.body.classList.add(k==='music'?'cm':'cp');
document.getElementById('app').innerHTML=
`<section class="blk" aria-label="Now playing"><div class="top"><span>${C.h}</span><span data-idx class="num"></span></div><div class="fit"><h1 data-t data-fit="130,26">${C.idle}</h1></div><p class="meta"><span data-sub></span><span data-date class="num"></span><span data-st>idle</span></p>`+
`<div class="tr"><button class="tb pv" data-act="pv"></button><button class="tb pp" data-act="pp"></button><button class="tb nx" data-act="nx"></button></div><div class="seek" data-bar><i data-fill></i></div><div class="times num"><span data-el>0:00</span><span data-du>--:--</span></div></section>`+
`<section class="lst"><div class="lh"><span>${S.total} ${C.unit}</span><span>${C.bio}</span></div><ol data-follow aria-label="All ${C.unit}">`+S.items.map(it=>`<li class="row" data-i="${it.i}" role="button" tabindex="0" aria-label="${e(it.t)}, ${it.d}"><span class="rn num">${String(it.i+1).padStart(3,'0')}</span><span class="rt clamp">${e(it.t)}</span><span class="rd num">${it.d}</span></li>`).join('')+'</ol></section>';
CP.bind();
