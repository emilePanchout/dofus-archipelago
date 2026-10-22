(function(root){
  'use strict';
  const failures={InvalidSlot:'Nom de joueur introuvable. Respecte les majuscules du YAML et vérifie la partie hébergée.',InvalidGame:'Ce joueur appartient à un autre jeu. Utilise le slot de ton Dofus Manual.',InvalidPassword:'Le mot de passe du serveur est incorrect.',IncompatibleVersion:'Le serveur demande une autre version de client. Ce carnet annonce Archipelago 0.6.8.',InvalidItemsHandling:'Le serveur a refusé la synchronisation des objets.'};
  function normalizeAddress(value){
    let s=String(value||'').trim();
    if(!s) throw new Error('Indique l’adresse de ton serveur.');
    if(!s.includes('://')) s='ws://'+s;
    s=s.replace(/^archipelago:\/\//i,'ws://');
    let u;
    try{u=new URL(s);}catch{throw new Error('Adresse invalide. Exemple : localhost:38281.');}
    if(!['ws:','wss:'].includes(u.protocol)||!u.hostname) throw new Error('Utilise une adresse ws:// ou wss://.');
    if(u.username||u.password) throw new Error('Renseigne le joueur et le mot de passe dans leurs champs séparés.');
    const explicitPort=/^(?:ws|wss):\/\/(?:\[[^\]]+\]|[^/:]+):\d+(?:\/|$)/i.test(s);
    if(!u.port&&!explicitPort) u.port='38281';
    if(u.search||u.hash) throw new Error('L’adresse du serveur ne doit pas contenir de paramètres.');
    return u.href;
  }
  class CarnetClient{
    constructor(content,options={}){
      this.content=content;
      this.WebSocket=options.WebSocket||root.WebSocket;
      this.storage=options.storage||null;
      this.onChange=options.onChange||(()=>{});
      this.onNotice=options.onNotice||(()=>{});
      this.uuid=options.uuid||root.crypto?.randomUUID?.()||'carnet-'+Math.random().toString(36).slice(2);
      this.ws=null; this.timer=null; this.pendingTimers=new Map();
      this.mode='offline'; this.connection='offline'; this.error=''; this.seed='';
      this.settings={server:'localhost:38281',name:'JoueurDofus',password:''};
      this.packages={}; this.players={}; this.slot=0; this.team=0;
      this.checked=new Set(); this.missing=new Set(); this.items=[];
      this.pending=new Set(); this.counters={}; this.feed=[]; this.logs=[];
      this.goal=false; this.goalPending=false; this.ready=false; this.authenticated=false;
      this.awaitingSnapshot=true; this.needsSync=false;
    }
    emit(){this.onChange(this);}
    log(message,kind='info'){
      this.logs.unshift({message:String(message),kind,at:Date.now()});
      this.logs=this.logs.slice(0,100);
    }
    storageKey(){return 'carnet.session.'+JSON.stringify([this.seed,this.team,this.slot,this.settings.name]);}
    loadLocal(){
      this.counters={};this.feed=[];
      try{const d=JSON.parse(this.storage?.getItem(this.storageKey())||'{}');
        this.counters=d.counters&&typeof d.counters==='object'?d.counters:{};
        this.feed=Array.isArray(d.feed)?d.feed.slice(0,100):[];
      }catch{}
    }
    saveLocal(){
      if(this.mode!=='live'||!this.seed||!this.slot)return;
      try{this.storage?.setItem(this.storageKey(),JSON.stringify({counters:this.counters,feed:this.feed.slice(0,100)}));}catch{}
    }
    disconnect(silent=false){
      clearTimeout(this.timer);this.timer=null;
      this.pendingTimers.forEach(clearTimeout);this.pendingTimers.clear();this.pending.clear();
      const ws=this.ws;this.ws=null;
      if(ws)try{ws.close();}catch{}
      this.authenticated=false;this.ready=false;this.connection='offline';
      this.goalPending=false;
      if(!silent){this.log('Connexion fermée.');this.emit();}
    }
    connect(settings){
      const address=normalizeAddress(settings.server);
      const name=String(settings.name||'').trim();
      if(!name)throw new Error('Indique le nom du joueur, par exemple JoueurDofus.');
      this.disconnect(true);
      this.settings={server:address,name,password:String(settings.password||'')};
      this.mode='live';this.connection='connecting';this.error='';this.seed='';
      this.slot=0;this.team=0;this.packages={};this.players={};this.checked.clear();this.missing.clear();
      this.items=[];this.counters={};this.feed=[];this.goal=false;this.logs=[];
      this.awaitingSnapshot=true;this.needsSync=false;
      this.log('Connexion au serveur…');this.emit();
      let ws;
      try{ws=new this.WebSocket(address);}catch(e){this.fail('Impossible d’ouvrir la connexion : '+e.message);return;}
      this.ws=ws;
      ws.onmessage=e=>{
        if(this.ws!==ws)return;
        try{const packets=JSON.parse(e.data);if(!Array.isArray(packets))throw Error('Format de paquet inattendu.');
          for(const p of packets)this.handle(p);
        }catch(e){this.log('Message du serveur non interprété : '+e.message,'error');this.emit();}
      };
      ws.onerror=()=>{if(this.ws===ws){this.error='Serveur inaccessible. Vérifie qu’il tourne, l’adresse et le port. Si le navigateur demande l’accès au réseau local, autorise-le.';this.emit();}};
      ws.onclose=()=>{if(this.ws===ws){clearTimeout(this.timer);this.ws=null;this.connection='offline';this.authenticated=false;this.ready=false;this.goalPending=false;this.pending.clear();this.pendingTimers.forEach(clearTimeout);this.pendingTimers.clear();this.error=this.error||'Connexion interrompue. Reconnecte-toi pour retrouver la progression du serveur.';this.log(this.error,'error');this.emit();}};
      this.timer=setTimeout(()=>{if(this.ws===ws&&this.connection!=='online')this.fail('Le serveur n’a pas terminé la connexion. Vérifie l’adresse et les messages du journal.');},15000);
    }
    fail(message){
      this.error=message;this.log(message,'error');this.disconnect(true);this.emit();
    }
    send(packet){
      if(!this.ws||this.ws.readyState!==1)throw new Error('Le carnet n’est pas connecté.');
      this.ws.send(JSON.stringify(Array.isArray(packet)?packet:[packet]));
    }
    requestSync(){if(this.mode==='live'&&this.authenticated){this.send([{cmd:'Sync'},{cmd:'Get',keys:[this.goalKey()]}]);this.log('Synchronisation demandée.');this.emit();}}
    goalKey(){return `_read_client_status_${this.team}_${this.slot}`;}
    handle(p){
      switch(p.cmd){
        case 'RoomInfo':{
          this.seed=String(p.seed_name||'partie');
          if(Array.isArray(p.games)&&!p.games.includes(this.content.game)){
            this.fail('Cette partie ne contient pas '+this.content.game+'. Ouvre la partie Dofus + HuniePop sur le serveur.');return;
          }
          const version=p.version&&Number.isInteger(p.version.major)?p.version:{major:0,minor:6,build:8};
          this.send({cmd:'Connect',game:this.content.game,name:this.settings.name,password:this.settings.password,uuid:this.uuid,version:{class:'Version',major:version.major,minor:version.minor,build:version.build},items_handling:7,tags:['AP'],slot_data:true});
          this.send({cmd:'GetDataPackage',games:p.games||[this.content.game]});
          this.log('Serveur trouvé. Vérification du joueur…');break;
        }
        case 'ConnectionRefused':this.fail((p.errors||[]).map(x=>failures[x]||x).join(' ')||'Connexion refusée.');return;
        case 'Connected':{
          this.authenticated=true;this.slot=p.slot;this.team=p.team;
          this.players={...this.players,...p.slot_info};
          this.updatePlayers(p.players);
          this.slotData=p.slot_data||{};
          this.checked=new Set(p.checked_locations||[]);this.missing=new Set(p.missing_locations||[]);
          this.loadLocal();this.updateReady();
          queueMicrotask(()=>{this.awaitingSnapshot=false;});
          this.send([{cmd:'SetNotify',keys:[this.goalKey()]},{cmd:'Get',keys:[this.goalKey()]}]);
          this.log('Joueur connecté : '+this.settings.name+'.');
          break;
        }
        case 'DataPackage':{
          Object.assign(this.packages,p.data?.games||{});this.updateReady();this.reconcileCounters();break;
        }
        case 'ReceivedItems':{
          const index=Number(p.index),incoming=p.items;
          if(!Number.isSafeInteger(index)||index<0||!Array.isArray(incoming))break;
          const before=this.items.length;
          const wasSnapshot=this.awaitingSnapshot;
          if(index===0){this.items=[...incoming];this.awaitingSnapshot=false;this.needsSync=false;}
          else if(index>this.items.length){
            if(!this.needsSync){this.needsSync=true;this.send({cmd:'Sync'});this.log('Récupération des objets manquants…');}break;
          }else{
            for(let i=0;i<incoming.length;i++)this.items[index+i]=incoming[i];
          }
          if(!wasSnapshot&&this.items.length>before){
            for(const item of this.items.slice(before)){
              const name=this.itemName(item.item,this.slot);
              const permit=this.content.permits.find(x=>x.name===name);
              this.onNotice(permit?'Nouvelle autorisation !':'Objet reçu',permit?permit.title:name,permit?.icon||'gift');
            }
          }
          this.reconcileCounters();break;
        }
        case 'RoomUpdate':{
          this.updatePlayers(p.players);
          for(const id of p.checked_locations||[]){
            this.checked.add(id);this.missing.delete(id);
            if(this.pending.delete(id)){
              clearTimeout(this.pendingTimers.get(id));this.pendingTimers.delete(id);
              this.onNotice('Objectif validé',this.objectiveById(id)?.title||'Validation confirmée','check');
            }
          }
          this.reconcileCounters();break;
        }
        case 'PrintJSON':{
          if(p.type==='ItemSend'||p.type==='ItemCheat'){
            if(p.item&&(p.receiving===this.slot||p.item.player===this.slot))this.addFeed(p);
          }else if(p.type==='Goal'&&p.slot===this.slot&&p.team===this.team){this.goal=true;this.goalPending=false;}
          this.log(this.readMessage(p.data||[],p),p.type==='CommandResult'?'command':'info');break;
        }
        case 'Retrieved':
          if(p.keys&&p.keys[this.goalKey()]!==undefined)this.setGoalStatus(p.keys[this.goalKey()]);break;
        case 'SetReply':if(p.key===this.goalKey())this.setGoalStatus(p.value);break;
        case 'InvalidPacket':this.log('Le serveur a refusé une action : '+String(p.text||p.type||'paquet invalide'),'error');break;
      }
      this.saveLocal();this.emit();
    }
    updateReady(){
      if(!this.authenticated)return;
      const pkg=this.packages[this.content.game];if(!pkg)return;
      const ids=pkg.location_name_to_id||{};
      const allSlotIds=new Set([...this.checked,...this.missing]);
      this.ready=allSlotIds.size===this.content.objectives.length&&this.content.objectives.every(o=>Number.isSafeInteger(ids[o.name])&&allSlotIds.has(ids[o.name]))&&this.content.permits.every(x=>Number.isSafeInteger(pkg.item_name_to_id?.[x.name]))&&(!this.content.campaignId||this.slotData?.carnet_campaign===this.content.campaignId);
      this.connection='online';clearTimeout(this.timer);
      if(!this.ready){this.error='Cette partie ne correspond pas à la campagne chargée dans le carnet. Ouvre le carnet exporté avec cette campagne ou importe son JSON. La validation est désactivée.';this.log(this.error,'error');}
      else{this.error='';}
    }
    updatePlayers(list){for(const p of list||[]){const current=this.players[p.slot]||{};this.players[p.slot]={...current,name:p.alias||p.name||current.name};}}
    gameOf(slot){return this.players[slot]?.game||(Number(slot)===Number(this.slot)?this.content.game:null);}
    playerName(slot){return Number(slot)===0?'Départ':this.players[slot]?.name||('Joueur '+slot);}
    itemName(id,slot=this.slot){const game=this.gameOf(slot);const pairs=this.packages[game]?.item_name_to_id||{};return Object.keys(pairs).find(k=>pairs[k]===Number(id))||('Objet #'+id);}
    locationName(id,slot){const game=this.gameOf(slot);const pairs=this.packages[game]?.location_name_to_id||{};return Object.keys(pairs).find(k=>pairs[k]===Number(id))||(Number(id)<0?'Objet de départ':'Objectif #'+id);}
    objectiveById(id){return this.content.objectives.find(o=>this.locationId(o)===id);}
    locationId(o){return this.packages[this.content.game]?.location_name_to_id?.[o.name];}
    has(name){if(this.mode==='demo')return this.demoPermits.has(name);const id=this.packages[this.content.game]?.item_name_to_id?.[name];return Number.isSafeInteger(id)&&this.items.some(i=>i&&i.item===id);}
    isChecked(o){return this.mode==='demo'?this.demoChecked.has(o.name):this.checked.has(this.locationId(o));}
    unlocked(o){return o.requires.every(name=>this.has(name));}
    progress(o){return o.counter?Math.min(o.target,Math.max(0,Number(this.counters[o.counter])||0)):(this.isChecked(o)?1:0);}
    setCounter(o,value){
      if(!o.counter||!this.unlocked(o)||this.isChecked(o))return;
      const limit=Math.max(...this.content.objectives.filter(x=>x.counter===o.counter).map(x=>x.target));
      this.counters[o.counter]=Math.max(0,Math.min(limit,Math.floor(Number(value)||0)));this.saveLocal();this.emit();
    }
    reconcileCounters(){
      for(const o of this.content.objectives)if(o.counter&&this.isChecked(o))this.counters[o.counter]=Math.max(this.counters[o.counter]||0,o.target);
    }
    canCheck(o){return !this.isChecked(o)&&this.unlocked(o)&&(!o.counter||this.progress(o)>=o.target)&&!this.pending.has(this.locationId(o))&&((this.mode==='live'&&this.connection==='online'&&this.ready)||this.mode==='demo');}
    check(o){
      if(!this.canCheck(o))throw new Error('Objectif verrouillé, incomplet ou carnet déconnecté.');
      if(this.mode==='demo'){
        this.demoChecked.add(o.name);this.log('Aperçu : '+o.title);this.onNotice('Objectif validé en aperçu',o.title,'check');this.emit();return;
      }
      const id=this.locationId(o);
      this.pending.add(id);
      try{this.send({cmd:'LocationChecks',locations:[id]});}catch(e){this.pending.delete(id);throw e;}
      this.pendingTimers.set(id,setTimeout(()=>{
        if(this.pending.delete(id)){this.pendingTimers.delete(id);this.log('Confirmation non reçue pour « '+o.title+' ». Reconnecte-toi avant de réessayer.','error');this.emit();}
      },10000));
      this.log('Validation envoyée : '+o.title+'.');this.emit();
    }
    completed(){return this.content.objectives.filter(o=>this.isChecked(o)).length;}
    goalObjectives(){const names=this.content.victory?.objectives;return names?this.content.objectives.filter(o=>names.includes(o.name)):this.content.objectives;}
    goalPermits(){return this.content.victory?.permits||this.content.permits.map(p=>p.name);}
    canGoal(){return this.goalObjectives().every(o=>this.isChecked(o))&&this.goalPermits().every(name=>this.has(name))&&!this.goal&&!this.goalPending&&(this.mode==='demo'||(this.connection==='online'&&this.ready));}
    finish(){
      if(!this.canGoal())throw new Error('Termine les objectifs et reçois les autorisations exigés pour la victoire.');
      if(this.mode==='demo'){this.goal=true;this.onNotice('Aventure terminée en aperçu','Aucun envoi au serveur.','trophy');this.emit();return;}
      this.send([{cmd:'StatusUpdate',status:30},{cmd:'Get',keys:[this.goalKey()]}]);this.goalPending=true;this.emit();
    }
    setGoalStatus(status){if(Number(status)===30){if(!this.goal)this.onNotice('Aventure terminée !','Ta victoire est enregistrée sur le serveur.','trophy');this.goal=true;}this.goalPending=false;}
    command(text){if(this.mode!=='live'||!this.authenticated)throw new Error('Connecte le carnet avant d’envoyer un message.');const t=String(text||'').trim();if(t)this.send({cmd:'Say',text:t});}
    readMessage(parts,p){return parts.map(part=>{
      if(part.type==='player_id')return this.playerName(Number(part.text));
      if(part.type==='item_id')return this.itemName(Number(part.text),part.player??p.receiving??this.slot);
      if(part.type==='location_id')return this.locationName(Number(part.text),part.player??p.item?.player??this.slot);
      return String(part.text||'');
    }).join('');}
    addFeed(p){
      const item=p.item;const key=[item.item,item.location,item.player,p.receiving].join(':');
      if(this.feed.some(f=>f.key===key))return;
      this.feed.unshift({key,at:Date.now(),item:item.item,location:item.location,sender:item.player,recipient:p.receiving,game:this.gameOf(p.receiving)});
      this.feed=this.feed.slice(0,100);
    }
    startDemo(){
      this.disconnect(true);this.mode='demo';this.connection='offline';this.error='';this.seed='Aperçu';this.slot=1;this.team=0;this.goal=false;
      this.ready=false;this.items=[];this.packages={};this.checked.clear();this.missing.clear();
      this.demoPermits=new Set(this.content.campaignId?[]:['Permis artisanat','Contrat Astrub']);
      this.demoChecked=new Set(this.content.campaignId?[]:this.content.objectives.slice(0,4).map(o=>o.name));
      this.counters=this.content.campaignId?{}:{combats:3,ressources:20,cartes:5,recettes:0,quetes:1};
      this.feed=[];this.logs=[];this.log('Mode aperçu : les données sont fictives et aucun objectif n’est envoyé.');this.emit();
    }
    demoUnlock(){
      if(this.mode!=='demo')return;
      const p=this.content.permits.find(p=>!this.has(p.name));
      if(p){this.demoPermits.add(p.name);this.onNotice('Nouvelle autorisation en aperçu',p.title,p.icon);this.emit();}
    }
  }
  root.CarnetEngine={CarnetClient,normalizeAddress};
  if(typeof module==='object'&&module.exports)module.exports=root.CarnetEngine;
})(typeof window==='undefined'?globalThis:window);
