(function(S){
  var root=S.root,motion=S.motion,clamp=S.clamp,ease=S.ease,easeInOut=S.easeInOut,lerp=S.lerp;

  // cover: the page scrolls normally while the cover is pinned; scroll progress (eased) drives the bloom or
  // video, the title blur-out, the six habits, the final line and the Microsoft logo hand-off. Nothing hijacks the wheel or locks the body.
  var cover=document.getElementById('cover'),cnav=document.querySelector('.nav'),
      cvid=cover.querySelector('.c-video'),ctitle=cover.querySelector('.c-title'),
      cbloom=cover.querySelector('.c-bloom'),cpetals=[].slice.call(cbloom.querySelectorAll('.petal')),clabs=[].slice.call(cbloom.querySelectorAll('.h-lab')),
      chabs=[].slice.call(cover.querySelectorAll('.c-hab')),cfinal=cover.querySelector('.c-final'),chint=cover.querySelector('.c-hint'),
      clogo=cover.querySelector('.c-logo'),clg=cover.querySelector('.c-lg'),csq=[].slice.call(cover.querySelectorAll('.c-sq')),
      cword=cover.querySelector('.c-word'),cskip=cover.querySelector('.c-skip'),cpin=cover.querySelector('.c-pin'),
      cnavsvg=document.querySelector('.ms-sq'),cmark=document.querySelector('.ms-mark'),
      cdur=0,cseeking=false,cpending=null,ctarget=0,ccur=0,crun=false,con=-2,carrived=false,
      cwx=0,cfly={x:0,y:0,s:1},csx=0,ccy=0,ctrail=null,cstars=[];
  // landscape screens: during the habits the bloom slides right and the text gets the dark left side;
  // portrait screens keep the bloom centred and put the text below it
  var cshift=0;
  function cLayout(){
    var side=innerWidth>680&&innerWidth>=innerHeight*1.15;
    cover.classList.toggle('c-side',side);
    cshift=0;
    if(side){
      var bw=cbloom.offsetWidth*1.15,target=innerWidth-bw/2-innerWidth*.03;
      cshift=Math.min(Math.max(0,target-innerWidth/2),innerWidth*.2);
      var left=innerWidth/2+cshift-bw/2;
      cover.style.setProperty('--tw',Math.max(240,Math.round(left-Math.max(24,innerWidth*.06)-28))+'px');
    }
    var gap=parseFloat(getComputedStyle(clogo).columnGap)||0,b=clg.offsetWidth;
    cwx=(cword.offsetWidth+gap)/2;
    // squares centre relative to the pin when the logo sits centred with its wordmark out
    var navh=cnav.offsetHeight,cy=navh+cpin.clientHeight/2,lw=clogo.offsetWidth;
    clogo.style.top=cy+'px';
    var sx=innerWidth/2-lw/2+b/2;
    csx=sx;ccy=cy;
    var nr=cmark.getBoundingClientRect(),vr=cnav.getBoundingClientRect(); // the mark box, not the (transformed) svg
    cfly={x:nr.left+nr.width/2-sx,y:(nr.top-vr.top)+nr.height/2-cy,s:nr.width/b};
  }
  // clicking a petal (not just its words) jumps to that habit's card
  cpetals.forEach(function(pe,k){pe.addEventListener('click',function(){clabs[k].click();});});
  function cNav(){root.style.setProperty('--navh',cnav.offsetHeight+'px');}
  cNav();
  cvid.addEventListener('error',function(){cvid.remove();cdur=0;});
  cvid.addEventListener('loadeddata',function(){cdur=cvid.duration||0;cover.classList.add('has-video');if(!motion)cvid.currentTime=cdur*.92;});
  cvid.addEventListener('seeked',function(){cseeking=false;if(cpending!==null){var t=cpending;cpending=null;cseeking=true;cvid.currentTime=t;}});
  try{var cplay=cvid.play();if(cplay&&cplay.then)cplay.then(function(){cvid.pause();}).catch(function(){});}catch(e){} // iOS only buffers after a play()
  function cSeek(t){if(cseeking){cpending=t;return;}cseeking=true;cvid.currentTime=t;}
  function cFocus(el,t,dy){
    el.style.opacity=t.toFixed(3);
    el.style.transform='translateY('+((1-t)*dy).toFixed(1)+'px) scale('+(.96+.04*t).toFixed(4)+')';
    el.style.filter=t>.995?'none':'blur('+((1-t)*10).toFixed(1)+'px)';
  }
  function cArc(t){
    var cx=cfly.x*.05+innerWidth*.14,cy2=cfly.y*.95-40,u=1-t;
    return {x:2*u*t*cx+t*t*cfly.x,y:2*u*t*cy2+t*t*cfly.y};
  }
  function cRender(){
    var p=ccur;
    cover.style.setProperty('--cp',p.toFixed(4));
    cFocus(ctitle,1-clamp(p/.14),-24);
    // timeline: title 0–14% · habit labels in 12–20% · six habits 20–80% · final line 80–93%
    //           · bloom folds 88–95% · Microsoft squares 89.5–95% · wordmark 92.5–95.5% · logo holds 95.5–97.5%
    //           · fly to header + cover fade 97.5–100%
    var bs=p<.14?lerp(.62,1,p/.14):p<.8?lerp(1,1.15,(p-.14)/.66):p<.88?lerp(1.15,1.7,(p-.8)/.08):lerp(1.7,.25,ease(clamp((p-.88)/.07)));
    cover.style.setProperty('--bs',bs.toFixed(4));
    cover.style.setProperty('--bo',(1-clamp((p-.88)/.06)).toFixed(3));
    var ph=Math.min(clamp((p-.12)/.08),1-clamp((p-.78)/.05));
    cover.style.setProperty('--hl',ph.toFixed(3));
    cover.style.setProperty('--bxs',(cshift*ease(ph)).toFixed(1)+'px');
    // habits take turns between 20% and 80%: the petal lights up and the proof shows on the dark side
    var k=p>=.2&&p<.8?Math.min(5,Math.floor((p-.2)/.1)):-1;
    if(k!==con){
      con=k;cbloom.classList.toggle('focus',k>=0);
      cpetals.forEach(function(e,i){e.classList.toggle('on',i===k);});
      clabs.forEach(function(e,i){e.classList.toggle('on',i===k);});
    }
    chabs.forEach(function(el,i){
      var c=.2+.1*(i+.5),v=clamp((.058-Math.abs(p-c))/.02),go=el.querySelector('.c-go');
      cFocus(el,v,p<c?20:-20);
      go.style.pointerEvents=v>.5?'auto':'none';go.tabIndex=v>.5?0:-1;
    });
    // final line over a darkened bloom, then it steps aside for the logo
    cover.style.setProperty('--dm',(clamp((p-.8)/.05)*.55).toFixed(3));
    cFocus(cfinal,Math.min(clamp((p-.8)/.035),1-clamp((p-.885)/.025)),p<.885?20:-20);
    // Microsoft logo: squares spin out one after another, then the wordmark slides out from behind them
    csq.forEach(function(q,i){q.style.setProperty('--s',ease(clamp((p-.895-i*.008)/.03)).toFixed(3));});
    var w=ease(clamp((p-.925)/.03)),f=easeInOut(clamp((p-.975)/.025));
    clogo.style.setProperty('--wo',w.toFixed(3));
    clogo.style.setProperty('--wb',((1-w)*8).toFixed(1)+'px');
    clogo.style.setProperty('--wt',((1-w)*-24).toFixed(1)+'px');
    // hand-off: the logo shrinks into the header logo (wordmark turning header grey) as the cover fades over the hero
    clogo.style.setProperty('--lt',f.toFixed(3));
    clogo.style.opacity=(clamp((p-.895)/.015)*(1-clamp((f-.8)/.2))).toFixed(3);
    var fo=clamp((f-.6)/.4);
    cpin.style.opacity=(1-fo).toFixed(3);
    cpin.style.pointerEvents=fo>.5?'none':'';
    var at=cArc(f);
    clogo.style.transform='translate(-50%,-50%) translate('+(cwx*(1-w)+at.x).toFixed(1)+'px,'+at.y.toFixed(1)+'px) scale('+(1+(cfly.s-1)*f).toFixed(4)+')';
    // star trail: stars sit at earlier points of the arc, shrinking and fading toward the tail, then dissolve on landing
    var tf=1-clamp((f-.88)/.12);
    cstars.forEach(function(st,i){
      var t=f-(i+1)*.026;
      if(t<=0||tf<=0){st.style.opacity='0';return;}
      var a=cArc(t),a2=cArc(Math.min(1,t+.01)),dx=a2.x-a.x,dy=a2.y-a.y,len=Math.hypot(dx,dy)||1,
          j=Math.sin(i*2.3+1)*(4+i*1.6),sz=Math.max(.3,1-i*.042);
      var x=csx+a.x-dy/len*j-13,y=ccy+a.y+dx/len*j-13;
      st.style.opacity=(Math.pow(1-i/cstars.length,1.2)*clamp(t*8)*tf).toFixed(3);
      st.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) scale('+sz.toFixed(3)+') rotate('+(i*23)+'deg)';
    });
    cskip.style.opacity=(1-f).toFixed(3);
    var arrived=f>.97;
    cnav.classList.toggle('pre',!arrived);
    if(arrived&&!carrived){cnavsvg.classList.remove('arrive');void cnavsvg.getBoundingClientRect();cnavsvg.classList.add('arrive');}
    carrived=arrived;
    chint.style.opacity=p>.01?0:1;
    if(cdur>0)cSeek(p*cdur);
  }
  function cTarget(){var navh=cnav.offsetHeight,total=cover.offsetHeight-(innerHeight-navh);ctarget=total>0?clamp((navh-cover.getBoundingClientRect().top)/total):0;}
  function cFrame(){
    ccur+=(ctarget-ccur)*.18;
    if(Math.abs(ctarget-ccur)<.0005)ccur=ctarget;
    cRender();
    if(ccur!==ctarget)requestAnimationFrame(cFrame);else crun=false;
  }
  if(motion){
    cover.classList.add('cover-live');
    root.classList.add('c-anim');
    document.body.appendChild(clogo);
    ctrail=document.createElement('div');ctrail.className='c-trail';ctrail.setAttribute('aria-hidden','true');
    for(var si=0;si<18;si++){var st=document.createElement('i');st.className='c-star';st.innerHTML='<b></b>';ctrail.appendChild(st);cstars.push(st);}
    document.body.appendChild(ctrail);
    addEventListener('scroll',function(){cTarget();if(!crun){crun=true;requestAnimationFrame(cFrame);}},{passive:true});
    addEventListener('resize',function(){cNav();cLayout();cTarget();ccur=ctarget;cRender();});
    cLayout();cTarget();ccur=ctarget;cRender();
  }
  cover.querySelector('.c-skip').addEventListener('click',function(){document.getElementById('top').scrollIntoView({behavior:motion?'smooth':'auto'});});
})(window.Site);
