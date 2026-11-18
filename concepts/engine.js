// Concept player engine (adapted from assets/media/player.js). One source at a time.
// Markup hooks: [data-i] items, [data-act=pv|pp|nx], [data-bar] + [data-fill],
// [data-t] [data-sub] [data-date] [data-idx] [data-st] [data-el] [data-du], [data-fit="max,min"].
// ?i=N arms item N (selected, paused, nothing loaded). Audio only starts on user action.
(()=>{
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const mm=s=>isFinite(s)&&s>0?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
const p3=n=>String(n).padStart(3,'0');
const PL='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg>',PA='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg>';
const PV='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1h2v10H1zM11 1v10L4 6z"/></svg>',NX='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M9 1h2v10H9zM1 1v10l7-5z"/></svg>';
const COPY={
 music:{label:'Music',h:'MUSIC',bio:'Producer and DJ, formerly SXYLK, now Malik Saaka.',meta:'2014 to present · Los Angeles / New York',unit:'tracks',idle:'Select a track',artist:'Malik Saaka'},
 podcast:{label:'Podcast',h:'PODCAST',bio:'Host of Subtle Urban Sex Appeal (SUSA).',meta:'Los Angeles / New York',unit:'episodes',idle:'Select an episode',artist:'Subtle Urban Sex Appeal'}
};
const au=new Audio();au.preload='none';
const P={i:-1,loaded:false,t:0,d:0,playing:false,st:'idle'};
let Q=[],AUTO=false,hooks=[],lastI=-2,scw=null,scReady=false,scQ=null,kind='music';
const cur=()=>Q[P.i];
const isK=k=>cur()&&cur().kind===k&&P.loaded;
function fit(){$$('[data-fit]').forEach(el=>{const[mx,mn]=el.dataset.fit.split(',').map(Number),box=el.parentElement;let s=mx;el.style.fontSize=s+'px';while(s>mn&&(el.offsetHeight>box.clientHeight||el.scrollWidth>box.clientWidth)){s-=3;el.style.fontSize=s+'px'}})}
function ui(follow){
 const it=cur(),C=COPY[kind];
 if(P.i!==lastI){lastI=P.i;
  $$('[data-t]').forEach(e=>e.textContent=it?it.t:C.idle);
  $$('[data-sub]').forEach(e=>e.textContent=it?it.sub:C.artist);
  $$('[data-date]').forEach(e=>e.textContent=it?it.d:'');
  $$('[data-idx]').forEach(e=>e.textContent=it?p3(P.i+1)+' / '+Q.length:'--- / '+Q.length);
  $$('[data-i]').forEach(e=>{const on=+e.dataset.i===P.i;e.classList.toggle('on',on);on?e.setAttribute('aria-current','true'):e.removeAttribute('aria-current')});
  fit();hooks.forEach(h=>h(P,it));
  if(follow){const a=document.querySelector('[data-follow] [data-i].on');if(a)a.scrollIntoView({block:'nearest'})}}
 $$('[data-i]').forEach(e=>e.classList.toggle('playing',P.playing&&+e.dataset.i===P.i));
 document.body.dataset.state=P.playing?'playing':'paused';
 $$('[data-st]').forEach(e=>e.textContent=P.st);
 $$('[data-el]').forEach(e=>e.textContent=mm(P.t));
 $$('[data-du]').forEach(e=>e.textContent=P.d?mm(P.d):'--:--');
 const pct=P.d?Math.min(100,P.t/P.d*100):0;
 $$('[data-fill]').forEach(e=>e.style.width=pct+'%');
 $$('[data-bar]').forEach(e=>{e.setAttribute('aria-valuenow',Math.round(pct));e.setAttribute('aria-valuetext',mm(P.t)+(P.d?' of '+mm(P.d):''))});
 $$('[data-act=pp]').forEach(e=>{e.innerHTML=P.playing?PA:PL;e.setAttribute('aria-label',P.playing?'Pause':'Play')})}
function scEnsure(url,cb){if(scw){scReady?cb():(scQ=cb);return}
 const f=document.createElement('iframe');f.allow='autoplay';f.title='Audio';f.setAttribute('aria-hidden','true');f.tabIndex=-1;
 f.style.cssText='position:absolute;width:1px;height:1px;left:-9999px;opacity:0';f.src='https://w.soundcloud.com/player/?url='+encodeURIComponent(url)+'&auto_play=false';document.body.appendChild(f);
 const s=document.createElement('script');s.src='https://w.soundcloud.com/player/api.js';s.onload=()=>{scw=SC.Widget(f);const E=SC.Widget.Events;
  scw.bind(E.READY,()=>{scReady=true;if(scQ){const g=scQ;scQ=null;g()}});
  scw.bind(E.PLAY,()=>{if(!isK('sc'))return scw.pause();au.pause();P.playing=true;P.st='playing';ui()});
  scw.bind(E.PAUSE,()=>{if(isK('sc')){P.playing=false;P.st='paused';ui()}});
  scw.bind(E.FINISH,()=>{if(isK('sc')){P.playing=false;P.st='ended';ui();if(AUTO&&P.i<Q.length-1)step(1)}});
  scw.bind(E.PLAY_PROGRESS,e=>{if(!isK('sc'))return;P.t=e.currentPosition/1000;if(!P.d)scw.getDuration(x=>P.d=x/1000);ui()})};
 s.onerror=()=>{P.st='audio did not load';ui()};document.head.appendChild(s);scQ=cb}
function start(i,follow){const it=Q[i];if(!it)return;
 P.i=i;P.loaded=true;P.t=0;P.d=it.s||0;P.playing=false;P.st='loading';ui(follow);
 if(it.kind==='mp3'){if(scw)scw.pause();au.src=it.u;au.play().catch(()=>{P.st='press play';ui()})}
 else{au.pause();scEnsure(it.u,()=>scw.load(it.u,{auto_play:true,show_comments:false,callback:()=>{scw.setVolume(70);scw.play()}}))}}
function arm(i){const it=Q[i];if(!it)return;P.i=i;P.loaded=false;P.t=0;P.d=it.s||0;P.playing=false;P.st='ready';ui()}
function toggle(){if(P.i<0)return start(0,true);if(!P.loaded)return start(P.i);
 if(cur().kind==='sc'){scw&&(P.playing?scw.pause():scw.play())}else P.playing?au.pause():au.play().catch(()=>{})}
function go(i){if(i===P.i&&P.loaded)toggle();else start(i)}
function step(d){if(Q.length)start(P.i<0?0:(P.i+d+Q.length)%Q.length,true)}
function seekTo(sec){if(!P.loaded||!P.d)return;sec=Math.max(0,Math.min(P.d,sec));P.t=sec;cur().kind==='sc'?scw&&scw.seekTo(sec*1000):(au.currentTime=sec);ui()}
au.ontimeupdate=()=>{if(!isK('mp3'))return;P.t=au.currentTime;P.d=au.duration||P.d;ui()};
au.onloadedmetadata=()=>{if(isK('mp3')){P.d=au.duration||P.d;ui()}};
au.onplay=()=>{if(!isK('mp3'))return au.pause();P.playing=true;P.st='playing';ui()};
au.onpause=()=>{if(isK('mp3')){P.playing=false;P.st='paused';ui()}};
au.onended=()=>{P.playing=false;P.st='ended';ui();if(AUTO&&P.i<Q.length-1)step(1)};
au.onerror=()=>{if(isK('mp3')){P.st='audio did not load';ui()}};
window.CP={
 COPY,
 setup(k){kind=k;const M=window.MEDIA,C=COPY[k];AUTO=k==='music';
  Q=(k==='music'?M.tracks.map(t=>({kind:'sc',u:t.u,t:t.t,d:t.d,s:t.s})):M.episodes.map(t=>({kind:'mp3',u:t.u,t:t.t,d:t.d}))).map((it,i)=>({...it,i,sub:C.artist}));
  return{items:Q,copy:C,total:Q.length}},
 onSelect(h){hooks.push(h)},
 bind(){
  $$('[data-act=pv]').forEach(e=>{e.innerHTML=PV;e.setAttribute('aria-label','Previous');e.onclick=()=>step(-1)});
  $$('[data-act=nx]').forEach(e=>{e.innerHTML=NX;e.setAttribute('aria-label','Next');e.onclick=()=>step(1)});
  $$('[data-act=pp]').forEach(e=>e.onclick=toggle);
  $$('[data-bar]').forEach(b=>{b.setAttribute('role','slider');b.tabIndex=0;b.setAttribute('aria-label','Seek');b.setAttribute('aria-valuemin','0');b.setAttribute('aria-valuemax','100');
   b.onclick=e=>{const r=b.getBoundingClientRect();seekTo((e.clientX-r.left)/r.width*P.d)};
   b.onkeydown=e=>{if(e.key==='ArrowRight'){e.preventDefault();seekTo(P.t+5)}else if(e.key==='ArrowLeft'){e.preventDefault();seekTo(P.t-5)}}});
  document.addEventListener('click',e=>{const r=e.target.closest('[data-i]');if(r)go(+r.dataset.i)});
  document.addEventListener('keydown',e=>{const r=e.target.closest&&e.target.closest('[data-i]');if(r&&e.target===r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();go(+r.dataset.i)}});
  addEventListener('resize',fit);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  const q=new URLSearchParams(location.search).get('i'),n=q===null?NaN:parseInt(q,10);
  ui();if(n>=0&&n<Q.length)arm(n)},
 chrome(c,page){
  const other=page==='music'?'podcast':'music',L=x=>x.toUpperCase();
  document.getElementById('chrome').innerHTML=
  `<div class="mock"><span>Mockup</span><span class="sw" aria-label="Concepts">${['a','b','c','c2','c3'].map(x=>`<a href="../${x}/${page}.html"${x===c?' aria-current="page"':''}>${L(x)}</a>`).join(' ')}</span><a href="../index.html">All concepts</a><a class="live" href="../../${page}/">Live site ${page} &rarr;</a></div>`+
  `<header class="cnav"><a class="mk" href="../../index.html">Malik<br>Saaka</a><nav aria-label="Site"><ul><li><a href="../../index.html">Home</a></li><li><a href="../../projects/">Work</a></li><li><a href="music.html"${page==='music'?' aria-current="page"':''}>Music</a></li><li><a href="podcast.html"${page==='podcast'?' aria-current="page"':''}>Podcast</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header>`}
};
})();
