const k=document.body.dataset.kind,S=CP.setup(k),C=S.copy;CP.chrome('b',k);
const e=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
document.getElementById('app').innerHTML=
`<section class="nowb" aria-label="Now playing"><div class="top"><span>${C.h} / ${S.total} ${C.unit}</span><span data-st>idle</span></div><div class="bio">${C.bio}<br>${C.meta}</div><div class="fit"><h1 data-t data-fit="240,28">${C.idle}</h1></div><p class="meta"><span data-sub></span><span data-date class="num"></span><span data-idx class="num"></span></p>`+
`<div class="tr"><button class="tb" data-act="pv"></button><button class="tb pp" data-act="pp"></button><button class="tb" data-act="nx"></button><div class="seekwrap"><div class="seek" data-bar><i data-fill></i></div><div class="times num"><span data-el>0:00</span><span data-du>--:--</span></div></div></div></section>`+
`<ol class="bands" data-follow aria-label="All ${C.unit}" tabindex="-1">`+S.items.map(it=>`<li class="band c${it.i%6}" data-i="${it.i}" role="button" tabindex="0" aria-label="${e(it.t)}, ${it.d}"><span class="bn num">${String(it.i+1).padStart(3,'0')}</span><span class="bt clamp">${e(it.t)}</span><span class="bd num">${it.d}</span></li>`).join('')+'</ol>';
CP.bind();
