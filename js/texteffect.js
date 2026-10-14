(function(S){
  var motion=S.motion;

  // text effect: a vanilla port of the "TextEffect" component (framer-motion) for the hero heading, plus a "cut"
  // preset from "VerticalCutReveal" (each segment rises out of its own clipping box, springing slightly).
  // An element with data-te="blur|slide|fade|scale|cut" is split per data-te-per ("char" or "word"; default word) into
  // inline-block segments that animate in one after another (stagger: char .03s, word .05s, after data-te-delay).
  // The whole text stays readable as the element's aria-label; the segments are aria-hidden.
  // Text inside a data-te-skip selector (the motto's <small>) is left whole. Gradient text (the hero <em>) is
  // kept continuous by giving each letter its slice of the gradient (--te-w / --te-x, measured).
  // It plays once, when the hero is first really visible: after the cover's logo has landed in the header.
  var STAGGER={char:.03,word:.05};
  var els=[].slice.call(document.querySelectorAll('[data-te]'));
  if(!els.length||!motion)return;

  var grads=[]; // gradient-text containers whose letters need their slice measured
  function split(el){
    var per=el.getAttribute('data-te-per')||'word',skip=el.getAttribute('data-te-skip'),i=0,
        stagger=parseFloat(el.getAttribute('data-te-stagger'))||STAGGER[per],cut=el.getAttribute('data-te')==='cut';
    el.setAttribute('aria-label',(el.innerText||el.textContent).replace(/\s+/g,' ').trim()); // innerText keeps the break after a block <small>
    el.style.setProperty('--te-s',stagger+'s');el.style.setProperty('--te-d',(parseFloat(el.getAttribute('data-te-delay'))||0)+'s');
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType===1){
          if(skip&&n.matches(skip)){n.setAttribute('aria-hidden','true');return;}
          if(getComputedStyle(n).backgroundClip==='text'||getComputedStyle(n).webkitBackgroundClip==='text'){n.classList.add('te-grad');grads.push(n);}
          walk(n);return;
        }
        if(n.nodeType!==3||!n.nodeValue)return;
        var frag=document.createDocumentFragment();
        // cut (the "VerticalCutReveal" component): the segment is a clipping box and its text rises into it from below
        function seg(t){
          var e=document.createElement('span');e.className='te-seg';e.setAttribute('aria-hidden','true');e.style.setProperty('--i',i++);
          if(cut){var inner=document.createElement('span');inner.className='te-in';inner.textContent=t;e.appendChild(inner);}else e.textContent=t;
          return e;
        }
        n.nodeValue.split(/(\s+)/).forEach(function(p){
          if(!p)return;
          if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(p));return;}
          if(per!=='char'){frag.appendChild(seg(p));return;}
          // the letters of one word sit in a no-wrap box, so a line never breaks inside a word
          var w=document.createElement('span');w.className='te-word';
          p.split('').forEach(function(c){w.appendChild(seg(c));});
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      });
    })(el);
    el.classList.add('te','te-'+el.getAttribute('data-te'));
  }
  els.forEach(split);

  // each letter of a gradient word paints the whole word's gradient, shifted to its own position
  function measure(){
    grads.forEach(function(g){
      var segs=g.querySelectorAll('.te-seg');if(!segs.length)return;
      var left=segs[0].offsetLeft,w=0;
      [].forEach.call(segs,function(s){w=Math.max(w,s.offsetLeft-left+s.offsetWidth);});
      g.style.setProperty('--te-w',w+'px');
      [].forEach.call(segs,function(s){s.style.setProperty('--te-x',(left-s.offsetLeft)+'px');});
    });
  }
  measure();
  addEventListener('resize',measure);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);

  // play once the hero is on screen and not under the cover (the nav loses .pre when the cover's logo lands)
  var hero=document.querySelector('.hero'),nav=document.querySelector('.nav'),cover=document.getElementById('cover'),
      inview=false,played=false;
  function covered(){return cover&&cover.classList.contains('cover-live')&&nav.classList.contains('pre');}
  function check(){
    if(played||!inview||covered())return;
    played=true;
    els.forEach(function(el){el.classList.add('te-play');});
  }
  new MutationObserver(check).observe(nav,{attributes:true,attributeFilter:['class']});
  new IntersectionObserver(function(es){inview=es[0].isIntersecting;check();}).observe(hero);
})(window.Site);
