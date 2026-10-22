(function(){
  'use strict';
  const C=window.CarnetContent,I=window.CarnetIcons.render;
  const $=s=>document.querySelector(s);
  let safeStorage=null;try{safeStorage=window.localStorage;}catch{}
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
  const defaultContent=JSON.parse(JSON.stringify(C)),campaignKey='carnet.activeCampaign.'+C.game;
  const storedCampaign=read(campaignKey,null);
  try{if(storedCampaign){const restored=CarnetCampaign.compile(storedCampaign).content;for(const key of Object.keys(C))delete C[key];Object.assign(C,restored);}}catch{}
  let campaignGame=C.game,connectionKey='carnet.connection.'+campaignGame;
  let connection=read(connectionKey,{server:'localhost:38281',name:C.player||'JoueurDofus',legacy:false});
  if(connection.legacy&&C.compatibilityGame)C.game=C.compatibilityGame;
  let profile=read('carnet.profile',{});
  let uuid=read('carnet.uuid',null);
  if(!uuid){uuid=crypto.randomUUID?.()||'carnet-'+Date.now()+'-'+Math.random().toString(36).slice(2);write('carnet.uuid',uuid);}
  let view='overview',filter='available',query='',category='',previousConnection='offline';
  const client=new CarnetEngine.CarnetClient(C,{storage:safeStorage,uuid,onChange:render,onNotice:toast});
  window.carnetClient=client;
  function toast(title,message,icon='gift'){
    const t=document.createElement('div');t.className='toast'+(icon==='error'?' error':'');
    t.innerHTML=I(icon==='error'?'shield':icon)+`<div><strong>${escape(title)}</strong><p>${escape(message)}</p></div><button class="toast-close" aria-label="Fermer la notification">×</button>`;
    t.querySelector('button').onclick=()=>t.remove();$('#toast-region').append(t);setTimeout(()=>t.remove(),6500);
    while($('#toast-region').children.length>3)$('#toast-region').firstChild.remove();
  }
  function state(o){return client.isChecked(o)?'done':client.unlocked(o)?'available':'locked';}
  function totalState(s){return C.objectives.filter(o=>state(o)===s).length;}
  function age(at){if(!at)return 'Déjà reçu dans cette partie';const d=Math.max(0,Date.now()-at);if(d<60000)return 'À l’instant';if(d<3600000)return 'Il y a '+Math.floor(d/60000)+' min';return new Date(at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}
  function heading(title,sub,eyebrow){return `<div class="page-heading"><p class="eyebrow">${escape(eyebrow||'LE MONDE DES DOUZE, ENSEMBLE')}</p><h1>${escape(title)}</h1><p>${escape(sub)}</p></div>`;}
  function questCard(o){
    const index=C.objectives.indexOf(o),s=state(o),n=client.progress(o),pending=client.pending.has(client.locationId(o));
    const permit=o.requires.map(n=>C.permits.find(p=>p.name===n)?.title||n).join(', ');
    const allowed=client.canCheck(o);
    const counter=o.counter&&s==='available'?`<div class="counter-control" role="group" aria-label="Compteur ${escape(o.title)}"><button data-action="counter" data-index="${index}" data-delta="-1" aria-label="Retirer une unité" ${n<=0?'disabled':''}>−</button><input type="number" min="0" max="${Math.max(...C.objectives.filter(x=>x.counter===o.counter).map(x=>x.target))}" value="${n}" data-counter="${index}" aria-label="Progression ${escape(o.title)}"><button data-action="counter" data-index="${index}" data-delta="1" aria-label="Ajouter une unité" ${n>=o.target?'disabled':''}>+</button></div>`:'';
    return `<article class="quest-card ${s}" data-objective="${index}">
      <div class="quest-illustration">${I(s==='locked'?'lock':o.icon)}</div>
      <div class="quest-body"><span class="category-tag tag-${escape(o.category)}">${escape(o.category.toLocaleUpperCase('fr'))}</span><h2>${escape(o.title)}</h2><p class="quest-description">${escape(o.description)}</p>
      ${s==='locked'?`<div class="lock-label">${I('lock')} Nécessite : ${escape(permit)}</div>`:s==='done'?'':o.counter?`<div class="counter-row"><div class="counter-track" role="progressbar" aria-label="${escape(o.title)}" aria-valuemin="0" aria-valuemax="${o.target}" aria-valuenow="${n}"><span style="width:${n/o.target*100}%"></span></div><span class="counter-label">${n} / ${o.target}</span></div>`:o.requires.length?`<span class="quest-permit">${I('check')}${escape(permit)} reçu</span>`:''}</div>
      ${s==='locked'?'':`<div class="quest-actions">${s==='done'?`<span class="done-label">${I('check')}Accompli</span>`:`${counter}<button class="button primary" data-action="validate" data-index="${index}" ${allowed?'':'disabled'} title="${escape(pending?'En attente de confirmation du serveur':!client.unlocked(o)?'Permis manquant':o.counter&&n<o.target?'Accomplis l’objectif puis renseigne le compteur':client.mode!=='demo'&&client.connection!=='online'?'Connecte le carnet pour valider':'Valider cet objectif accompli dans Dofus')}">${I(pending?'link':'check')}${pending?'Envoi…':'Valider'}</button>`}</div>`}
    </article>`;
  }
  function tabs(all=false){
    return `<div class="page-tools"><div class="filter-tabs ${all?'all-tabs':''}" role="tablist" aria-label="État des objectifs">${(all?[['all','Tous',C.objectives.length,'book']]:[]).concat([['available','Disponibles',totalState('available'),'compass'],['locked','Verrouillés',totalState('locked'),'lock'],['done','Terminés',totalState('done'),'check']]).map(([id,label,n,icon])=>`<button class="filter-tab ${filter===id?'active':''}" role="tab" aria-selected="${filter===id}" data-action="filter" data-filter="${id}">${id==='available'?'':I(icon)}${label}<b>${n}</b></button>`).join('')}</div></div>`;
  }
  function goalCard(){
    const goals=client.goalObjectives(),permits=client.goalPermits(),done=goals.filter(o=>client.isChecked(o)).length,unlocks=permits.filter(n=>client.has(n)).length;
    return `<section class="goal-card ${client.goal?'finished':''}">${I('trophy')}<div><h2>${client.goal?'Une aventure accomplie !':'Le dernier chapitre'}</h2><p>${client.goal?'Ta victoire '+(client.mode==='demo'?'est simulée en aperçu.':'est enregistrée sur Archipelago.'):`${done} / ${goals.length} objectifs requis · ${unlocks} / ${permits.length} autorisations requises`}</p><details><summary>Conditions de victoire</summary><ul>${goals.map(o=>`<li>${client.isChecked(o)?'✓ ':''}${escape(o.title)}</li>`).join('')}</ul></details></div>${client.goal?I('check'):`<button class="button ${client.canGoal()?'primary':'subtle'}" data-action="finish" ${client.canGoal()?'':'disabled'}>${client.goalPending?'Confirmation…':'Déclarer la victoire'}</button>`}</section>`;
  }
  function emptyObjectives(){return `<div class="empty-state">${I(filter==='done'?'scroll':filter==='locked'?'check':'compass')}<h2>${filter==='done'?'Le voyage commence':filter==='locked'?'La voie est libre':'Un nouveau chemin t’attend'}</h2><p>${filter==='done'?'Tes objectifs accomplis apparaîtront ici.':filter==='locked'?'Tous les objectifs ont leurs autorisations.':'Essaie un autre filtre ou consulte les autorisations manquantes.'}</p><button class="button" data-action="filter" data-filter="all">Voir tous les objectifs</button></div>`;}
  function renderMain(){
    const focus=document.activeElement;const caret=focus?.id==='objective-search'?focus.selectionStart:null;
    let html='';
    if(view==='overview'||view==='objectives'){
      html+=heading(view==='overview'?(C.title||'La suite de ton aventure'):'Ton carnet d’objectifs',view==='overview'?'Chaque petit pas fait avancer ton monde… et celui de tes amis.':'Retrouve tes objectifs, leurs prérequis et leur progression.');
      html+=tabs(view==='objectives'||filter==='all');
      if(view==='objectives')html+=`<div class="category-search"><input type="search" id="objective-search" aria-label="Rechercher un objectif" placeholder="Rechercher dans le carnet…" value="${escape(query)}"><select id="category-filter" aria-label="Filtrer par catégorie"><option value="">Toutes les catégories</option>${[...new Set(C.objectives.map(o=>o.category))].map(c=>`<option ${category===c?'selected':''}>${escape(c)}</option>`).join('')}</select></div>`;
      let objectives=C.objectives.filter(o=>(filter==='all'||state(o)===filter)&&(view!=='objectives'||(!category||o.category===category)&&(!query||(o.title+' '+o.description+' '+o.category).toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')))));
      html+=objectives.length?`<div class="quest-list">${objectives.map(questCard).join('')}</div>`:emptyObjectives();
      if(view==='overview'&&filter==='available'){
        const later=C.objectives.find(o=>state(o)==='locked');
        if(later)html+=`<div class="section-caption"><span>Un peu plus loin sur le chemin</span><button data-action="filter" data-filter="locked">Voir les ${totalState('locked')} objectifs</button></div>${questCard(later)}`;
      }
      html+=goalCard();
      if(client.mode==='demo')html+=`<div class="demo-tool"><button class="button subtle" data-action="demo-unlock">${I('gift')}Simuler un permis reçu</button><span>Aperçu uniquement · aucun envoi au serveur</span></div>`;
      else html+=`<p class="objective-count">Les compteurs sont manuels. Seul « Valider » envoie un objectif.</p>`;
    }else if(view==='permits'){
      html+=heading('Tes autorisations','Les clés de ton aventure, reçues depuis les autres mondes.','UN NOUVEAU PERMIS, UN NOUVEAU CHEMIN');
      html+=`<div class="authorization-cards">${C.permits.map(p=>{const unlocked=client.has(p.name);return `<article class="authorization-card ${unlocked?'':'is-locked'}">${I(p.icon)}<h2>${escape(p.title)}</h2><p>${escape(p.description)}</p><span class="permit-state ${unlocked?'unlocked':''}">${I(unlocked?'check':'lock')}${unlocked?'Débloqué':'En attente de réception'}</span>${!unlocked&&client.connection==='online'?`<button class="button subtle" data-action="hint" data-permit="${escape(p.name)}" style="margin-top:14px">Demander un indice</button>`:''}</article>`;}).join('')}</div><div class="tip-card" style="margin-top:18px"><strong>Un souvenir n’est pas un permis.</strong><p>« Souvenir sans effet » est une récompense secondaire. Il n’ouvre aucun objectif. Un indice utilise les points prévus par ton serveur.</p></div>`;
    }else{
      html+=heading('Les échos des autres mondes','Retrouve les objets reçus, les récompenses envoyées et les messages du serveur.','UNE AVENTURE PARTAGÉE');
      html+=`<section class="panel exchanges-full"><div class="panel-heading">${I('exchange')}<h2>Le journal des échanges</h2></div>${feedList(100)}</section><section class="logs-panel"><div class="section-caption"><h2>Messages du serveur</h2><button data-action="sync">Synchroniser</button></div><div class="logs" role="log" aria-label="Messages du serveur">${client.logs.slice(0,70).reverse().map(l=>`<div class="log-row ${escape(l.kind)}"><time>${new Date(l.at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</time>${escape(l.message)}</div>`).join('')||'<div class="log-row">Le journal est prêt.</div>'}</div><form class="command-form" id="command-form"><input id="command-text" aria-label="Message ou commande Archipelago" placeholder="!hint Permis artisanat, !status, /received…" autocomplete="off" maxlength="500"><button class="button" type="submit">Envoyer</button></form></section>`;
    }
    $('#main-content').innerHTML=html;
    if(caret!==null){const input=$('#objective-search');input?.focus({preventScroll:true});try{input?.setSelectionRange(caret,caret);}catch{}}
  }
  function effectivePrimary(){return profile.primary||(client.mode==='demo'?'Terre':'À définir');}
  function permitsPanel(){return `<section class="panel"><div class="panel-heading">${I('leaf')}<h2>Mes autorisations</h2></div><div class="permits-list"><div class="permit-row element-row">${I('crystal')}<div class="permit-text"><strong>Élément de départ</strong><small>${escape(profile.characterClass||'Tes règles de personnage')}</small></div><button class="permit-state" data-action="profile" title="Définir mes éléments">${escape(effectivePrimary())} ›</button></div>${C.permits.map(p=>{const has=client.has(p.name);let label=has?'Débloqué':'Verrouillé';if(!C.campaignId&&p.name==='Equipement niveau 40')label=has?'Niveau 40 max':'Niveau 20 max';if(!C.campaignId&&p.name==='Deuxieme element'&&has)label=profile.secondary||'À choisir';return `<div class="permit-row ${has?'':'is-locked'}">${I(p.icon)}<div class="permit-text"><strong>${escape(p.title)}</strong><small>${escape(p.description)}</small></div><span class="permit-state ${has?'unlocked':''}">${has?I('check'):''}${escape(label)}</span></div>`;}).join('')}</div></section>`;}
  function feedEntries(){
    if(client.mode==='demo')return C.campaignId?[]:[{title:'Un ami → Permis artisanat',description:'Autorisation reçue · ouvre la fabrication',demo:true,icon:'gift'},{title:'Un ami → Contrat Astrub',description:'Autorisation reçue · ouvre les quêtes',demo:true,icon:'scroll'}];
    const known=new Set(client.feed.map(f=>f.key));
    const result=client.feed.map(f=>({
      title:(f.sender===client.slot?'Toi':client.playerName(f.sender))+' → '+client.itemName(f.item,f.recipient),
      description:f.recipient===client.slot?(f.sender===client.slot?'Objet trouvé dans ton monde':'Reçu depuis '+(client.gameOf(f.sender)||'un autre monde')):'Envoyé à '+client.playerName(f.recipient),
      detail:client.locationName(f.location,f.sender),at:f.at,icon:f.recipient===client.slot?'gift':'exchange'
    }));
    client.items.forEach(item=>{
      const key=[item.item,item.location,item.player,client.slot].join(':');if(known.has(key))return;known.add(key);
      result.push({title:client.playerName(item.player)+' → '+client.itemName(item.item),description:'Objet reçu par '+client.settings.name,detail:client.locationName(item.location,item.player),at:null,icon:'gift'});
    });
    return result;
  }
  function feedList(limit){
    const entries=feedEntries();
    if(!entries.length)return `<p class="empty-note">Les premiers échanges apparaîtront ici. Chaque objectif peut contenir un objet pour toi ou pour un autre joueur.</p>`;
    return `<div class="exchange-list">${entries.slice(0,limit).map(f=>`<div class="exchange-row">${I(f.icon)}<div class="exchange-copy"><strong>${escape(f.title)}</strong><small>${escape(f.description)}</small>${f.detail?`<small>${escape(f.detail)}</small>`:''}<time>${f.demo?'Exemple d’échange · aperçu':escape(age(f.at))}</time></div></div>`).join('')}</div>`;
  }
  function renderRight(){
    $('#right-content').innerHTML=permitsPanel()+`<section class="panel"><div class="panel-heading">${I('exchange')}<h2>Derniers échanges</h2><button data-view="exchanges">Voir tout ›</button></div>${feedList(3)}</section><section class="tip-card"><strong>${client.mode==='demo'?'Le carnet prend vie':'Un permis ouvre un chemin'}</strong><p>${client.mode==='demo'?'Explore cette version d’aperçu, puis relie ta partie pour retrouver tes vrais objectifs et tes objets.':'Quand tu reçois une autorisation, ses objectifs deviennent disponibles. Applique ensuite cette permission dans Dofus.'}</p>${client.mode==='demo'?'<button class="button subtle" data-action="connection" style="margin-top:12px">Connecter ma partie →</button>':''}</section>`;
  }
  function render(){
    const n=client.completed();
    $('#progress-ring').style.setProperty('--progress',(n/C.objectives.length*100)+'%');
    $('#sidebar-progress').innerHTML=n+' <span>/ '+C.objectives.length+'</span>';$('#nav-count').textContent=C.objectives.length-n;
    $('#profile-rule-note').textContent=C.campaignId?'Ces notes personnelles ne modifient pas les règles de la campagne. Consulte le guide pour les classes et éléments autorisés.':'Choisis deux éléments utilisables tôt par ta classe. Le second nécessite l’autorisation « Deuxieme element ».';
    $('#current-campaign').textContent=C.title||'Aventure Dofus';
    $('#current-game-id').textContent=C.game;
    $('#connection-game-id').textContent=C.game;
    $('#help-goal').textContent='Accomplis les '+client.goalObjectives().length+' objectifs requis et reçois les '+client.goalPermits().length+' autorisations requises, puis déclare ta victoire. Le détail figure dans « Le dernier chapitre ».';
    $('#help-rules').textContent=C.rules||'Équipement niveau 20 maximum au départ, puis 40 avec le permis. XP, récolte, achats, ventes, déplacements et quêtes d’Incarnam libres. Fabrication, quêtes d’Astrub et Kardorim attendent leurs permis. Les compteurs sont cumulatifs ; les défis élémentaires se font sans invocation ni compagnon.';
    const status=$('#connection-status');status.className='status-pill '+(client.mode==='demo'?'demo':client.connection);
    status.innerHTML='<span class="status-dot"></span>'+(client.mode==='demo'?'Aperçu':client.connection==='online'?'Connecté':client.connection==='connecting'?'Connexion…':'Déconnecté');
    const name=client.mode==='demo'?(connection.name||C.player||'JoueurDofus'):client.settings.name||connection.name;
    $('#profile-button').innerHTML=escape(name)+' <span>⌄</span>';
    const banner=$('#mode-banner');banner.className='mode-banner';
    if(client.mode==='demo')banner.innerHTML='<span>Mode aperçu · données fictives, aucun envoi au serveur.</span><button data-action="connection">Relier ma partie →</button>';
    else if(client.error){banner.classList.add('error');banner.innerHTML='<span>'+escape(client.error)+'</span><button data-action="connection">Connexion</button>';}
    else if(client.connection==='connecting')banner.innerHTML='<span>Connexion en cours… Le carnet attend la réponse d’Archipelago.</span><button data-action="connection">Voir la connexion</button>';
    else if(client.connection==='online'){banner.classList.add('live');banner.innerHTML=`<span>${escape(name)} · progression synchronisée avec ta partie.</span><button data-action="sync">Synchroniser ↻</button>`;}
    else banner.innerHTML='<span>Connecte ton serveur pour valider tes objectifs.</span><button data-action="connection">Se connecter →</button>';
    $('#footer-server').textContent=client.mode==='demo'?'Aperçu indépendant de ta partie':client.seed?'Partie '+client.seed:'En attente du serveur';
    $('#connection-error').textContent=client.error;
    $('#connect-submit').disabled=client.connection==='connecting';
    $('#connect-submit').innerHTML=client.connection==='connecting'?'Connexion en cours…':'Connecter mon aventure <span>→</span>';
    $('#disconnect-button').classList.toggle('no-display',client.mode!=='live'||client.connection==='offline');
    document.querySelectorAll('.nav-item[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if(client.connection==='online'&&client.ready&&previousConnection!=='online'){
      if($('#connection-dialog').open)$('#connection-dialog').close();
      toast('Carnet relié',name+' a retrouvé son aventure.','link');
    }
    previousConnection=client.connection;
    renderMain();renderRight();
  }
  function openDialog(id){
    const dialog=$('#'+id);document.querySelectorAll('dialog[open]').forEach(d=>{if(d!==dialog)d.close();});
    if(!dialog.open)dialog.showModal();
  }
  function openConnection(){
    $('#server').value=connection.server||'localhost:38281';$('#player').value=connection.name||C.player||'JoueurDofus';
    $('#connection-campaign-row').hidden=!C.compatibilityGame;
    $('#connection-campaign').value=connection.legacy?'legacy':'current';
    openDialog('connection-dialog');
  }
  function run(fn){try{fn();}catch(e){toast('Une petite halte',e.message,'error');}}
  function navigate(next){
    view=['overview','objectives','permits','exchanges'].includes(next)?next:'overview';
    filter='available';query='';category='';
    try{history.replaceState(null,'','#'+view);}catch{}
    render();$('#main-content').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('click',e=>{
    const close=e.target.closest('[data-close]');if(close){close.closest('dialog').close();return;}
    const nav=e.target.closest('[data-view]');if(nav){navigate(nav.dataset.view);return;}
    const button=e.target.closest('[data-action]');if(!button)return;
    const o=C.objectives[Number(button.dataset.index)];
    switch(button.dataset.action){
      case 'connection':openConnection();break;
      case 'profile':$('#character-class').value=profile.characterClass||'';$('#primary-element').value=profile.primary||'';$('#secondary-element').value=profile.secondary||'';openDialog('profile-dialog');break;
      case 'help':openDialog('help-dialog');break;
      case 'campaign':openDialog('campaign-dialog');break;
      case 'restore-campaign':loadContent(defaultContent,null);break;
      case 'filter':filter=button.dataset.filter;renderMain();break;
      case 'validate':run(()=>client.check(o));break;
      case 'counter':client.setCounter(o,(Number(client.counters[o.counter])||0)+Number(button.dataset.delta));break;
      case 'sync':run(()=>{if(client.mode==='demo')toast('Mode aperçu','Connecte une partie pour la synchroniser.','link');else if(!client.authenticated)openConnection();else client.requestSync();});break;
      case 'demo':document.querySelectorAll('dialog[open]').forEach(d=>d.close());previousConnection='offline';client.startDemo();break;
      case 'demo-unlock':client.demoUnlock();break;
      case 'disconnect':client.disconnect();$('#connection-dialog').close();break;
      case 'finish':run(()=>client.finish());break;
      case 'hint':run(()=>{client.command('!hint '+button.dataset.permit);navigate('exchanges');toast('Indice demandé','La réponse apparaîtra dans les messages du serveur.','scroll');});break;
    }
  });
  function loadContent(content,campaign){
    client.disconnect(true);for(const key of Object.keys(C))delete C[key];Object.assign(C,content);
    write(campaignKey,campaign);previousConnection='offline';view='overview';filter='available';query='';category='';
    campaignGame=C.game;connectionKey='carnet.connection.'+campaignGame;
    connection=read(connectionKey,{server:connection.server||'localhost:38281',name:C.player||'JoueurDofus',legacy:false});
    if(connection.legacy&&C.compatibilityGame)C.game=C.compatibilityGame;
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());client.startDemo();
    toast('Campagne chargée','Aperçu prêt. Connecte le serveur de la génération correspondante.','book');
  }
  $('#campaign-file').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>2000000)throw Error('Fichier trop volumineux (2 Mo maximum).');const p=JSON.parse(await file.text());loadContent(CarnetCampaign.compile(p).content,p);}
    catch(error){toast('Campagne non chargée',error.message,'error');}finally{e.target.value='';}
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-counter]'))client.setCounter(C.objectives[Number(e.target.dataset.counter)],e.target.value);
    if(e.target.id==='category-filter'){category=e.target.value;renderMain();}
  });
  document.addEventListener('input',e=>{if(e.target.id==='objective-search'){query=e.target.value;renderMain();}});
  $('#connection-form').addEventListener('submit',e=>{
    e.preventDefault();
    const settings={server:$('#server').value.trim(),name:$('#player').value.trim(),password:$('#password').value};
    try{const legacy=Boolean(C.compatibilityGame&&$('#connection-campaign').value==='legacy');C.game=legacy?C.compatibilityGame:campaignGame;client.connect(settings);connection={server:settings.server,name:settings.name,legacy};write(connectionKey,connection);$('#password').value='';}
    catch(error){$('#connection-error').textContent=error.message;}
  });
  $('#profile-form').addEventListener('submit',e=>{
    e.preventDefault();
    const primary=$('#primary-element').value,secondary=$('#secondary-element').value;
    if(primary&&primary===secondary){toast('Deux chemins différents','Choisis un élément secondaire différent de ton élément de départ.','crystal');return;}
    profile={characterClass:$('#character-class').value.trim(),primary,secondary};write('carnet.profile',profile);$('#profile-dialog').close();render();toast('Notes enregistrées','Ton personnage a sa place dans le carnet.','scroll');
  });
  document.addEventListener('submit',e=>{
    if(e.target.id!=='command-form')return;e.preventDefault();const t=$('#command-text').value.trim();if(!t)return;
    run(()=>{
      if(t==='/received'){
        client.log(client.items.length+' objet(s) reçu(s).','command');
        client.items.forEach(item=>client.log(client.itemName(item.item)+' — '+client.playerName(item.player),'command'));client.emit();
      }else if(t==='/sync'){client.requestSync();}
      else if(t==='/disconnect'){client.disconnect();}
      else if(t.startsWith('/'))throw new Error('Commandes locales : /received, /sync, /disconnect. Pour le serveur : !hint, !status, !missing.');
      else{client.command(t);$('#command-text').value='';}
    });
  });
  document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=I(el.dataset.icon);});
  $('#emblem').innerHTML=I('egg');$('#ring-icon').innerHTML=I('egg');
  $('#emblem').addEventListener('click',e=>{e.preventDefault();navigate('overview');});
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  const initialHash=location.hash.slice(1);if(['objectives','permits','exchanges'].includes(initialHash))view=initialHash;
  client.startDemo();
})();
