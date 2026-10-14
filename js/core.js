// shared by every script: the <html> element, whether motion is allowed, and the easing helpers
window.Site=(function(){
  return {
    root:document.documentElement,
    motion:'IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches,
    clamp:function(v){return v<0?0:v>1?1:v;},
    ease:function(v){return 1-Math.pow(1-v,3);},
    easeInOut:function(v){return v<.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2;},
    lerp:function(a,b,t){return a+(b-a)*t;}
  };
})();
