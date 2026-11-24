// Barre de navigation : fond clair après défilement
(function(){
  var nav=document.getElementById('nav');
  if(!nav) return;
  var fixed=nav.hasAttribute('data-solid');
  function onScroll(){nav.classList.toggle('scrolled',fixed||window.scrollY>40);}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
})();

// Formulaire de contact (Formspree) — sans JS, le POST classique fonctionne quand même
(function(){
  var form=document.getElementById('contact-form');
  if(!form) return;
  var status=document.getElementById('form-status');
  var btn=form.querySelector('button[type=submit]');
  function show(msg,cls){status.textContent=msg;status.className='form-status '+cls;status.hidden=false;}
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    btn.disabled=true;var label=btn.textContent;btn.textContent='Envoi en cours…';status.hidden=true;
    try{
      var res=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
      if(res.ok){
        form.reset();
        show('Merci ! Votre message a bien été envoyé. Nous vous recontactons rapidement.','ok');
      }else{
        var data=await res.json().catch(function(){return {};});
        var detail=(data.errors||[]).map(function(x){return x.message;}).join(', ');
        show("Le message n'a pas pu être envoyé"+(detail?' ('+detail+')':'')+'. Appelez-nous au 07 80 01 22 33.','err');
      }
    }catch(err){
      show('Problème de connexion. Réessayez ou appelez-nous au 07 80 01 22 33.','err');
    }finally{
      btn.disabled=false;btn.textContent=label;
    }
  });
})();

// Visionneuse de la galerie
(function(){
  var items=[].slice.call(document.querySelectorAll('[data-lightbox] .shot'));
  if(!items.length) return;
  var lb=document.createElement('div');
  lb.className='lightbox';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Photo agrandie');
  lb.innerHTML='<figure><img alt=""><figcaption></figcaption></figure>'+
    '<button class="lb-btn lb-close" aria-label="Fermer">×</button>'+
    '<button class="lb-btn lb-prev" aria-label="Photo précédente">‹</button>'+
    '<button class="lb-btn lb-next" aria-label="Photo suivante">›</button>';
  document.body.appendChild(lb);
  var img=lb.querySelector('img'),cap=lb.querySelector('figcaption'),i=0,last=null;
  function show(n){
    i=(n+items.length)%items.length;
    var src=items[i].querySelector('img');
    img.src=src.currentSrc||src.src;img.alt=src.alt;
    var fc=items[i].querySelector('figcaption');
    cap.textContent=fc.querySelector('small').textContent+', '+fc.querySelector('strong').textContent;
  }
  function open(n){last=document.activeElement;show(n);lb.classList.add('open');document.body.style.overflow='hidden';lb.querySelector('.lb-close').focus();}
  function close(){lb.classList.remove('open');document.body.style.overflow='';if(last)last.focus();}
  items.forEach(function(it,n){it.querySelector('button').addEventListener('click',function(){open(n);});});
  lb.querySelector('.lb-close').onclick=close;
  lb.querySelector('.lb-prev').onclick=function(){show(i-1);};
  lb.querySelector('.lb-next').onclick=function(){show(i+1);};
  lb.addEventListener('click',function(e){if(e.target===lb)close();});
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('open'))return;
    if(e.key==='Escape')close();
    if(e.key==='ArrowLeft')show(i-1);
    if(e.key==='ArrowRight')show(i+1);
  });
})();
