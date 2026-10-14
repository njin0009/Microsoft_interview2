(function(S){
  var root=S.root,motion=S.motion;

  // reveal blocks as they scroll in; items entering together are staggered
  if(motion){
    root.classList.add('motion');
    var rv=[].slice.call(document.querySelectorAll('.hero .wrap > *, .sec-head, .trait, .banner .wrap > *, .discovery, .star-step, .report, .after > article, .compare, .road > div, .faq-tools, .q-group, .faq, .q-mine, .cta .wrap > *, .foot-cols > div'));
    var io=new IntersectionObserver(function(es){
      var n=0;
      es.forEach(function(e){if(!e.isIntersecting)return;e.target.style.setProperty('--d',Math.min(n++,6)*80+'ms');e.target.classList.add('in');io.unobserve(e.target);});
    },{rootMargin:'0px 0px -8% 0px',threshold:.1});
    rv.forEach(function(el){el.classList.add('rv');io.observe(el);});

    // count up the headline numbers, ending on the original text
    var nums=[].slice.call(document.querySelectorAll('.kpi .big, .disc-stat .big'));
    var cio=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;cio.unobserve(e.target);
      var el=e.target,txt=el.textContent,m=txt.match(/^([^\d]*)([\d.]+)(.*)$/);if(!m)return;
      var end=parseFloat(m[2]),dec=(m[2].split('.')[1]||'').length,t0=null;
      function step(t){if(t0===null)t0=t;var k=Math.min((t-t0)/1200,1),v=end*(1-Math.pow(1-k,3));
        el.textContent=k<1?m[1]+v.toFixed(dec)+m[3]:txt;if(k<1)requestAnimationFrame(step);}
      requestAnimationFrame(step);
      setTimeout(function(){el.textContent=txt;},1500); // never leave a partial number if frames stall
    });},{threshold:.6});
    nums.forEach(function(el){cio.observe(el);});
  }

  // header: scroll progress, shadow once scrolled, bloom parallax
  var nav=document.querySelector('.nav'),bloom=document.querySelector('.bloom'),ticking=false;
  function onScroll(){
    ticking=false;
    var y=scrollY,max=root.scrollHeight-innerHeight;
    nav.style.setProperty('--p',max>0?Math.min(y/max,1):0);
    nav.classList.toggle('scrolled',y>8);
    if(motion&&y<innerHeight*1.5){bloom.style.setProperty('--py',(y*.12).toFixed(1)+'px');bloom.style.setProperty('--ps',(1+y*.00015).toFixed(4));}
  }
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
  onScroll();

  // highlight the header link for the section in view
  if('IntersectionObserver' in window){
    var links={};
    [].forEach.call(document.querySelectorAll('.nav-links a'),function(a){links[a.getAttribute('href').slice(1)]=a;});
    var sio=new IntersectionObserver(function(es){es.forEach(function(e){
      var a=links[e.target.id];if(!a)return;
      if(e.isIntersecting){for(var k in links)links[k].classList.remove('active');a.classList.add('active');}
      else a.classList.remove('active');
    });},{rootMargin:'-45% 0px -50% 0px'});
    Object.keys(links).forEach(function(id){var s=document.getElementById(id);if(s)sio.observe(s);});
  }

  // Fluent-style spotlight that follows the pointer on cards
  if(matchMedia('(hover: hover)').matches){
    document.addEventListener('pointermove',function(e){
      var t=e.target.closest&&e.target.closest('.tile');if(!t)return;
      var r=t.getBoundingClientRect();t.style.setProperty('--mx',e.clientX-r.left+'px');t.style.setProperty('--my',e.clientY-r.top+'px');
    },{passive:true});
  }
})(window.Site);
