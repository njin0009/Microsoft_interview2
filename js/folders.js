(function(S){
  var motion=S.motion;

  // toolkit folders: each .kit-col.gf becomes a glass folder, a vanilla port of the "Glass Folder Cards" component.
  // Three layers, back to front: a back panel holding generated artwork, the sheets (the folder's files, from the HTML),
  // and a frosted front panel hinged on its bottom edge that blurs whatever is behind it.
  //   rest: closed, the sheet tops only just show · hover / focus: the glass leans forward, the sheets lift a little
  //   open (click the glass or the round key, Enter, Space): the glass falls further and the sheets rise and fan
  //   pick (click a sheet while open): it rises clear of the others so its chips can be read
  // Without JS the HTML stays a plain card listing every sheet. The stage is drawn at 340 × 272 and scaled to the column.
  var W=340,H=272,HEAD=54,FRONT_H=H-74;
  var BACK='M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z';
  var FRONT='M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 '+(FRONT_H-22)+'A22 22 0 0 1 318 '+FRONT_H+'L22 '+FRONT_H+'A22 22 0 0 1 0 '+(FRONT_H-22)+'Z';

  // back-panel artwork, keyed by data-art: teal, mint and cream for the mint band, with a deep anchor for depth
  var ART={
    platforms:{style:'streak',colors:['#f4fffb','#bff0e8','#4fd1c5','#127a73','#0d3b4a','#5fb8c9','#e8fff8'],scale:.7,warp:1.5,angle:-.6,gloss:.2,veins:0},
    skills:{style:'marble',colors:['#0b2a33','#14525a','#4fd1c5','#173640','#f2c48d','#fff3dc','#ffffff'],scale:.66,warp:3.2,angle:-.5,gloss:.55,veins:.5},
    learning:{style:'marble',colors:['#0a2230','#1d5a73','#6fd6ea','#132f3a','#4fd1c5','#e8fff8','#fffaf0'],scale:.72,warp:3.4,angle:2.1,gloss:.5,veins:.45}
  };

  // #region art: a domain-warped noise field shaded as a liquid surface, painted a few rows per frame
  function hexToRgb(hex){var h=hex.replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var n=/^[0-9a-f]{6}$/i.test(h)?parseInt(h,16):0x808080;return [(n>>16)&255,(n>>8)&255,n&255];}
  function rng(seed){var a=seed>>>0;return function(){a=(a+0x6d2b79f5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  function hashString(s){var h=2166136261;for(var i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
  function makeFbm(seed){
    var r=rng(seed),perm=new Uint8Array(512),grad=new Float32Array(512),p=[],i;
    for(i=0;i<256;i++)p.push(i);
    for(i=255;i>0;i--){var j=Math.floor(r()*(i+1)),t=p[i];p[i]=p[j];p[j]=t;}
    for(i=0;i<512;i++)perm[i]=p[i&255];
    for(i=0;i<256;i++){var a=r()*Math.PI*2;grad[i*2]=Math.cos(a);grad[i*2+1]=Math.sin(a);}
    function noise(x,y){
      var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,X=xi&255,Y=yi&255;
      var h00=perm[X+perm[Y]]*2,h10=perm[X+1+perm[Y]]*2,h01=perm[X+perm[Y+1]]*2,h11=perm[X+1+perm[Y+1]]*2;
      var d00=grad[h00]*xf+grad[h00+1]*yf,d10=grad[h10]*(xf-1)+grad[h10+1]*yf,
          d01=grad[h01]*xf+grad[h01+1]*(yf-1),d11=grad[h11]*(xf-1)+grad[h11+1]*(yf-1);
      var u=xf*xf*xf*(xf*(xf*6-15)+10),v=yf*yf*yf*(yf*(yf*6-15)+10);
      return d00+u*(d10-d00)+v*(d01-d00+u*(d11-d01-d10+d00));
    }
    return function(x,y,oct){var sum=0,amp=.5;for(var i=0;i<oct;i++){sum+=amp*noise(x,y);var nx=1.6*x+1.2*y+7.1;y=-1.2*x+1.6*y+3.3;x=nx;amp*=.5;}return sum;};
  }
  // the field is sampled on a half-resolution grid, brought up with Catmull-Rom, normalised by its own percentiles,
  // then lit as a surface: slope → normal → diffuse + a tight specular, with fine striations along the contours
  function createArtJob(width,height,recipe,seed){
    var w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height));
    var stops=recipe.colors.map(function(c,i){return {t:i/(recipe.colors.length-1),c:hexToRgb(c)};});
    var scale=recipe.scale,warp=recipe.warp,gloss=recipe.gloss,veins=recipe.veins,streak=recipe.style==='streak';
    var fbm=makeFbm(seed*977+13),r=rng(seed+1),ox=r()*50,oy=r()*50,angle=recipe.angle+(r()-.5)*.5,ca=Math.cos(angle),sa=Math.sin(angle),m=Math.min(w,h);
    var gw=Math.ceil(w/2)+3,gh=Math.ceil(h/2)+3,G=new Float32Array(gw*gh),GQ=new Float32Array(gw*gh),F=new Float32Array(w*h),Q=new Float32Array(w*h),
        pixels=new Uint8ClampedArray(w*h*4),row=0;
    function field(gy){
      for(var gx=0;gx<gw;gx++){
        var u=((gx-1)*2-w/2)/m,v=((gy-1)*2-h/2)/m,px=(u*ca-v*sa)*scale,py=(u*sa+v*ca)*scale;
        if(streak){px*=.14;py*=2.2;}
        px+=ox;py+=oy;
        var qx=fbm(px,py,3),qy=fbm(px+5.2,py+1.3,3),rx=fbm(px+warp*qx+1.7,py+warp*qy+9.2,3),ry=fbm(px+warp*qx+8.3,py+warp*qy+2.8,3);
        G[gy*gw+gx]=fbm(px+warp*rx,py+warp*ry,4);GQ[gy*gw+gx]=Math.sqrt(qx*qx+qy*qy);
      }
    }
    function upsample(){
      function cr(a,b,c,d){return (-a+9*b+9*c-d)/16;}
      var T=new Float32Array(w*gh),x,y,gy;
      for(gy=0;gy<gh;gy++){var rr=gy*gw;for(x=0;x<w;x++){var c=(x>>1)+1;T[gy*w+x]=x&1?cr(G[rr+c-1],G[rr+c],G[rr+c+1],G[rr+c+2]):G[rr+c];}}
      for(y=0;y<h;y++){var cy=(y>>1)+1;for(x=0;x<w;x++){
        F[y*w+x]=y&1?cr(T[(cy-1)*w+x],T[cy*w+x],T[(cy+1)*w+x],T[(cy+2)*w+x]):T[cy*w+x];
        var gx=(x>>1)+1,q0=GQ[cy*gw+gx],qx=x&1?(q0+GQ[cy*gw+gx+1])/2:q0,
            q1=y&1?(x&1?(GQ[(cy+1)*gw+gx]+GQ[(cy+1)*gw+gx+1])/2:GQ[(cy+1)*gw+gx]):qx;
        Q[y*w+x]=(qx+q1)/2;
      }}
    }
    function colorize(){
      var sample=[],stride=Math.max(1,Math.floor(F.length/4096)),i;
      for(i=0;i<F.length;i+=stride)sample.push(F[i]);
      sample.sort(function(a,b){return a-b;});
      var lo=sample[Math.floor(sample.length*.02)],hi=sample[Math.floor(sample.length*.98)],k=1/(hi-lo||1),lx=-.55,ly=-.65,lz=.52,slope=k*m*.012;
      for(var y=0;y<h;y++)for(var x=0;x<w;x++){
        i=y*w+x;var t=(F[i]-lo)*k;t=t<0?0:t>1?1:t;
        var j=1;while(j<stops.length-1&&stops[j].t<t)j++;
        var a=stops[j-1],b=stops[j],f=(t-a.t)/(b.t-a.t||1);f=f<0?0:f>1?1:f;f=f*f*(3-2*f);
        var gx=(F[x<w-1?i+1:i]-F[x>0?i-1:i])*slope,gy=(F[y<h-1?i+w:i]-F[y>0?i-w:i])*slope;
        var nd=(-gx*lx-gy*ly+lz)/Math.sqrt(gx*gx+gy*gy+1),spec=Math.pow(nd>0?nd:0,24)*gloss*255;
        var silk=1+.035*Math.sin(t*150+Q[i]*24),vein=veins*Math.max(0,1-Math.abs(Q[i]-.42)*14)*.6,lit=(.82+.28*nd)*silk*(1-vein);
        pixels[i*4]=(a.c[0]+(b.c[0]-a.c[0])*f)*lit+spec;
        pixels[i*4+1]=(a.c[1]+(b.c[1]-a.c[1])*f)*lit+spec;
        pixels[i*4+2]=(a.c[2]+(b.c[2]-a.c[2])*f)*lit+spec;
        pixels[i*4+3]=255;
      }
    }
    return {width:w,height:h,pixels:pixels,step:function(rows){
      if(row>=gh)return true;
      var end=Math.min(gh,row+Math.max(1,rows));while(row<end)field(row++);
      if(row<gh)return false;
      upsample();colorize();return true;
    }};
  }
  // one shared painter: spends ~7 ms a frame, so three folders never jank the page
  var queue=[],pumping=false;
  function paint(canvas,recipe,seed){
    queue.push({job:createArtJob(canvas.width,canvas.height,recipe,seed),canvas:canvas});
    if(pumping)return;pumping=true;
    (function tick(){
      var until=performance.now()+7;
      while(queue.length&&performance.now()<until){
        var head=queue[0];
        if(head.job.step(4)){
          queue.shift();
          head.canvas.getContext('2d').putImageData(new ImageData(head.job.pixels,head.job.width,head.job.height),0,0);
          head.canvas.setAttribute('data-ready','');
        }
      }
      if(queue.length)requestAnimationFrame(tick);else pumping=false;
    })();
  }
  // #endregion

  function el(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e;}
  var folders=[];

  [].forEach.call(document.querySelectorAll('.kit .gf'),function(col,idx){
    var title=col.querySelector('.gf-title'),meta=col.querySelector('.gf-meta'),files=col.querySelector('.gf-files'),
        sheets=[].slice.call(files.querySelectorAll('.gf-sheet'));
    col.classList.add('gf-live');

    var stage=el('div','gf-stage'),tilt=el('div','gf-tilt');stage.appendChild(tilt);
    var shadow=el('div','gf-shadow');shadow.setAttribute('aria-hidden','true');tilt.appendChild(shadow);
    var back=el('div','gf-back');back.setAttribute('aria-hidden','true');back.style.clipPath="path('"+BACK+"')";
    var art=el('canvas','gf-art');back.appendChild(art);back.appendChild(el('div','gf-back-sheen'));tilt.appendChild(back);
    tilt.insertAdjacentHTML('beforeend','<svg class="gf-rim gf-back-rim" viewBox="0 0 '+W+' '+H+'" aria-hidden="true"><path d="'+BACK+'"/></svg>');

    var front=el('div','gf-front');front.style.clipPath="path('"+FRONT+"')";
    front.innerHTML='<div class="gf-tint" aria-hidden="true"></div><div class="gf-spec" aria-hidden="true"></div>'+
      '<svg class="gf-rim gf-front-rim" viewBox="0 0 '+W+' '+FRONT_H+'" aria-hidden="true"><defs><linearGradient id="gf-rim-'+idx+'" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/>'+
      '</linearGradient></defs><path d="'+FRONT+'" stroke="url(#gf-rim-'+idx+')"/></svg>';
    var hit=el('button','gf-hit');hit.type='button';
    var label=el('div','gf-label');label.appendChild(title);label.appendChild(meta);
    front.appendChild(hit);front.appendChild(label);tilt.appendChild(front);
    tilt.appendChild(files); // after the glass in tab order, beneath it on screen
    var key=el('button','gf-key');key.type='button';key.tabIndex=-1;key.setAttribute('aria-hidden','true');
    key.innerHTML='<svg class="gf-glyph" viewBox="0 0 24 24"><path d="M6 14.5l6-6 6 6"/></svg>';
    tilt.appendChild(key);
    col.appendChild(stage);

    // the first sheet sits furthest back and highest, so it is the one that peeks out of the closed folder
    var n=sheets.length;
    sheets.forEach(function(s,v){
      var j=rng(hashString(s.textContent)+v);
      s.style.setProperty('--gf-slot',n<=1?0:v/(n-1)*2-1);
      s.style.setProperty('--gf-depth',n-1-v);
      s.style.setProperty('--gf-jx',((j()-.5)*10).toFixed(2)+'px');
      s.style.setProperty('--gf-jr',((j()-.5)*3.2).toFixed(2)+'deg');
      s.style.zIndex=v+1;s.tabIndex=0;
      function pick(){var on=!s.hasAttribute('data-pick');sheets.forEach(function(o){o.removeAttribute('data-pick');});s.toggleAttribute('data-pick',on);}
      s.addEventListener('click',pick);
      s.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}});
    });

    function setOpen(on){
      col.toggleAttribute('data-open',on);
      hit.setAttribute('aria-expanded',on?'true':'false');
      hit.setAttribute('aria-label',(on?'Close ':'Open ')+title.textContent+', '+meta.textContent);
      files.inert=!on;
      if(!on)sheets.forEach(function(o){o.removeAttribute('data-pick');});
    }
    setOpen(false);
    function toggle(){setOpen(!col.hasAttribute('data-open'));}
    hit.addEventListener('click',toggle);key.addEventListener('click',toggle);

    // light and parallax follow the pointer
    col.addEventListener('pointermove',function(e){
      if(e.pointerType==='touch')return;
      var r=col.getBoundingClientRect();
      col.style.setProperty('--gf-px',(((e.clientX-r.left)/r.width)*2-1).toFixed(3));
      col.style.setProperty('--gf-py',(((e.clientY-r.top)/r.height)*2-1).toFixed(3));
    });
    col.addEventListener('pointerleave',function(){col.style.setProperty('--gf-px',0);col.style.setProperty('--gf-py',0);});

    var f={col:col,stage:stage,art:art,recipe:ART[col.getAttribute('data-art')]||ART.platforms,seed:+col.getAttribute('data-seed')||3,
           setOpen:setOpen,hit:hit,painted:false};
    folders.push(f);

    // assemble the first time it scrolls into view, staggered across the row
    if(motion){
      new IntersectionObserver(function(es,io){
        if(!es.some(function(e){return e.isIntersecting;}))return;
        io.disconnect();setTimeout(function(){col.setAttribute('data-entered','');},idx*140);
      },{threshold:.25}).observe(col);
    }else col.setAttribute('data-entered','');
  });

  // scale each 340-wide stage to its column; paint the art once, at the first size
  function layout(){
    folders.forEach(function(f){
      var cw=f.col.clientWidth;if(!cw)return;
      var k=Math.min(1.3,cw/W);
      f.col.style.height=Math.round((H+HEAD)*k)+'px';
      f.stage.style.transform='translate('+((cw-W*k)/2).toFixed(1)+'px,'+(HEAD*k).toFixed(1)+'px) scale('+k.toFixed(4)+')';
      if(!f.painted){
        f.painted=true;
        var d=k; // 1x is enough: the art sits mostly behind frosted glass, and it paints about twice as fast
        f.art.width=Math.round((W+24)*d);f.art.height=Math.round((H+24)*d);
        paint(f.art,f.recipe,f.seed);
      }
    });
  }
  layout();
  addEventListener('resize',layout);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(layout);

  // Escape or a press outside closes an open folder
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    folders.forEach(function(f){if(f.col.hasAttribute('data-open')){f.setOpen(false);f.hit.focus();}});
  });
  document.addEventListener('pointerdown',function(e){
    folders.forEach(function(f){if(f.col.hasAttribute('data-open')&&!f.col.contains(e.target))f.setOpen(false);});
  });
})(window.Site);
