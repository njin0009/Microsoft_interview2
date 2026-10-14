(function(S){
  var motion=S.motion;

  // habits: instant photos pegged to a sagging string, a vanilla port of the "Polaroid Line Carousel" component.
  // Drag the line (or use the arrows, ←/→, or click a print) and the prints slide along it, swinging on their pegs with
  // the speed you give them and settling back with a little overshoot; at rest they sway in a light breeze. The print
  // in the middle is the active habit: its article (role, proof, link) shows in the caption bar below.
  // The articles stay the source of truth (and the no-JS layout): the script moves them into the bar and paints a
  // print per habit from its article's data-photo (images/habits/), painting a landscape only when there is none or it
  // fails to load. Links to #habit-… (the cover petals) bring that print to the middle.
  var sec=document.getElementById('habits'),grid=sec&&sec.querySelector('.traits');if(!grid)return;
  var arts=[].slice.call(grid.querySelectorAll('.trait')),n=arts.length;if(!n)return;
  // one painted landscape per habit, in this order
  var LAND=[['dawn',3],['alpine',8],['dusk',14],['mist',21],['dawn',34],['alpine',55]];
  var PALETTES={
    dawn:{top:'#e7b7a5',bottom:'#f8e8d6',sun:'#fff4df',far:'#d2b2bb',near:'#3a2a3b',mist:'255,240,232'},
    alpine:{top:'#7ea5c8',bottom:'#e3ecf2',sun:'#ffffff',far:'#a9bfd0',near:'#1c3044',mist:'236,244,250'},
    dusk:{top:'#2a2450',bottom:'#ef8d60',sun:'#ffd9a6',far:'#93607c',near:'#18121f',mist:'255,196,160'},
    mist:{top:'#c4d0cb',bottom:'#eef1ec',sun:'#ffffff',far:'#aebcb5',near:'#2c3a33',mist:'246,248,245'}
  };
  var CARD_W=300,SAG=46,SWING=motion?1:0,AUTOPLAY=motion?4500:0;

  function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
  function pad2(k){return k<10?'0'+k:String(k);}
  function mulberry32(seed){var a=seed>>>0;return function(){a=(a+0x6d2b79f5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  function hexRgb(h){var v=parseInt(h.replace('#',''),16);return [(v>>16)&255,(v>>8)&255,v&255];}
  function mixRgb(a,b,t){var A=hexRgb(a),B=hexRgb(b);return 'rgb('+A.map(function(v,i){return Math.round(v+(B[i]-v)*t);}).join(',')+')';}
  // a layered-ridge landscape: sky, a low sun, five ridges fading into haze with mist between, a tree line, film grain
  function paintLandscape(seed,palette,w,h){
    var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d'),P=PALETTES[palette]||PALETTES.dawn,r=mulberry32(seed*104729+7);
    var sky=g.createLinearGradient(0,0,0,h*.72);sky.addColorStop(0,P.top);sky.addColorStop(1,P.bottom);g.fillStyle=sky;g.fillRect(0,0,w,h);
    var sx=w*(.22+r()*.56),sy=h*(.26+r()*.16),sun=hexRgb(P.sun).join(','),halo=g.createRadialGradient(sx,sy,0,sx,sy,w*.45);
    halo.addColorStop(0,'rgba('+sun+',.85)');halo.addColorStop(.08,'rgba('+sun+',.55)');halo.addColorStop(1,'rgba('+sun+',0)');
    g.fillStyle=halo;g.fillRect(0,0,w,h);g.fillStyle=P.sun;g.beginPath();g.arc(sx,sy,h*.045,0,Math.PI*2);g.fill();
    for(var L=0;L<5;L++){
      var k=L/4,base=h*(.42+k*.4),amp=h*(.07+k*.1),ph=[r(),r(),r(),r()].map(function(v){return v*Math.PI*2;}),fr=[1.3+r(),3.1+r()*2,7+r()*4,17+r()*8];
      var ridge=(function(base,amp,ph,fr){return function(x){var u=x/w;return base-amp*(.55*Math.sin(u*fr[0]+ph[0])+.28*Math.sin(u*fr[1]+ph[1])+.12*Math.abs(Math.sin(u*fr[2]+ph[2]))+.05*Math.sin(u*fr[3]+ph[3]));};})(base,amp,ph,fr);
      var mist=g.createLinearGradient(0,base-amp*1.4,0,base+amp*.4);mist.addColorStop(0,'rgba('+P.mist+',0)');mist.addColorStop(1,'rgba('+P.mist+','+(.55-k*.35).toFixed(2)+')');
      g.fillStyle=mist;g.fillRect(0,base-amp*1.4,w,amp*1.8);
      var body=g.createLinearGradient(0,base-amp,0,h);body.addColorStop(0,mixRgb(P.far,P.near,Math.pow(k,1.3)));body.addColorStop(1,mixRgb(P.far,P.near,Math.min(1,Math.pow(k,1.3)+.18)));
      g.fillStyle=body;g.beginPath();g.moveTo(0,h);for(var x=0;x<=w;x+=4)g.lineTo(x,ridge(x));g.lineTo(w,h);g.closePath();g.fill();
      if(L>=3){
        g.fillStyle=mixRgb(P.far,P.near,Math.min(1,Math.pow(k,1.3)+.08));
        for(x=0;x<w;x+=4+r()*6){if(r()<.35)continue;var y=ridge(x)+2,th=h*(.025+r()*.035)*(.6+k),tw=th*.32;
          g.beginPath();g.moveTo(x,y-th);g.lineTo(x+tw,y);g.lineTo(x-tw,y);g.closePath();g.fill();}
      }
    }
    var vig=g.createRadialGradient(w/2,h*.45,h*.3,w/2,h/2,w*.78);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.32)');g.fillStyle=vig;g.fillRect(0,0,w,h);
    var img=g.getImageData(0,0,w,h),d=img.data;for(var i=0;i<d.length;i+=4){var v=(r()-.5)*14;d[i]+=v;d[i+1]+=v;d[i+2]+=v;}g.putImageData(img,0,0);
    return c.toDataURL('image/jpeg',.88);
  }

  // ---- build: the line (string + prints) above, the caption bar (the articles) below ----
  sec.classList.add('pl-section');
  var root=document.createElement('div');root.className='pl-root';root.tabIndex=0;
  root.setAttribute('role','region');root.setAttribute('aria-roledescription','carousel');root.setAttribute('aria-label','Six habits');
  root.innerHTML='<svg class="pl-string" aria-hidden="true"><path fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var path=root.querySelector('path'),cards=[],imgs=[];
  arts.forEach(function(a,i){
    a.classList.remove('rv','tile');a.classList.add('in'); // the reveal observer would never see the hidden ones
    var card=document.createElement('div');card.className='pl-card';card.setAttribute('data-i',i);card.setAttribute('aria-hidden','true');
    var icon=a.querySelector('.icon svg'),name=a.querySelector('h3').textContent;
    card.innerHTML='<div class="pl-print"><div class="pl-shot"><img alt="" draggable="false"><span class="pl-stamp">'+pad2(i+1)+'</span>'+
      '<span class="pl-badge">'+(icon?icon.outerHTML:'')+'</span></div><div class="pl-note"></div></div><div class="pl-peg"></div>';
    card.querySelector('.pl-note').textContent=name;
    var photo=a.getAttribute('data-photo'),im=card.querySelector('img');
    if(photo){card.querySelector('.pl-shot').classList.add('pl-photo');im.alt=name;
      im.onerror=function(){card.querySelector('.pl-shot').classList.remove('pl-photo');im.onerror=null;im.removeAttribute('src');paintOne(i);};im.src=photo;}
    imgs.push(photo?null:im);cards.push(card);root.appendChild(card);
  });
  var bar=document.createElement('div');bar.className='pl-bar';
  bar.innerHTML='<div class="pl-cap" aria-live="polite"></div><span class="pl-count" aria-hidden="true"><b>01</b> / '+pad2(n)+'</span>'+
    '<button type="button" class="pl-btn pl-prev" aria-label="Previous habit"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3 5 8l5 5" stroke="currentColor" stroke-width="1.4"/></svg></button>'+
    '<button type="button" class="pl-btn pl-next" aria-label="Next habit"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.4"/></svg></button>';
  var cap=bar.querySelector('.pl-cap'),count=bar.querySelector('.pl-count b');
  arts.forEach(function(a){cap.appendChild(a);});
  grid.replaceWith(root);root.after(bar);
  // paint the landscapes one at a time when the browser is idle, so the page never stalls
  var idle=window.requestIdleCallback||function(f){return setTimeout(f,60);};
  function paintOne(i){idle(function(){var l=LAND[i%LAND.length];cards[i].querySelector('img').src=paintLandscape(l[1],l[0],560,560);});}
  imgs.forEach(function(im,i){if(im)paintOne(i);});

  // ---- state ----
  var active=-1,W=1200,H=640,CW=CARD_W,spacing=CW*1.08,sim={off:0,vel:0,target:0,a:[],w:[]},drag=null,lastTouch=0,visible=false,raf=0,prev=0;
  function show(i){
    if(i===active)return;active=i;
    arts.forEach(function(a,k){a.hidden=k!==i;});
    arts[i].classList.remove('pl-in');void arts[i].offsetWidth;arts[i].classList.add('pl-in');
    cards.forEach(function(c,k){c.setAttribute('data-on',k===i?'1':'0');});
    count.textContent=pad2(i+1);
  }
  function goTo(i){sim.target=clamp(i,0,n-1)*spacing;if(!motion){sim.off=sim.target;sim.vel=0;}} // no spring without motion
  function step(d){lastTouch=performance.now();goTo(clamp(active+d,0,n-1));}
  function nearest(off){return clamp(Math.round(off/spacing),0,n-1);}
  function size(){
    // the print size follows the width; the line is just tall enough for the string, its sag and a print
    W=root.clientWidth;
    CW=Math.round(Math.max(150,Math.min(CARD_W,W*.42)));spacing=CW*1.08;
    H=Math.round(CW+150);root.style.height=H+'px';
    root.style.setProperty('--pl-cw',CW+'px');
    sim.off=sim.target=Math.max(0,active)*spacing;
    if(!raf)frame(performance.now()); // place the prints even before the loop runs
  }
  function frame(now){
    raf=0;
    var dt=Math.min(.033,Math.max(0,(now-prev)/1000));prev=now;
    var y0=44,lineVel;
    if(drag&&drag.moved)lineVel=drag.v*1000;
    else{
      // critically damped spring toward the target
      var before=sim.off,k=70,c=2*Math.sqrt(k);sim.vel+=(k*(sim.target-sim.off)-c*sim.vel)*dt;sim.off+=sim.vel*dt;
      lineVel=-(sim.off-before)/Math.max(dt,1e-3);
    }
    var near=nearest(sim.off);
    for(var i=0;i<n;i++){
      var el=cards[i],x=W/2+i*spacing-sim.off;
      if(x<-CW*1.5||x>W+CW*1.5){el.style.visibility='hidden';continue;}
      el.style.visibility='visible';
      // swing: a print lags behind the line's motion, gravity pulls it back, air damps it; plus a light breeze
      var a=sim.a[i]||0,av=sim.w[i]||0;
      av+=(-38*a-4.2*av+lineVel*.0034*SWING)*dt;a=clamp(a+av*dt,-.6,.6);
      if(SWING)a+=Math.sin(now/1300+i*1.7)*.0009;
      sim.a[i]=a;sim.w[i]=av;
      var t=clamp(x/W,0,1),y=y0+4*SAG*t*(1-t)-6;
      el.style.transform='translate('+(x-CW/2).toFixed(1)+'px,'+y.toFixed(1)+'px) rotate('+a.toFixed(4)+'rad)';
      el.style.zIndex=String(i===near?n+1:n-Math.abs(i-near));
    }
    path.setAttribute('d','M0 '+y0+' Q'+W/2+' '+(y0+2*SAG)+' '+W+' '+y0);
    show(near);
    if(visible&&motion)raf=requestAnimationFrame(frame);
  }
  function kick(){if(!raf&&visible){prev=performance.now();raf=requestAnimationFrame(frame);}else if(!motion)frame(performance.now());}

  // ---- input: drag the line, click a print, arrows, keys ----
  root.addEventListener('pointerdown',function(e){
    lastTouch=performance.now();
    drag={x:e.clientX,off:sim.off,lx:e.clientX,lt:e.timeStamp,v:0,moved:false,id:e.pointerId};
  });
  root.addEventListener('pointermove',function(e){
    var d=drag;if(!d)return;
    var dx=e.clientX-d.x;
    if(!d.moved&&Math.abs(dx)>5){d.moved=true;root.setAttribute('data-drag','1');root.setPointerCapture(e.pointerId);}
    if(!d.moved)return;
    var dt=Math.max(1,e.timeStamp-d.lt);d.v=.7*((e.clientX-d.lx)/dt)+.3*d.v;d.lx=e.clientX;d.lt=e.timeStamp;
    var max=(n-1)*spacing,off=d.off-dx;
    if(off<0)off*=.35;if(off>max)off=max+(off-max)*.35;
    sim.off=off;kick();
  });
  function up(e){
    var d=drag;drag=null;lastTouch=performance.now();if(!d)return;
    if(d.moved){root.setAttribute('data-drag','0');sim.vel=-d.v*1000;goTo(nearest(sim.off-d.v*180));kick();return;}
    var card=e.target.closest&&e.target.closest('.pl-card');if(card){goTo(+card.getAttribute('data-i'));kick();}
  }
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  root.addEventListener('keydown',function(e){var d={ArrowRight:1,ArrowLeft:-1}[e.key];if(!d)return;e.preventDefault();step(d);kick();});
  bar.querySelector('.pl-prev').addEventListener('click',function(){step(-1);kick();});
  bar.querySelector('.pl-next').addEventListener('click',function(){step(1);kick();});

  // links to a habit (the cover petals and their "See the proof"): scroll here and bring that print to the middle
  function jumpTo(id,smooth){
    var i=arts.findIndex(function(a){return a.id===id;});if(i<0)return false;
    lastTouch=performance.now();goTo(i);
    if(!smooth||!motion){sim.off=sim.target;sim.vel=0;}
    sec.scrollIntoView({behavior:smooth&&motion?'smooth':'auto',block:'start'});
    kick();
    var c=cards[i];c.classList.remove('pl-flash');void c.offsetWidth;c.classList.add('pl-flash');
    return true;
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#habit-"]');if(!a)return;
    if(jumpTo(a.getAttribute('href').slice(1),true)){e.preventDefault();history.replaceState(null,'','#habits');}
  },true);

  // autoplay, back to the first print after the last; waits while someone is interacting or the line is off screen
  if(AUTOPLAY)setInterval(function(){
    if(document.hidden||!visible||drag||performance.now()-lastTouch<AUTOPLAY)return;
    goTo(active>=n-1?0:active+1);kick();
  },AUTOPLAY);

  new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)kick();}).observe(root);
  addEventListener('resize',size);
  show(0);size();
  if(/^#habit-/.test(location.hash))setTimeout(function(){jumpTo(location.hash.slice(1),false);},0);
})(window.Site);
