(function(S){
  var motion=S.motion;

  // persona backdrop: the "Pulse Bars / slitted glass" gradient (21st.dev) behind the hero panel while a persona is open.
  // Six vertical bars rise from the bottom along a ramp envelope (tallest on the left, behind the picture, so the text
  // side stays mostly navy); each is filled with the palette from its foot
  // (navy) to its top (cream), shorter bars fade further toward the navy backdrop, and the bar tops shimmer.
  // Drawn per pixel on a small canvas that CSS scales up, so the smooth upscaling gives the soft edges between bars.
  // Every animated term is a sine of (its own phase + 2π·spin), so the frame at t = 0 is the static frame: no snap
  // when motion starts. Nothing is rounded per frame.
  var STOPS=[[0,[0x12,0x3a,0x6b]],[.63,[0xe4,0x67,0x6b]],[.91,[0xf4,0xb3,0xc2]],[1,[0xfb,0xf3,0xe7]]],
      BACK=[0x12,0x3a,0x6b],
      COUNT=6,SCALE=.68,FADE=.25,DIST=.28,VIGNETTE=.13,AMT=.35,SPEED=.17,DIR=1,
      LW=COUNT*8,LH=96,TAU=Math.PI*2;
  function palette(t,out){
    var j=1;while(j<STOPS.length-1&&STOPS[j][0]<t)j++;
    var a=STOPS[j-1],b=STOPS[j],f=Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0])));f=f*f*(3-2*f);
    for(var k=0;k<3;k++)out[k]=a[1][k]+(b[1][k]-a[1][k])*f;
  }
  function smooth(e0,e1,x){var t=Math.min(1,Math.max(0,(x-e0)/(e1-e0)));return t*t*(3-2*t);}

  var screen=document.querySelector('.hero .screen');if(!screen)return;
  var cv=document.createElement('canvas');cv.className='pulse-bg';cv.setAttribute('aria-hidden','true');cv.width=LW;cv.height=LH;
  screen.insertBefore(cv,screen.firstChild);
  var ctx=cv.getContext('2d'),img=ctx.createImageData(LW,LH),px=img.data,col=[0,0,0];

  function draw(t){
    var spin=t*SPEED*DIR; // ph · dir
    var heights=[],fades=[];
    for(var i=0;i<COUNT;i++){
      var xi=i/(COUNT-1),env=.38+.62*(1-xi), // ramp envelope, falling left to right
          shimmer=AMT*(.5*Math.sin(i*1.7+.9+TAU*spin)+.25*Math.sin(i*2.9+2.3+TAU*spin*1.6));
      heights.push(Math.min(.97,SCALE*env*(1+shimmer)));
      fades.push(FADE*(1-env)*1.6);
    }
    for(var y=0;y<LH;y++){
      var yb=1-(y+.5)/LH,yy=(y+.5)/LH-.5;
      for(var x=0;x<LW;x++){
        var u=(x+.5)/LW,b=Math.min(COUNT-1,Math.floor(u*COUNT)),xl=u*COUNT-b,
            h=heights[b]+DIST*.05*Math.sin(xl*TAU+b*2.1+TAU*spin*.5), // distortion: the bar tops wave
            tt=yb/h,r,g,bl;
        palette(Math.min(1,tt),col);
        var f=fades[b];r=col[0]+(BACK[0]-col[0])*f;g=col[1]+(BACK[1]-col[1])*f;bl=col[2]+(BACK[2]-col[2])*f;
        // above the bar: a short glow off its top, then the backdrop
        var above=tt>1?smooth(0,.18,tt-1):0,glow=tt>1?.35*Math.exp(-(tt-1)*9):0;
        r=r+(BACK[0]-r)*above;g=g+(BACK[1]-g)*above;bl=bl+(BACK[2]-bl)*above;
        r+=(0xf4-r)*glow*(1-fades[b]);g+=(0xb3-g)*glow*(1-fades[b]);bl+=(0xc2-bl)*glow*(1-fades[b]);
        // a navy wash down from the top, and a light vignette
        var wash=.25*yb*yb;r+=(BACK[0]-r)*wash;g+=(BACK[1]-g)*wash;bl+=(BACK[2]-bl)*wash;
        // the foot melts into the navy the journey band starts with, so the band has no seam at the bottom
        var sink=smooth(.2,0,yb);r+=(7-r)*sink;g+=(29-g)*sink;bl+=(74-bl)*sink;
        var ux=u-.5,vig=VIGNETTE*.8*smooth(.52,1,Math.sqrt(ux*ux+yy*yy)*1.414);
        var o=(y*LW+x)*4;px[o]=r*(1-vig);px[o+1]=g*(1-vig);px[o+2]=bl*(1-vig);px[o+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
  }

  // runs only while a persona is open and the panel is on screen; the clock pauses in between, so it resumes smoothly
  var on=false,inview=false,run=false,clock=0,last=0;
  function frame(ts){
    if(!run)return;
    if(last)clock+=Math.min(.1,(ts-last)/1000);last=ts;
    draw(clock);
    requestAnimationFrame(frame);
  }
  function sync(){
    var want=on&&inview&&motion;
    if(want&&!run){run=true;last=0;requestAnimationFrame(frame);}
    else if(!want)run=false;
  }
  draw(0);
  new MutationObserver(function(){on=screen.classList.contains('persona-on');sync();}).observe(screen,{attributes:true,attributeFilter:['class']});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){inview=es[0].isIntersecting;sync();}).observe(screen);
})(window.Site);
