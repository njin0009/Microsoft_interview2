(function(S){
  var motion=S.motion,clamp=S.clamp,ease=S.ease,nav=document.querySelector('.nav');

  // journey: pin the band and turn vertical scroll into sideways travel. A "front" sweeps across the
  // viewport; the line draws up to it and each release's connector, dot and text rise in as it passes.
  var jsec=document.getElementById('path'),jpin=jsec.querySelector('.j-pin'),jtrack=jsec.querySelector('.j-track'),
      jline=jsec.querySelector('.j-line'),jaxis=jsec.querySelector('.j-axis'),jitems=[].slice.call(jsec.querySelectorAll('.j-item')),jdist=0,jtick=false;
  function jScrub(){
    jtick=false;
    var navh=nav.offsetHeight,r=jsec.getBoundingClientRect(),total=jsec.offsetHeight-(innerHeight-navh);
    var p=total>0?clamp((navh-r.top)/total):0;
    jtrack.style.transform='translate3d('+(-jdist*p).toFixed(1)+'px,0,0)';
    jsec.style.setProperty('--jp',p.toFixed(4));
    var reach=innerWidth*(.72+.28*p)-jline.getBoundingClientRect().left,lw=jline.offsetWidth;
    jaxis.style.setProperty('--lw',clamp(reach/lw).toFixed(4));
    jaxis.style.setProperty('--end',reach>=lw?1:0);
    jitems.forEach(function(it){
      var lp=clamp((reach-it.offsetLeft)/(innerWidth*.28));
      it.style.setProperty('--c',clamp(lp*2.2).toFixed(3));
      it.style.setProperty('--d',clamp(lp*3).toFixed(3));
      it.style.setProperty('--t',ease(clamp(lp*1.6-.25)).toFixed(3));
      it.style.setProperty('--t2',ease(clamp(lp*1.6-.45)).toFixed(3));
    });
  }
  function jLayout(){
    var navh=nav.offsetHeight;
    jsec.style.setProperty('--navh',navh+'px');
    jtrack.style.transform='none';
    jdist=Math.max(0,jtrack.scrollWidth-jpin.clientWidth);
    jsec.style.height=Math.round(innerHeight-navh+jdist*1.15)+'px';
    jScrub();
  }
  if(motion){
    jsec.classList.add('j-live');
    jLayout();
    addEventListener('resize',jLayout);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(jLayout);
    addEventListener('scroll',function(){if(!jtick){jtick=true;requestAnimationFrame(jScrub);}},{passive:true});
  }

  // release stories: each journey item opens the dialog on its panel; arrows / arrow keys step through
  var dlg=document.getElementById('ver-dialog'),panels=[].slice.call(dlg.querySelectorAll('.ver-panel')),
      vcount=document.getElementById('ver-count'),vcur=-1,vfrom=null;
  function showVer(i){
    i=(i+panels.length)%panels.length;
    panels.forEach(function(p,k){p.hidden=k!==i;p.classList.remove('show');});
    if(motion&&i!==vcur){void panels[i].offsetWidth;panels[i].classList.add('show');}
    vcur=i;vcount.textContent=(i+1)+' / '+panels.length;
  }
  jitems.forEach(function(it){
    it.addEventListener('click',function(){
      vfrom=it;showVer(+it.getAttribute('data-i'));
      if(dlg.showModal){if(!dlg.open)dlg.showModal();}else dlg.setAttribute('open','');
    });
  });
  function closeVer(){if(dlg.close)dlg.close();else dlg.removeAttribute('open');}
  document.getElementById('ver-close').addEventListener('click',closeVer);
  dlg.addEventListener('click',function(e){if(e.target===dlg)closeVer();});
  dlg.addEventListener('close',function(){if(vfrom)vfrom.focus({preventScroll:true});});
  dlg.addEventListener('keydown',function(e){var d={ArrowRight:1,ArrowLeft:-1}[e.key];if(d){e.preventDefault();showVer(vcur+d);}});
  document.getElementById('ver-prev').addEventListener('click',function(){showVer(vcur-1);});
  document.getElementById('ver-next').addEventListener('click',function(){showVer(vcur+1);});
})(window.Site);
