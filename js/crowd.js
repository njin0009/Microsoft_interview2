(function(S){
  var motion=S.motion;

  // crowd: busts from the Open Peeps sheet walk across; eight balloon people walk among them, and clicking
  // one (or its keyboard button) pops its balloon and opens a question card. Runs only while the stage is on screen.
  var stage=document.getElementById('crowd');if(!stage)return;
  var cv=stage.querySelector('.crowd-canvas'),ctx=cv.getContext('2d'),card=document.getElementById('ask-card'),list=stage.querySelector('.ask-list');
  // bx/by: where the balloon sits inside each sprite (fractions), for the pop and the card anchor
  // each balloon person: their question, who they are, and the project that answers it.
  // bx/by: where the balloon sits inside the sprite (fractions), for the pop and the card anchor.
  // link: ext = external URL, rel = open that release story in the journey dialog
  var ASKS=[
    {c:'#ef2b2b',bx:.73,by:.12,q:'How can I find the right role for me in Australia?',
     who:'Me. I want a role in Australia that fits my skills, interests and background.',
     proj:'CareerOS',how:'Starts from my own profile: it organises experience, skills, interests and career goals, then helps judge how well a role fits and where to focus job-search preparation.'},
    {c:'#f2b100',bx:.78,by:.11,q:'Can we automatically extract website content and map elements to make migration easier?',
     who:'A full-stack developer who has to pull content out of an old website and match it to the new system\'s page components.',
     proj:'Discovery Agent · website migration tool',how:'Fetches page content automatically, identifies page elements and helps map them to target components, cutting the manual checking and tidying.',
     link:{ext:'https://agents-for-migration-of-symphony3.nuojin01.workers.dev/',label:'See the migration prototype'}},
    {c:'#1f6fff',bx:.65,by:.12,q:'How do we know this feature is ready to release?',
     who:'An automotive product owner who has to decide whether a software feature meets the bar for release.',
     proj:'Volvo infotainment testing + Python automation',how:'Functional testing, automated regression and defect analysis give the release decision real quality evidence to stand on.',
     link:{rel:1,label:'See the testing story'}},
    {c:'#10a8a6',bx:.73,by:.1,q:'How can we keep our international teams aligned and spot blockers early?',
     who:'A lead or engineer on an international project: teams work differently, progress is scattered and blockers surface late.',
     proj:'Polestar P417 · China–Sweden collaboration, product management, PMP',how:'Learn how each team works, write management documents everyone can follow, and use Jira to make ownership, dependencies and acceptance criteria explicit and progress visible. Reach out to stakeholders and keep a regular reporting rhythm. Next: auto-synced progress and a daily-summary skill that surfaces the core issues.',
     link:{rel:2,label:'See the P417 story'}},
    {c:'#ff6a4d',bx:.67,by:.12,q:'Why does this form ask me questions that don\'t apply to me?',
     who:'A council website user who wants to finish an application without irrelevant questions or validation getting in the way.',
     proj:'Golden Plains multi-step webform',how:'Better conditional logic, field validation and confirmation page, so people only answer what applies to them and can submit without roadblocks.'},
    {c:'#8a3fdc',bx:.69,by:.11,q:'How can I turn my skills into a clear career path?',
     who:'A career changer with some skills, unsure which role to aim for or what to learn first.',
     proj:'PathwayIQ + Monash Master of IT',how:'Maps existing skills, the target direction and the gaps between them into a clear learning path they can act on.',
     link:{ext:'https://iteration3.pathwayiq.me/',label:'Try PathwayIQ'}},
    {c:'#22a63a',bx:.72,by:.11,q:'Can you explain it without all the technical words?',
     who:'A curious beginner who needs complex ideas in familiar language.',
     proj:'Explaining tech to non-technical stakeholders',how:'Like when I explained an MCU: start with an intuitive analogy, adjust to their follow-up questions, and check they have really understood.'},
    {c:'#ff6fae',bx:.78,by:.13,cat:true,q:'Has someone fed me, or am I getting dinner twice?',
     who:'A cat the whole family looks after, so everyone has to coordinate feeding, cleaning and daily care.',
     proj:'Family cat-care website · in development',how:'Shared care records and task status, so everyone can see who has already done what: no double dinners, no missed meals.'}
  ];
  var SKIP={17:1,72:1,92:1,100:1}; // sheet cells holding a knife
  var sheet=new Image(),sprites=[],loaded=0,ready=false,need=1+ASKS.length,W=0,H=0,ph=0,dpr=1,peeps=[],asks=[],fx=[],run=false,last=0,open=-1,inview=false;
  function done(){if(++loaded===need)start();}
  sheet.onload=done;sheet.onerror=function(){stage.hidden=true;};sheet.src='images/crowd/open-peeps-sheet.png';
  ASKS.forEach(function(a,i){var im=new Image();im.onload=done;im.onerror=done;im.src='images/crowd/balloon-'+(i+1)+'.png';sprites.push(im);});
  function rnd(a,b){return a+Math.random()*(b-a);}
  function size(){
    dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    ph=H*.56;
  }
  function resetPeep(pp,first){
    var dir=Math.random()>.5?1:-1,pw=ph*240/324;
    pp.dir=dir;pp.w=pw;pp.h=ph;pp.off=ph*(.06-.36*Math.pow(Math.random(),2));
    pp.v=(W+pw*2)/rnd(9,18)*dir;
    pp.x=first?rnd(-pw,W):(dir>0?-pw:W);
  }
  function initCrowd(){
    peeps=[];var cells=[];for(var i=0;i<105;i++)if(!SKIP[i])cells.push(i);
    cells.sort(function(){return Math.random()-.5;});
    var count=Math.min(cells.length,Math.max(10,Math.round(W/34)));
    for(var k=0;k<count;k++){var pp={cell:cells[k],t:rnd(0,1)};resetPeep(pp,true);peeps.push(pp);}
    asks=ASKS.map(function(a,i){
      var im=sprites[i],bh=a.cat?ph*1.2:ph*1.75,bw=im.naturalWidth?bh*im.naturalWidth/im.naturalHeight:bh*.6;
      // spread the eight along a long loop so they come past one or two at a time
      var loop=W+bw*2+W*1.4;
      return {i:i,a:a,im:im,w:bw,h:bh,sink:a.cat?.02:.26,loop:loop,x:-bw+loop*(i/ASKS.length)+rnd(-20,20),v:loop/rnd(46,58),off:ph*rnd(-.04,.06),t:rnd(0,1),paused:false,jig:0};
    });
  }
  function update(dt){
    peeps.forEach(function(pp){pp.x+=pp.v*dt;pp.t+=dt;if((pp.v>0&&pp.x>W)||(pp.v<0&&pp.x<-pp.w))resetPeep(pp,false);});
    asks.forEach(function(b){if(!b.paused){b.x+=b.v*dt;b.t+=dt;if(b.x>W+b.w)b.x-=b.loop;}b.jig=Math.max(0,b.jig-dt*2.2);});
    fx=fx.filter(function(f){f.t+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=300*dt;return f.t<.8;});
  }
  function bob(t){return .5-.5*Math.cos(t*Math.PI*4);} // a step every 0.25s, like the original yoyo
  function askRect(b){var y=H-b.h*(1-b.sink)+b.off-(b.paused?0:bob(b.t)*ph*.03);return {x:b.x,y:y,w:b.w,h:b.h};}
  function draw(){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    var items=[];
    peeps.forEach(function(pp){items.push({z:pp.off,f:function(){
      var c=pp.cell%15,r=(pp.cell/15)|0,y=H-pp.h+pp.off+ph*.42-bob(pp.t)*ph*.03;
      ctx.save();ctx.translate(pp.dir>0?pp.x:pp.x+pp.w,y);ctx.scale(pp.dir,1);
      ctx.drawImage(sheet,c*240,r*324,240,324,0,0,pp.w,pp.h);ctx.restore();}});});
    asks.forEach(function(b){items.push({z:b.off+ph*.05,f:function(){
      var r=askRect(b);if(r.x>W||r.x+r.w<0)return;
      if(b.jig>0){var s=1+Math.sin(b.jig*18)*.05*b.jig,cx=r.x+r.w*b.a.bx,cy=r.y+r.h*b.a.by;ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);ctx.translate(-cx,-cy);ctx.drawImage(b.im,r.x,r.y,r.w,r.h);ctx.restore();}
      else ctx.drawImage(b.im,r.x,r.y,r.w,r.h);}});});
    items.sort(function(a,b){return a.z-b.z;}).forEach(function(it){it.f();});
    fx.forEach(function(f){ctx.globalAlpha=Math.max(0,1-f.t/.8);ctx.fillStyle=f.c;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,6.283);ctx.fill();});
    ctx.globalAlpha=1;
  }
  function frame(ts){if(!run)return;var dt=last?Math.min(.05,(ts-last)/1000):0;last=ts;if(motion)update(dt);draw();if(motion)requestAnimationFrame(frame);else run=false;}
  function go(){if(run||!inview||!ready)return;run=true;last=0;requestAnimationFrame(frame);}
  function start(){
    ready=true;size();initCrowd();
    ASKS.forEach(function(a,i){var bt=document.createElement('button');bt.type='button';bt.textContent='Ask: '+a.q;bt.addEventListener('click',function(){ask(i,true);});list.appendChild(bt);});
    new IntersectionObserver(function(es){inview=es[0].isIntersecting;if(inview)go();else run=false;}).observe(stage);
    addEventListener('resize',function(){var ow=W;size();if(Math.abs(W-ow)>40)initCrowd();if(!motion){run=false;go();}});
    draw();go();
  }
  function hit(e){
    var r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,best=-1,bz=-1e9;
    asks.forEach(function(b){var q=askRect(b);
      // the balloon or the person: a slightly inset box over the visible part of the sprite
      if(x>q.x+q.w*.08&&x<q.x+q.w*.95&&y>q.y&&y<q.y+q.h*(1-b.sink)&&b.off>bz){best=b.i;bz=b.off;}});
    return best;
  }
  cv.addEventListener('pointermove',function(e){stage.classList.toggle('hot',hit(e)>=0);});
  cv.addEventListener('click',function(e){var i=hit(e);if(i>=0)ask(i,false);});
  function ask(i,fromKey){
    var b=asks[i];if(!b)return;
    if(open>=0&&asks[open])asks[open].paused=false;
    // bring this one on stage if it is off screen (keyboard path)
    if(b.x>W-b.w*.6||b.x<-b.w*.2)b.x=W*(.25+.5*Math.random())-b.w/2;
    b.paused=true;b.jig=1;open=i;
    var r=askRect(b),cx=r.x+r.w*b.a.bx,cy=r.y+r.h*b.a.by;
    for(var k=0;k<16;k++){var an=k/16*6.283;fx.push({x:cx,y:cy,vx:Math.cos(an)*rnd(60,160),vy:Math.sin(an)*rnd(60,160)-60,r:rnd(2,4.5),c:k%3?b.a.c:'#ffffff',t:0});}
    card.style.setProperty('--ac',b.a.c);
    card.querySelector('.ask-num').textContent='Question '+(i+1)+' of '+ASKS.length;
    card.querySelector('#ask-q').textContent=b.a.q;
    var link=card.querySelector('.ask-go');link.href='#persona';link.textContent='See who\'s asking and my answer';
    showPersona(i);
    card.hidden=false;
    // sit beside the balloon, flipping sides near the edge, clamped inside the stage
    var cw=card.offsetWidth,chh=card.offsetHeight,left=cx+18;
    if(left+cw>W-8)left=cx-18-cw;
    left=Math.max(8,Math.min(W-cw-8,left));
    var top=Math.max(-chh*.35,Math.min(H-chh-8,cy-chh*.4));
    card.style.left=left+'px';card.style.top=top+'px';
    card.style.setProperty('--ox',(cx-left)+'px');card.style.setProperty('--oy',(cy-top)+'px');
    if(fromKey)card.querySelector('.ask-x').focus();
    if(!motion){run=false;}
    go();
  }
  function closeAsk(){if(open>=0&&asks[open])asks[open].paused=false;open=-1;card.hidden=true;if(!motion){run=false;go();}}
  card.querySelector('.ask-x').addEventListener('click',closeAsk);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!card.hidden)closeAsk();});
  card.querySelector('.ask-go').addEventListener('click',function(e){
    e.preventDefault();closeAsk();pv.scrollIntoView({behavior:motion?'smooth':'auto',block:'center'});
  });
  // persona view inside the toolkit panel: picture, who is asking, the question and how I would solve it
  var screen=document.querySelector('.hero .screen'),pv=document.getElementById('persona'),pcur=-1;
  function showPersona(i){
    i=(i+ASKS.length)%ASKS.length;pcur=i;var a=ASKS[i];
    pv.style.setProperty('--ac',a.c);
    var img=pv.querySelector('.pv-img');img.src='images/crowd/balloon-'+(i+1)+'.png';img.alt='';img.classList.toggle('cat',!!a.cat);
    pv.querySelector('.pv-num').textContent='Question '+(i+1)+' of '+ASKS.length;
    pv.querySelector('.pv-q').textContent='“'+a.q+'”';
    pv.querySelector('.pv-who').textContent=a.who;
    pv.querySelector('.pv-proj').textContent=a.proj;
    pv.querySelector('.pv-how').textContent=a.how;
    var lk=pv.querySelector('.pv-link');
    if(a.link){lk.hidden=false;lk.textContent=a.link.label;lk.href=a.link.ext||'#path';lk.className='link pv-link'+(a.link.ext?' ext':'');
      if(a.link.ext){lk.target='_blank';lk.rel='noopener';}else{lk.removeAttribute('target');lk.removeAttribute('rel');}
      lk.dataset.rel=a.link.rel==null?'':a.link.rel;}
    else lk.hidden=true;
    screen.classList.add('persona-on');pv.hidden=false;
    pv.classList.remove('show');void pv.offsetWidth;pv.classList.add('show');
  }
  pv.querySelector('.pv-link').addEventListener('click',function(e){
    var r=this.dataset.rel;if(r===''||r==null)return;
    e.preventDefault();var it=document.querySelectorAll('.j-item')[+r];if(it)it.click();
  });
  pv.querySelector('.pv-prev').addEventListener('click',function(){showPersona(pcur-1);});
  pv.querySelector('.pv-next').addEventListener('click',function(){showPersona(pcur+1);});
  pv.querySelector('.pv-back').addEventListener('click',function(){screen.classList.remove('persona-on');pv.hidden=true;closeAsk();});
})(window.Site);
