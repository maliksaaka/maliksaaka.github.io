const k=document.body.dataset.kind,S=CP.setup(k),C=S.copy;CP.chrome('c3',k);
const e=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
document.body.classList.add(k==='music'?'cm':'cp');
document.getElementById('app').innerHTML=
`<div class="unit"><section class="blk" aria-label="Now playing"><div class="top num"><span data-idx></span><span data-date></span></div><div class="mid"><h1 data-t>${C.idle}</h1></div>`+
`<div class="ctl"><div class="tr"><button class="tb pv" data-act="pv"></button><button class="tb pp" data-act="pp"></button><button class="tb nx" data-act="nx"></button></div><div class="seek" data-bar><i data-fill></i></div><div class="times num"><span data-el>0:00</span><span data-du>--:--</span></div></div></section>`+
`<section class="lst" aria-label="All ${C.unit}"><ol data-follow>`+S.items.map(it=>`<li class="row" data-i="${it.i}" role="button" tabindex="0" aria-label="${e(it.t)}, ${it.d}"><span class="rn num">${String(it.i+1).padStart(3,'0')}</span><span class="rt">${e(it.t)}</span><span class="rd num">${it.d}</span></li>`).join('')+'</ol></section></div>';
// Title: one word per line when 6 words or fewer, otherwise a clamped paragraph. Auto-fit shrinks the type to the box.
function fitTitle(){
 const h=document.querySelector('.blk h1'),box=h.parentElement,m=matchMedia('(max-width:900px)').matches;
 const words=h.textContent.trim().split(/\s+/).filter(Boolean).length,stack=words<=6;
 h.classList.toggle('stack',stack);
 let s=stack?(m?24:52):(m?18:30);const mn=m?12:16;
 h.style.fontSize=s+'px';
 while(s>mn&&(h.offsetHeight>box.clientHeight+0.5||h.scrollWidth>box.clientWidth+0.5)){s-=1;h.style.fontSize=s+'px'}
}
CP.onSelect(fitTitle);
addEventListener('resize',fitTitle);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitTitle);
CP.bind();
fitTitle();
