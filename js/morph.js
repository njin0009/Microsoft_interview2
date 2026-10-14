(function(S){
  // morph: dissolve one picture into another through noise instead of cutting or cross-fading. A vanilla WebGL port of
  // the "Morph Gallery" shader. An fbm noise field gives every pixel a threshold and progress sweeps past it, so the old
  // picture tears away in drifting tatters; the threshold is biased by the brightness of the incoming picture, so its
  // light areas burn through first. Adapted for transparent PNGs: each picture is drawn like object-fit:contain anchored
  // to the bottom (fit < 1 shrinks it, as the cat is), and everything outside it stays transparent.
  // S.morph(canvas) returns null without WebGL. play() returns false when a picture can't be uploaded (images opened
  // from file:// are cross-origin to WebGL), and the caller then swaps without the effect.
  var VERT='attribute vec2 a_position;varying vec2 v_uv;'+
    'void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}';
  var FRAG=[
    'precision highp float;',
    'uniform sampler2D u_from;uniform sampler2D u_to;',
    'uniform float u_progress,u_scale,u_direction,u_edge,u_drift;',
    'uniform vec2 u_resolution,u_fromImg,u_toImg;', // x = picture aspect, y = fit
    'varying vec2 v_uv;',
    'vec3 permute(vec3 x){return mod(((x*34.)+1.)*x,289.);}',
    'float snoise(vec2 v){',
    '  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);',
    '  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);',
    '  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);',
    '  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.);',
    '  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));',
    '  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;',
    '  vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;',
    '  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);',
    '  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;',
    '  return 130.*dot(m,g);',
    '}',
    'float fbm(vec2 v){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*snoise(v);v*=2.;a*=.5;}return s;}',
    // contain inside a box of full width and fit × height, bottom-centred; transparent outside the picture
    'vec4 pic(sampler2D t,vec2 uv,vec2 img){',
    '  float box=u_resolution.x/(u_resolution.y*img.y);',
    '  vec2 size=box>img.x?vec2(img.x/box,1.):vec2(1.,box/img.x);size.y*=img.y;',
    '  vec2 p=(uv-vec2(.5-size.x*.5,0.))/size;',
    '  if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)return vec4(0.);',
    '  return texture2D(t,p);',
    '}',
    'void main(){',
    '  float adjusted=u_progress*(1.+2.*u_edge)-u_edge;',
    '  float noise=fbm(v_uv*u_scale+vec2(0.,u_progress*u_direction))*.5+.5;',
    '  noise=smoothstep(0.,2.,length(pic(u_to,v_uv,u_toImg).rgb)+noise);',
    '  float mixFactor=1.-smoothstep(adjusted-u_edge,adjusted+u_edge,noise);',
    '  vec4 a=pic(u_from,v_uv+vec2(0.,noise*u_progress*u_drift*u_direction),u_fromImg);',
    '  vec4 b=pic(u_to,v_uv+vec2(0.,noise*(1.-u_progress)*-.5*u_drift*u_direction),u_toImg);',
    '  gl_FragColor=mix(a,b,mixFactor);', // premultiplied alpha in, premultiplied out
    '}'
  ].join('\n');

  function easeInOutQuint(t){return t<.5?16*t*t*t*t*t:1-Math.pow(-2*t+2,5)/2;}

  S.morph=function(canvas,opt){
    opt=opt||{};
    var duration=opt.duration||1100,scale=opt.noiseScale||3.5,edge=opt.edge||.15,drift=opt.drift==null?.25:opt.drift;
    var gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false});
    if(!gl)return null;
    function shader(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    var prog,u={};
    try{
      prog=gl.createProgram();
      gl.attachShader(prog,shader(gl.VERTEX_SHADER,VERT));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,FRAG));
      gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog));
    }catch(e){return null;}
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(prog,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    ['from','to','progress','scale','direction','edge','drift','resolution','fromImg','toImg'].forEach(function(n){u[n]=gl.getUniformLocation(prog,'u_'+n);});
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);

    var cache=[],failed=false,raf=0,timer=0;
    canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();cancelAnimationFrame(raf);failed=true;});
    // one texture per image, uploaded on first use; throws if the image isn't loaded or is cross-origin
    function texture(img){
      for(var k=0;k<cache.length;k++)if(cache[k].img===img)return cache[k].t;
      if(!img.complete||!img.naturalWidth)throw new Error('not loaded');
      var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
      try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);}catch(e){gl.deleteTexture(t);throw e;}
      // pictures aren't powers of two: clamp + linear is the only legal pair in WebGL1
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      cache.push({img:img,t:t});return t;
    }
    // from / to: {img, fit}; dir: 1 forward, -1 back (which way the tatters drift); done runs when the dissolve ends
    function play(from,to,dir,done){
      if(failed)return false;
      var ta,tb;
      try{ta=texture(from.img);tb=texture(to.img);}catch(e){failed=true;return false;}
      var dpr=Math.min(window.devicePixelRatio||1,2),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
      if(!w||!h)return false;
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,ta);gl.uniform1i(u.from,0);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tb);gl.uniform1i(u.to,1);
      gl.uniform2f(u.resolution,w,h);
      gl.uniform2f(u.fromImg,from.img.naturalWidth/from.img.naturalHeight,from.fit||1);
      gl.uniform2f(u.toImg,to.img.naturalWidth/to.img.naturalHeight,to.fit||1);
      gl.uniform1f(u.scale,scale);gl.uniform1f(u.edge,Math.max(edge,.001));gl.uniform1f(u.drift,drift);gl.uniform1f(u.direction,dir<0?-1:1);
      cancelAnimationFrame(raf);clearTimeout(timer);
      var t0=null,ended=false;
      function end(){if(ended)return;ended=true;cancelAnimationFrame(raf);clearTimeout(timer);if(done)done();}
      timer=setTimeout(end,duration+300); // never leave the caller mid-morph if frames stall (background tab)
      function frame(now){
        if(t0===null)t0=now;
        var k=Math.min(Math.max((now-t0)/duration,0),1);
        gl.uniform1f(u.progress,easeInOutQuint(k));
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        if(k<1)raf=requestAnimationFrame(frame);else end();
      }
      frame(performance.now()); // first frame now, so the old picture is on the canvas before the <img> hides
      return true;
    }
    return {play:play};
  };
})(window.Site);
