// Défilement doux et plus lent vers les ancres de la page
window.slowScroll=function(el){
  var offset=parseFloat(getComputedStyle(el).scrollMarginTop)||0;
  var start=window.scrollY,end=start+el.getBoundingClientRect().top-offset;
  var max=document.documentElement.scrollHeight-window.innerHeight;end=Math.max(0,Math.min(end,max));
  var dist=end-start;
  function to(y){window.scrollTo({top:y,behavior:'instant'});}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||Math.abs(dist)<2){to(end);return;}
  var dur=Math.min(1600,Math.max(900,Math.abs(dist)*0.6)),t0=null;
  function ease(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  function step(ts){if(t0===null)t0=ts;var p=Math.min(1,(ts-t0)/dur);to(start+dist*ease(p));if(p<1)requestAnimationFrame(step);}
  requestAnimationFrame(step);
};
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href^="#"]');
  if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;
  var id=a.getAttribute('href').slice(1),el=id&&document.getElementById(id);
  if(!el)return;
  e.preventDefault();
  slowScroll(el);
  history.pushState(null,'','#'+id);
});

// Barre de navigation : fond clair après défilement
(function(){
  var nav=document.getElementById('nav');
  if(!nav) return;
  var fixed=nav.hasAttribute('data-solid');
  var call=document.querySelector('.mobile-call');
  var hero=document.querySelector('.hero');
  function onScroll(){
    nav.classList.toggle('scrolled',fixed||window.scrollY>40);
    // Bouton d'appel mobile : visible une fois le premier écran passé (immédiatement sur les sous-pages)
    if(call) call.classList.toggle('show',!hero||window.scrollY>hero.offsetHeight*0.6);
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
})();

// Demande de visite (Formspree) — sans JS, le POST classique fonctionne aussi
(function(){
  var form=document.getElementById('contact-form');
  if(!form) return;
  var status=document.getElementById('form-status');
  var btn=form.querySelector('button[type=submit]');
  function show(msg,cls){status.textContent=msg;status.className='form-status '+cls;status.hidden=false;}
  form.noValidate=true;

  function clearErr(){var e=form.querySelector('.form-error');if(e)e.remove();}
  function err(msg,field){clearErr();var p=document.createElement('p');p.className='form-error';p.setAttribute('role','alert');p.textContent=msg;btn.before(p);if(field)field.focus();}
  form.addEventListener('input',clearErr);
  function valid(){
    var f=form.elements;
    if(!f.name.value.trim()){err('Merci d\'indiquer votre nom.',f.name);return false;}
    var tel=f.telephone.value.trim(),mail=f.email.value.trim();
    if(!tel&&!mail){err('Indiquez un téléphone ou un email pour que Léon puisse vous rappeler.',f.telephone);return false;}
    if(mail&&!f.email.checkValidity()){err('Cette adresse email ne semble pas valide.',f.email);return false;}
    if(!f.commune.value.trim()){err('Merci d\'indiquer votre commune.',f.commune);return false;}
    return true;
  }

  form.addEventListener('submit',async function(e){
    e.preventDefault();
    if(!valid())return;
    var data=new FormData(form);
    btn.disabled=true;var label=btn.textContent;btn.textContent='Envoi en cours…';status.hidden=true;
    try{
      var res=await fetch(form.action,{method:'POST',body:data,headers:{Accept:'application/json'}});
      if(res.ok){
        var who=(form.elements.name.value.trim().split(' ')[0])||'';
        form.innerHTML='<div class="form-done"><div class="tick">✓</div><h3>Merci'+(who?' '+who.replace(/[<>&"]/g,''):'')+' !</h3><p>Votre demande est bien partie. Léon vous rappelle pour fixer la visite.</p><p>Une urgence ? <a href="tel:+33780012233">07 80 01 22 33</a></p></div>';
        return;
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

// Apparition douce des blocs au défilement
(function(){
  var els=[].slice.call(document.querySelectorAll('.reveal'));
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting) return;
      var sib=[].slice.call(en.target.parentNode.children).filter(function(c){return c.classList.contains('reveal');});
      en.target.style.transitionDelay=Math.min(sib.indexOf(en.target),3)*90+'ms';
      en.target.classList.add('in');io.unobserve(en.target);
    });
  },{rootMargin:'0px 0px -8% 0px',threshold:.08});
  els.forEach(function(e){io.observe(e);});
})();
