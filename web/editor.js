(function(){
  'use strict';
  const M=CarnetCampaign,E=CarnetExport,I=CarnetIcons.render,$=s=>document.querySelector(s);
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const baseline=window.CarnetInitialCampaign||M.fromContent(CarnetContent),key='carnet.editor.draft.v1.'+baseline.slug+'.'+baseline.creator;
  let draft=M.clone(baseline),tab='general',selected=0,history=[],simulated=new Set(),noticeTimer,storageFailed=false,lastEdit=null;
  try{const stored=JSON.parse(localStorage.getItem(key));if(stored?.schema==='dofus-campaign/v1'&&Array.isArray(stored.objectives)&&Array.isArray(stored.permits)&&stored.victory)draft=stored;}catch{}
  function notice(message,error=false){clearTimeout(noticeTimer);const el=$('#editor-notice');el.hidden=false;el.classList.toggle('is-error',error);el.textContent=message;noticeTimer=setTimeout(()=>el.hidden=true,error?12000:6000);}
  function remember(){history.push(M.clone(draft));if(history.length>80)history.shift();}
  function save(){try{localStorage.setItem(key,JSON.stringify(draft));storageFailed=false;}catch{storageFailed=true;}status();}
  function status(){
    const r=M.validate(draft),start=draft.objectives.filter(o=>o.requires.length===0).length;
    $('#draft-title').textContent=draft.title||'Campagne sans titre';$('#objectives-count').textContent=draft.objectives.length;$('#permits-count').textContent=draft.permits.length;
    $('#save-state').textContent=storageFailed?'Sauvegarde locale indisponible · télécharge le JSON pour conserver ton travail':'Brouillon conservé dans ce navigateur · télécharge le JSON pour le réutiliser ailleurs';
    $('#undo-button').disabled=!history.length;
    $('#editor-summary').textContent=draft.objectives.length+' objectifs · '+draft.permits.length+' autorisations · '+start+' accessibles au départ · '+(r.errors.length?r.errors.length+' erreur(s) à corriger':'configuration prête à exporter');
  }
  const intro=(title,sub)=>`<div class="editor-intro"><h2>${escape(title)}</h2><p>${escape(sub)}</p></div>`;
  const field=(label,key,value,help='',type='text',attrs='')=>`<label for="field-${key}">${escape(label)}</label><input id="field-${key}" data-field="${key}" type="${type}" value="${escape(value)}" ${attrs}>${help?`<small>${escape(help)}</small>`:''}`;
  const textarea=(label,key,value,cls='')=>`<label for="field-${key}">${escape(label)}</label><textarea id="field-${key}" data-field="${key}" class="${cls}">${escape(value)}</textarea>`;
  const select=(label,key,value,options)=>`<label for="field-${key}">${escape(label)}</label><select id="field-${key}" data-field="${key}">${options.map(x=>`<option value="${escape(x)}" ${x===value?'selected':''}>${escape(key==='icon'?({star:'Étoile',swords:'Combat',leaf:'Récolte',compass:'Exploration',hammer:'Artisanat',scroll:'Quêtes',crystal:'Élément',shield:'Bouclier',helmet:'Équipement',gift:'Cadeau',trophy:'Victoire',book:'Livre'}[x]||x):x)}</option>`).join('')}</select>`;
  function checks(list,group,chosen){return `<div class="check-list">${list.map(x=>`<label class="check-line"><input type="checkbox" data-group="${group}" value="${escape(x.name||x.id)}" ${chosen.includes(x.name||x.id)?'checked':''}><span><strong>${escape(x.title)}</strong><small>${escape(x.description||'')}</small></span></label>`).join('')}</div>`;}
  function general(){return intro('Une campagne qui te ressemble','Définis le cadre avant de remplir le carnet. Toutes ces règles seront livrées avec ta campagne.')+`<div class="editor-grid"><section class="editor-panel editor-form">${field('Titre de l’aventure','title',draft.title,'Ex. : L’apprenti des quatre vents.','text','maxlength="100"')}${field('Identifiant de campagne','slug',draft.slug,'Lettres et chiffres sans accents, en commençant par une lettre.','text','maxlength="40"')}${field('Créateur','creator',draft.creator,'Lettres et chiffres sans accents.','text','maxlength="30"')}${field('Nom du joueur Archipelago','player',draft.player,'Le nom à utiliser dans le YAML et les clients (16 caractères maximum).','text','maxlength="16"')}</section><section class="editor-panel editor-form"><h3>Les règles de départ</h3>${textarea('Classe, éléments, équipements, activités libres et contraintes','rules',draft.rules,'rules')}<small>Écris explicitement ce qui est libre au départ et ce qui attend une autorisation. Ces règles sont appliquées par les joueurs.</small><div class="editor-warning">Une autorisation est un objet Archipelago. Sa réception t’accorde un droit dans Dofus ; elle ne change pas ton personnage automatiquement.</div><div class="editor-list-toolbar"><button class="button" data-action="example">Recharger les 12 objectifs d’exemple</button><button class="button subtle" data-action="blank">Partir d’une campagne vide</button></div></section></div>`;}
  function collection(kind){
    const objectives=kind==='objectives',list=draft[kind];selected=Math.max(0,Math.min(selected,list.length-1));const x=list[selected];
    const left=`<section class="editor-panel"><div class="editor-list-toolbar"><button class="button primary" data-action="add">+ ${objectives?'Objectif':'Autorisation'}</button>${x?'<button class="button" data-action="duplicate">Dupliquer</button>':''}</div><div class="editor-list">${list.map((o,i)=>`<button class="editor-list-item ${i===selected?'active':''}" data-select="${i}">${I(o.icon)}<span><strong>${escape(o.title||'Sans titre')}</strong><small>${escape(objectives?(o.requires.length?'Attend '+o.requires.length+' autorisation(s)':'Disponible au départ'):(o.kind+' · objet à recevoir'))}</small></span><b>${i+1}</b></button>`).join('')||'<div class="editor-empty">Aucune autorisation.<br>Les activités sont libres tant qu’aucun permis n’est exigé.</div>'}</div></section>`;
    let right='<section class="editor-panel editor-empty">Ajoute une autorisation pour définir un nouveau droit.</section>';
    if(x){right=`<section class="editor-panel editor-form">${field(objectives?'Titre de l’objectif':'Nom de l’autorisation','title',x.title,'Ce nom apparaît dans le carnet.','text','maxlength="160"')}${textarea(objectives?'Action à réaliser et contraintes':'Ce que la réception autorise','description',x.description)}<div class="field-row">${objectives?field('Catégorie','category',x.category,'Ex. : Exploration, Quêtes, Combat, Récolte.','text','maxlength="60"'):select('Type d’autorisation','kind',x.kind,M.kinds)}${select('Icône','icon',x.icon,M.icons)}</div>`;
      if(objectives)right+=`<label>Autorisations nécessaires (toutes)</label>${draft.permits.length?checks(draft.permits,'requires',x.requires):'<small>Aucun permis défini : cet objectif est libre.</small>'}<label class="inline-check"><input id="use-counter" type="checkbox" ${x.counter?'checked':''}> Compter plusieurs actions</label>${x.counter?`<div class="field-row">${field('Clé du compteur','counter',x.counter,'Même clé = même compteur cumulatif. Lettres sans accents, chiffres, _ ou -.','text','maxlength="60"')}${field('Quantité à atteindre','target',x.target,'Ex. : 1 puis 3 avec la même clé pour deux paliers.','number','min="1" max="1000000" step="1"')}</div>`:''}`;
      right+=`<details><summary>Identifiant Archipelago</summary>${field('Nom envoyé à Manual et au serveur','name',x.name,'Unique. Évite | : { } @ et les retours à la ligne. Changer ce nom prépare une nouvelle génération.','text','maxlength="160"')}<small>Identifiant interne : ${escape(x.id)}</small></details><div class="editor-item-tools"><div><button class="button subtle" data-action="up" ${selected===0?'disabled':''}>↑ Monter</button><button class="button subtle" data-action="down" ${selected===list.length-1?'disabled':''}>↓ Descendre</button></div><button class="button danger-button" data-action="remove">Supprimer</button></div></section>`;
    }
    return intro(objectives?'Les étapes de l’aventure':'Les clés des autres mondes',objectives?'Un objectif accompli puis validé envoie un objet tiré au sort dans le multiworld. Mélange combats, quêtes, récolte, exploration et défis personnels.':'Chaque autorisation sera placée une fois par Archipelago. Définis son effet et relie-la aux objectifs concernés.')+`<div class="editor-grid">${left}${right}</div>`;
  }
  function victory(){
    const v=draft.victory,goalPermits=M.requiredPermits(draft);
    return intro('Écrire le dernier chapitre','Choisis ce qui termine ta run. Les autres objectifs restent des emplacements de récompenses pour le groupe.')+`<div class="editor-grid"><section class="editor-panel editor-form"><h3>Objectifs exigés</h3><label for="field-victoryMode">Condition de fin</label><select id="field-victoryMode" data-field="victoryMode"><option value="all" ${v.mode==='all'?'selected':''}>Tous les objectifs</option><option value="selected" ${v.mode==='selected'?'selected':''}>Une sélection d’objectifs</option></select>${v.mode==='selected'?checks(draft.objectives.map(o=>({...o,name:o.id})),'victoryObjectives',v.objectives):`<p>Les ${draft.objectives.length} objectifs sont obligatoires.</p>`}</section><section class="editor-panel"><h3>Autorisations supplémentaires</h3><p>Les permis nécessaires aux objectifs de victoire sont automatiquement exigés. Ajoute ici d’autres autorisations à recevoir.</p>${checks(draft.permits,'victoryPermits',v.permits)}<div class="editor-warning">Au total : ${goalPermits.length} autorisation(s) requise(s). Le carnet vérifie les objectifs validés. Avec Manual Client, il faut respecter la liste manuellement avant de cocher la victoire.</div></section></div>`;
  }
  function preview(){
    const r=M.validate(draft),start=draft.objectives.filter(o=>!o.requires.length).length;
    let game='Corrige les erreurs pour obtenir l’identifiant.';if(!r.errors.length)game=M.compile(draft).game;
    return intro('Relire, essayer, emporter','Simule les permis reçus, vérifie les chemins puis exporte les fichiers de ta prochaine partie.')+`<div class="stat-grid"><div class="stat-card"><b>${draft.objectives.length}</b><span>objectifs / objets envoyés</span></div><div class="stat-card"><b>${draft.permits.length}</b><span>autorisations à recevoir</span></div><div class="stat-card"><b>${start}</b><span>objectifs libres au départ</span></div></div><div class="editor-grid"><div><section class="editor-panel preview-permits"><h3>Simuler des autorisations reçues</h3><p>Coche des permis pour voir les objectifs accessibles. Cette simulation n’envoie rien.</p>${checks(draft.permits,'simulate',[...simulated])}</section><section class="editor-panel export-box"><h3 class="${r.errors.length?'validation-errors':'validation-ok'}">${r.errors.length?'À corriger avant l’export':'La campagne peut être exportée'}</h3>${r.errors.length?`<ul class="audit-list validation-errors">${r.errors.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:''}<ul class="audit-list">${r.warnings.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><p class="mono">${escape(game)}</p><button class="button primary" data-action="export" ${r.errors.length?'disabled':''}>Télécharger le pack de campagne</button><button class="button subtle" data-action="save">Sauvegarder le JSON</button><div class="editor-warning">L’export contient l’APWorld, le YAML, le carnet et les règles. Il faut ensuite générer une nouvelle partie avec les YAML de tes amis. Changer les règles ou les objectifs change l’identité du monde. Le nom du joueur peut varier pour une même campagne.</div></section></div><section class="editor-panel"><h3>Le carnet de ta campagne</h3><div class="initial-rules">${escape(draft.rules)}</div><div class="preview-list">${draft.objectives.map(o=>{const ok=o.requires.every(n=>simulated.has(n));return `<article class="preview-objective ${ok?'':'locked'}">${I(ok?o.icon:'lock')}<div><h4>${escape(o.title)}</h4><p>${escape(o.description)}</p><small>${ok?'Disponible':'Attend : '+escape(o.requires.filter(n=>!simulated.has(n)).join(', '))}${o.counter?' · 0 / '+o.target:''}</small></div></article>`;}).join('')}</div></section></div>`;
  }
  function render(){
    lastEdit=null;
    document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false');});
    $('#editor-main').innerHTML=tab==='general'?general():tab==='objectives'||tab==='permits'?collection(tab):tab==='victory'?victory():preview();status();
  }
  function changed(){save();render();}
  function replace(p){remember();draft=p;selected=0;simulated.clear();changed();}
  function target(){return (tab==='objectives'||tab==='permits')?draft[tab][selected]:draft;}
  function commitField(el){
    if(lastEdit!==el){remember();lastEdit=el;}
    const k=el.dataset.field,x=target();
    if(k==='victoryMode')draft.victory.mode=el.value;
    else if(k==='name'){x.autoName=false;if(tab==='permits')M.renamePermit(draft,selected,el.value.trim());else x.name=el.value;}
    else{x[k]=k==='target'?Number(el.value):el.value;if(k==='title'&&x!==draft&&x.autoName){if(tab==='permits')M.renamePermit(draft,selected,el.value);else x.name=el.value;}}
    save();
    if(k==='title'&&x!==draft){const label=document.querySelector('[data-select="'+selected+'"] strong');if(label)label.textContent=x.title||'Sans titre';}
  }
  document.addEventListener('change',e=>{
    const el=e.target;
    if(el.id==='import-file')return;
    if(el.matches('[data-field]')){
      commitField(el);
      if(el.tagName==='SELECT')render();
    }else if(el.id==='use-counter'){
      remember();const x=target();if(el.checked){x.counter='compteur_'+x.id.replace(/[^A-Za-z0-9_-]/g,'').slice(-12);x.target=1;}else{delete x.counter;delete x.target;}changed();
    }else if(el.dataset.group){
      const group=el.dataset.group;
      if(group==='simulate'){el.checked?simulated.add(el.value):simulated.delete(el.value);render();return;}
      remember();const arr=group==='requires'?target().requires:group==='victoryObjectives'?draft.victory.objectives:draft.victory.permits;
      if(el.checked&&!arr.includes(el.value))arr.push(el.value);if(!el.checked){const i=arr.indexOf(el.value);if(i>=0)arr.splice(i,1);}changed();
    }
  });
  document.addEventListener('input',e=>{
    if(e.target.matches('input[data-field],textarea[data-field]'))commitField(e.target);
  });
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-tab]');if(nav){tab=nav.dataset.tab;selected=0;render();return;}
    const pick=e.target.closest('[data-select]');if(pick){selected=Number(pick.dataset.select);render();return;}
    const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
    try{
      const action=b.dataset.action,list=draft[tab],x=target();
      if(action==='export-tab'){tab='preview';render();}
      else if(action==='import')$('#import-file').click();
      else if(action==='save'){E.download('campagne.json',JSON.stringify(draft,null,2)+'\n','application/json');notice('JSON sauvegardé. Tu peux le réimporter et le partager.');}
      else if(action==='export'){
        const pack=E.packageCampaign(draft,CarnetExportAssets);E.download('Campagne_'+draft.slug+'_'+pack.compiled.hash+'.zip',E.zip(pack.files),'application/zip');notice('Pack exporté : installe son APWorld puis génère la partie avec les YAML du groupe.');
      }else if(action==='undo'){if(history.length){draft=history.pop();selected=0;changed();}}
      else if(action==='example'||action==='blank'){
        if(!confirm('Remplacer le brouillon ? Tu pourras annuler cette action.'))return;
        const p=M.clone(baseline);if(action==='blank'){p.title='Ma nouvelle campagne';p.objectives=[M.newObjective()];p.objectives[0].title='Mon premier objectif';p.objectives[0].name='Mon premier objectif';p.permits=[];p.victory={mode:'all',objectives:[],permits:[]};}replace(p);
      }else if(action==='add'){remember();list.push(tab==='objectives'?M.newObjective():M.newPermit());selected=list.length-1;changed();}
      else if(action==='duplicate'){remember();const copy=M.clone(x);copy.id=M.id(tab==='objectives'?'objectif':'permis');copy.autoName=false;copy.title+=' (copie)';copy.name+=' - copie '+copy.id.slice(-6);list.splice(selected+1,0,copy);selected++;changed();}
      else if(action==='remove'){
        const affected=tab==='permits'?draft.objectives.filter(o=>o.requires.includes(x.name)).length:0;
        if(!confirm('Supprimer « '+x.title+' » ?'+(affected?' Ce permis sera retiré des '+affected+' objectifs qui l’exigent.':'')+' Tu pourras annuler cette action.'))return;
        remember();if(tab==='permits')M.removePermit(draft,selected);else{list.splice(selected,1);draft.victory.objectives=draft.victory.objectives.filter(n=>n!==x.id);}selected=Math.max(0,selected-1);changed();
      }else if(action==='up'||action==='down'){const next=selected+(action==='up'?-1:1);if(next>=0&&next<list.length){remember();[list[selected],list[next]]=[list[next],list[selected]];selected=next;changed();}}
    }catch(error){notice(error.message,true);}
  });
  $('#import-file').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>2000000)throw Error('Fichier trop volumineux (2 Mo maximum).');const p=JSON.parse(await file.text()),r=M.validate(p);if(r.errors.length)throw Error(r.errors.join('\n'));replace(p);notice('Campagne importée. Ton ancien brouillon reste accessible avec Annuler.');}
    catch(error){notice('Import impossible : '+error.message,true);}finally{e.target.value='';}
  });
  window.addEventListener('beforeunload',e=>{if(document.activeElement?.matches('[data-field]'))document.activeElement.blur();});
  $('#editor-emblem').innerHTML=I('egg');render();
})();
