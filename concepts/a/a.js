const k=document.body.dataset.kind,S=CP.setup(k),C=S.copy;CP.chrome('a',k);
const e=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const tr='<div class="tr"><button class="tb" data-act="pv"></button><button class="tb" data-act="pp"></button><button class="tb" data-act="nx"></button><div class="seekwrap"><div class="seek" data-bar><i data-fill></i></div><div class="times num"><span data-el>0:00</span><span data-du>--:--</span></div></div></div>';
document.getElementById('app').innerHTML=
`<section class="ahead"><h1>${C.h}</h1><p>${C.bio}<span>${C.meta} &middot; ${S.total} ${C.unit}</span></p></section>`+
`<div class="mosaic" role="list" aria-label="All ${C.unit}"><section class="now c0" id="now" aria-label="Now playing"><div class="top"><span data-st>idle</span><span data-idx class="num"></span></div><div class="fit"><h2 data-t data-idle data-fit="120,26">${C.idle}</h2></div><p class="meta"><span data-sub></span><span data-date class="num"></span></p>${tr}</section>`+
S.items.map(it=>`<div class="tile c${it.i%6}" role="listitem"><div class="tin" data-i="${it.i}" role="button" tabindex="0" aria-label="${e(it.t)}, ${it.d}"><span class="tn num">${String(it.i+1).padStart(3,'0')}</span><b class="clamp">${e(it.t)}</b><span class="td num">${it.d}</span></div></div>`).join('')+'</div>';
const now=document.getElementById('now');
CP.onSelect((P,it)=>{now.className='now c'+(it?it.i%6:0)});
CP.bind();
