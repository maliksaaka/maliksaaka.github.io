// Shared player: one source at a time.
(()=>{const $=s=>document.querySelector(s),mm=s=>isFinite(s)&&s>=0?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
const au=new Audio();au.preload='none';const P={kind:null,key:null,t:0,d:0,playing:false,i:-1};let Q=[];
const PL='<svg viewBox="0 0 12 12"><path d="M2 1l9 5-9 5z"/></svg>',PA='<svg viewBox="0 0 12 12"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg>';
function ui(){$('#fill').style.width=(P.d?P.t/P.d*100:0)+'%';$('#tm').textContent=mm(P.t)+' / '+mm(P.d);
 $('#pp').innerHTML=P.playing?PA:PL;$('#pp').setAttribute('aria-label',P.playing?'Pause':'Play');
 document.querySelectorAll('[data-play]').forEach(r=>r.classList.toggle('on',r.dataset.key===P.key))}
function st(s){$('#st').textContent=s}
let scw=null,scReady=false,scQ=null;
function scEnsure(url,cb){if(scw){scReady?cb():(scQ=cb);return}
 const f=document.createElement('iframe');f.allow='autoplay';f.title='Audio';f.setAttribute('aria-hidden','true');f.tabIndex=-1;
 f.style.cssText='position:absolute;width:1px;height:1px;left:-9999px;opacity:0';f.src='https://w.soundcloud.com/player/?url='+encodeURIComponent(url)+'&auto_play=false';document.body.appendChild(f);
 const s=document.createElement('script');s.src='https://w.soundcloud.com/player/api.js';s.onload=()=>{scw=SC.Widget(f);const E=SC.Widget.Events;
  scw.bind(E.READY,()=>{scReady=true;if(scQ){const g=scQ;scQ=null;g()}});
  scw.bind(E.PLAY,()=>{if(P.kind!=='sc')return scw.pause();au.pause();P.playing=true;st('playing');ui()});
  scw.bind(E.PAUSE,()=>{if(P.kind==='sc'){P.playing=false;st('paused');ui()}});
  scw.bind(E.FINISH,()=>{if(P.kind==='sc'){P.playing=false;st('ended');ui();if(window.PLAYER_AUTO&&P.i<Q.length-1)step(1)}});
  scw.bind(E.PLAY_PROGRESS,e=>{if(P.kind!=='sc')return;P.t=e.currentPosition/1000;if(!P.d)scw.getDuration(x=>P.d=x/1000);ui()})};
 s.onerror=()=>st('audio did not load');document.head.appendChild(s);scQ=cb}
function play(i){const it=Q[i];if(!it)return;if(P.key===it.key){toggle();return}
 P.i=i;P.key=it.key;P.t=0;P.d=it.s||0;P.playing=false;$('#npt').textContent=it.t;$('#nps').textContent=it.sub||'';st('loading');ui();
 if(it.kind==='mp3'){if(scw)scw.pause();P.kind='mp3';au.src=it.u;au.play().catch(()=>st('press play'))}
 else{au.pause();P.kind='sc';scEnsure(it.u,()=>scw.load(it.u,{auto_play:true,show_comments:false,callback:()=>{scw.setVolume(70);scw.play()}}))}}
function toggle(){if(P.i<0)return play(0);if(P.kind==='sc'){scw&&(P.playing?scw.pause():scw.play())}else P.playing?au.pause():au.play().catch(()=>{})}
function step(d){if(Q.length)play((P.i+d+Q.length)%Q.length)}
au.ontimeupdate=()=>{if(P.kind!=='mp3')return;P.t=au.currentTime;P.d=au.duration||P.d;ui()};
au.onplay=()=>{if(P.kind!=='mp3')return au.pause();P.playing=true;st('playing');ui()};
au.onpause=()=>{if(P.kind==='mp3'){P.playing=false;st('paused');ui()}};au.onended=()=>{P.playing=false;st('ended');ui();if(window.PLAYER_AUTO&&P.i<Q.length-1)step(1)};au.onerror=()=>P.kind==='mp3'&&st('audio did not load');
window.PLAYER={set(q){Q=q},play,toggle,step,state:P};
document.addEventListener('DOMContentLoaded',()=>{$('#pp').onclick=toggle;$('#pv').onclick=()=>step(-1);$('#nx').onclick=()=>step(1);
 $('#bar').onclick=e=>{const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width;if(!P.d)return;P.kind==='sc'?scw.seekTo(x*P.d*1000):(au.currentTime=x*P.d)};
 document.addEventListener('click',e=>{const r=e.target.closest('[data-play]');if(r)play(+r.dataset.play)});
 document.addEventListener('keydown',e=>{const r=e.target.closest&&e.target.closest('[data-play]');if(r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();play(+r.dataset.play)}});
 document.addEventListener('click',e=>{const y=e.target.closest('button.yt');if(!y)return;y.outerHTML='<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/'+y.dataset.id+'" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="'+y.dataset.c+'"></iframe></div>';au.pause();scw&&scw.pause()});
 const fd=document.querySelectorAll('.fd'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(RM||!('IntersectionObserver'in window))fd.forEach(x=>x.classList.add('in'));else{const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{rootMargin:'0px 0px -5% 0px'});fd.forEach(x=>io.observe(x))}
 ui()})})();
