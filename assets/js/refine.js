/* Live time in Los Angeles, top right. */
(function(){
  var el=document.createElement('div'); el.className='la-clock'; el.setAttribute('aria-label','Current time in Los Angeles');
  var f=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit'});
  function t(){ el.textContent='Los Angeles '+f.format(new Date()); }
  t(); setInterval(t,15000);
  (document.body?Promise.resolve():new Promise(function(r){addEventListener('DOMContentLoaded',r)})).then(function(){document.body.appendChild(el)});
})();
