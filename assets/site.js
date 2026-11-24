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

// Devis guidé (Formspree) — sans JS, toutes les étapes s'affichent et le POST classique fonctionne
(function(){
  var form=document.getElementById('contact-form');
  if(!form) return;
  var status=document.getElementById('form-status');
  var btn=form.querySelector('button[type=submit]');
  function show(msg,cls){status.textContent=msg;status.className='form-status '+cls;status.hidden=false;}

  var steps=[].slice.call(form.querySelectorAll('.wz-step'));
  var back=form.querySelector('.wz-back'),next=form.querySelector('.wz-next');
  var top=form.querySelector('.wz-top'),bar=form.querySelector('.wz-progress span'),count=form.querySelector('.wz-count');
  var cur=0;
  form.classList.add('js');form.noValidate=true;top.hidden=false;

  function go(n,focus){
    cur=Math.max(0,Math.min(n,steps.length-1));
    steps.forEach(function(s,k){s.classList.toggle('active',k===cur);});
    var last=cur===steps.length-1;
    back.hidden=cur===0;
    next.hidden=last||steps[cur].hasAttribute('data-auto');
    btn.hidden=!last;
    bar.style.width=((cur+1)/steps.length*100)+'%';
    count.textContent='Étape '+(cur+1)+' sur '+steps.length;
    clearErr();
    if(focus){var f=steps[cur].querySelector('input:not([type=hidden]),textarea');if(f)f.focus({preventScroll:true});
      var r=form.getBoundingClientRect();if(r.top<80||r.top>window.innerHeight*0.5)form.scrollIntoView({behavior:'smooth',block:'start'});}
  }
  function clearErr(){var e=form.querySelector('.wz-error');if(e)e.remove();}
  function err(msg){clearErr();var p=document.createElement('p');p.className='wz-error';p.setAttribute('role','alert');p.textContent=msg;steps[cur].appendChild(p);}
  function valid(){
    var s=steps[cur];
    var fields=s.querySelectorAll('input[required]:not([type=radio]),textarea[required]');
    for(var i=0;i<fields.length;i++){if(!fields[i].value.trim()){err('Merci de remplir ce champ : '+fields[i].closest('label').firstChild.textContent.trim()+'.');fields[i].focus();return false;}}
    var radios={};[].forEach.call(s.querySelectorAll('input[type=radio][required]'),function(r){radios[r.name]=1;});
    for(var name in radios){if(!s.querySelector('input[name="'+name+'"]:checked')){err('Choisissez une option pour continuer.');return false;}}
    if(s.querySelector('[name=telephone]')){
      var tel=form.elements.telephone.value.trim(),mail=form.elements.email.value.trim();
      if(!tel&&!mail){err('Indiquez un téléphone ou un email pour qu\'on puisse vous répondre.');return false;}
      if(mail&&!form.elements.email.checkValidity()){err('Cette adresse email ne semble pas valide.');form.elements.email.focus();return false;}
    }
    return true;
  }

  next.addEventListener('click',function(){if(valid())go(cur+1,true);});
  back.addEventListener('click',function(){go(cur-1,true);});
  steps.forEach(function(s){
    if(!s.hasAttribute('data-auto'))return;
    s.addEventListener('change',function(e){if(e.target.type==='radio')setTimeout(function(){go(cur+1,true);},220);});
  });
  form.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target.tagName==='INPUT'&&cur<steps.length-1){e.preventDefault();if(valid())go(cur+1,true);}
  });
  go(0,false);

  form.addEventListener('submit',async function(e){
    e.preventDefault();
    if(!valid())return;
    var data=new FormData(form);
    var prox=data.getAll('proximite');data.delete('proximite');data.set('proximite',prox.length?prox.join(', '):'Non précisé');
    btn.disabled=true;var label=btn.textContent;btn.textContent='Envoi en cours…';status.hidden=true;
    try{
      var res=await fetch(form.action,{method:'POST',body:data,headers:{Accept:'application/json'}});
      if(res.ok){
        var who=(form.elements.name.value.trim().split(' ')[0])||'';
        form.innerHTML='<div class="wz-done"><div class="tick">✓</div><h3>Merci'+(who?' '+who.replace(/[<>&"]/g,''):'')+' !</h3><p>Votre demande est bien partie. Léon vous recontacte rapidement.</p><p>Une urgence ? <a href="tel:+33780012233">07 80 01 22 33</a></p></div>';
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
