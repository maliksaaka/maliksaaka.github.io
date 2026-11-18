const k=document.body.dataset.kind,S=CP.setup(k),C=S.copy;CP.chrome('c2',k);
const e=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
document.body.classList.add(k==='music'?'cm':'cp');
document.getElementById('app').innerHTML=
`<section class="blk" aria-label="Now playing"><span data-idx class="num"></span><div class="mid"><h1 data-t>${C.idle}</h1><p data-date class="num"></p></div>`+
`<div class="ctl"><div class="tr"><button class="tb pv" data-act="pv"></button><button class="tb pp" data-act="pp"></button><button class="tb nx" data-act="nx"></button></div><div class="seek" data-bar><i data-fill></i></div><div class="times num"><span data-el>0:00</span><span data-du>--:--</span></div></div></section>`+
`<section class="lst"><p class="lh">${S.total} ${C.unit}</p><ol data-follow aria-label="All ${C.unit}">`+S.items.map(it=>`<li class="row" data-i="${it.i}" role="button" tabindex="0" aria-label="${e(it.t)}, ${it.d}"><span class="rn num">${String(it.i+1).padStart(3,'0')}</span><span class="rt clamp">${e(it.t)}</span><span class="rd num">${it.d}</span></li>`).join('')+'</ol></section>';
CP.bind();
