(function(){

  // FAQ expand / collapse all
  var faqs=[].slice.call(document.querySelectorAll('details.faq'));
  document.getElementById('faq-open').addEventListener('click',function(){faqs.forEach(function(d){d.open=true;});});
  document.getElementById('faq-close').addEventListener('click',function(){faqs.forEach(function(d){d.open=false;});});

  // copy email
  var out=document.getElementById('copy-out');
  document.getElementById('copy-email').addEventListener('click',function(){
    function fallback(){var r=document.createRange();r.selectNodeContents(document.getElementById('email-text'));var s=window.getSelection();s.removeAllRanges();s.addRange(r);out.textContent='Selected. Press Ctrl+C';}
    try{navigator.clipboard.writeText('nuojin@gmail.com').then(function(){out.textContent='Copied'},fallback);}catch(e){fallback();}
  });
})();
