// V98: Order Now is a direct link to the same Food Order URL used by the menu.
(function(){
  document.querySelectorAll('.navOrder,.quickOrderV82').forEach(function(el){
    if(el.tagName==='BUTTON'){
      var a=document.createElement('a');
      a.className=el.className+' orderDirectV98';
      a.href='https://uen.io/diamondrestaurant';
      a.target='_blank';
      a.rel='noopener noreferrer';
      a.textContent=el.textContent||'Order Now';
      el.replaceWith(a);
    }
  });
})();
