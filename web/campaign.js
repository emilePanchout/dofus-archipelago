(function(root){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const icons=['star','swords','leaf','compass','hammer','scroll','crystal','shield','helmet','gift','trophy','book'];
  const kinds=['Général','Classe','Élément','Équipement','Zone','Métier','Activité'];
  const id=prefix=>prefix+'_'+(root.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
  const text=x=>typeof x==='string'?x:'';
  function fromContent(c){return {
    schema:'dofus-campaign/v1',title:'Aventure Dofus',slug:'Dofus',creator:'Communaute',player:'JoueurDofus',
    rules:'Personnage neuf. Choisis ta classe et deux éléments accessibles tôt. Équipement niveau 20 maximum au départ ; niveau 40 avec le permis. XP, récolte, achats, déplacements et quêtes d’Incarnam libres. Fabrication, quêtes d’Astrub et Kardorim attendent leurs permis. Les objectifs élémentaires se font sans invocation ni compagnon. Compteurs cumulatifs, à zéro au départ.',
    objectives:c.objectives.map((o,i)=>({...clone(o),id:'objectif_'+(i+1)})),
    permits:c.permits.map((p,i)=>({...clone(p),id:'permis_'+(i+1),kind:'Général'})),
    victory:{mode:'all',objectives:[],permits:c.permits.map(p=>p.name)}
  };}
  function validate(p){
    const errors=[],warnings=[];
    if(!p||typeof p!=='object'||Array.isArray(p))return {errors:['Le fichier ne contient pas une campagne.'],warnings};
    if(p.schema!=='dofus-campaign/v1')errors.push('Format de campagne inconnu : utilise un JSON exporté par cet éditeur.');
    for(const [key,label,max] of [['title','Titre',100],['slug','Identifiant de campagne',40],['creator','Créateur',30],['player','Joueur',16]]){
      if(!text(p[key]).trim()||p[key].length>max)errors.push(label+' : renseigne entre 1 et '+max+' caractères.');
    }
    if(!/^[A-Za-z][A-Za-z0-9]*$/.test(p.slug||''))errors.push('L’identifiant doit commencer par une lettre et contenir uniquement des lettres et chiffres sans accents.');
    if(!/^[A-Za-z][A-Za-z0-9]*$/.test(p.creator||''))errors.push('Le créateur doit contenir des lettres et chiffres sans accents, en commençant par une lettre.');
    if(/[\r\n\x00-\x1f]/.test(p.player||''))errors.push('Le nom du joueur contient un caractère interdit.');
    if(typeof p.rules!=='string'||p.rules.length>30000)errors.push('Les règles doivent être du texte (30 000 caractères maximum).');
    const os=Array.isArray(p.objectives)?p.objectives:[],ps=Array.isArray(p.permits)?p.permits:[];
    if(!Array.isArray(p.objectives)||os.length<1||os.length>500)errors.push('Prévois entre 1 et 500 objectifs.');
    if(!Array.isArray(p.permits)||ps.length>200)errors.push('Prévois au maximum 200 autorisations.');
    const names=new Set(),ids=new Set(),permitNames=new Set(ps.map(p=>p?.name));
    const forbidden=/[|:{}@\r\n\x00-\x1f]/;
    for(const [type,list] of [['Objectif',os],['Autorisation',ps]])for(let i=0;i<list.length;i++){
      const x=list[i],label=type+' '+(i+1);
      if(!x||typeof x!=='object'){errors.push(label+' est invalide.');continue;}
      if(!text(x.id)||ids.has(x.id))errors.push(label+' : identifiant interne absent ou dupliqué.');ids.add(x.id);
      if(!text(x.name).trim()||x.name.length>160||forbidden.test(x.name)||['__Victory__','Souvenir sans effet'].includes(x.name))errors.push(label+' : nom Archipelago absent, réservé ou contenant | : { } @ ou un saut de ligne.');
      if(names.has(x.name))errors.push('Nom Archipelago dupliqué : '+x.name);names.add(x.name);
      if(!text(x.title).trim()||x.title.length>160)errors.push(label+' : renseigne un titre (160 caractères maximum).');
      if(typeof x.description!=='string'||x.description.length>10000)errors.push(label+' : description invalide.');
      if(!icons.includes(x.icon))errors.push(label+' : icône inconnue.');
      if(type==='Objectif'){
        if(!text(x.category).trim()||x.category.length>60)errors.push(label+' : catégorie absente ou trop longue.');
        if(!Array.isArray(x.requires)||x.requires.some(n=>!permitNames.has(n)))errors.push(label+' : une autorisation requise n’existe plus.');
        if(x.counter&&(!/^[A-Za-z0-9_-]{1,60}$/.test(x.counter)||!Number.isSafeInteger(x.target)||x.target<1||x.target>1000000))errors.push(label+' : compteur invalide (clé simple et cible entière de 1 à 1 000 000).');
      }else if(!kinds.includes(x.kind))errors.push(label+' : type inconnu.');
    }
    if(ps.length>os.length)errors.push('Il y a plus d’autorisations à placer que d’objectifs : ajoute des objectifs ou retire des autorisations.');
    if(os.length&&!os.some(o=>Array.isArray(o?.requires)&&o.requires.length===0))errors.push('Aucun objectif accessible au départ : laisse au moins un objectif sans prérequis.');
    const v=p.victory;
    if(!v||!['all','selected'].includes(v.mode)||!Array.isArray(v.objectives)||!Array.isArray(v.permits))errors.push('Conditions de victoire invalides.');
    else{
      if(v.mode==='selected'&&(!v.objectives.length||v.objectives.some(x=>!os.some(o=>o?.id===x))))errors.push('Sélectionne au moins un objectif existant pour la victoire.');
      if(v.permits.some(x=>!permitNames.has(x)))errors.push('Une autorisation de victoire n’existe plus.');
    }
    for(const permit of ps)if(permit&&!os.some(o=>o?.requires?.includes(permit.name))&&!v?.permits?.includes(permit.name))warnings.push('« '+permit.title+' » ne verrouille aucun objectif et n’est pas exigé pour la victoire.');
    if(os.length>0&&ps.length===os.length)warnings.push('Chaque emplacement contiendra une autorisation ; aucun souvenir ne sera ajouté.');
    if(v?.mode==='selected')warnings.push('Les autres objectifs envoient aussi des objets : finir tôt peut laisser des récompenses utiles aux amis non envoyées.');
    warnings.push('Les classes, éléments et actions réels restent vérifiés par les joueurs.');
    return {errors:[...new Set(errors)],warnings};
  }
  function signature(p){
    const {player,...definition}=p;
    const value=JSON.stringify(definition);let h=2166136261;
    for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(16).padStart(8,'0');
  }
  function goals(p){return p.victory.mode==='all'?p.objectives:p.objectives.filter(o=>p.victory.objectives.includes(o.id));}
  function requiredPermits(p){return [...new Set([...p.victory.permits,...goals(p).flatMap(o=>o.requires)])];}
  function compile(p){
    const result=validate(p);if(result.errors.length)throw Error(result.errors.join('\n'));
    const hash=signature(p),gamePart=p.slug+'R'+hash,game='Manual_'+gamePart+'_'+p.creator;
    const objectiveNames=goals(p).map(o=>o.name),goalPermits=requiredPermits(p);
    const content={game,version:'0.2.1',campaignId:hash,title:p.title,rules:p.rules,player:p.player,objectives:clone(p.objectives),permits:clone(p.permits),victory:{objectives:objectiveNames,permits:goalPermits}};
    const requires=names=>names.map(n=>'|'+n+'|').join(' and ');
    const data={game:{game:gamePart,creator:p.creator,filler_item_name:'Souvenir sans effet',death_link:false},
      items:p.permits.length?p.permits.map(x=>({name:x.name,progression:true,count:1,category:[x.kind==='Général'?'Autorisations':x.kind]})):[{name:'__Carnet_Empty_Pool__',progression:false,count:0}],
      locations:[...p.objectives.map(o=>({name:o.name,category:[o.category],...(o.requires.length?{requires:requires(o.requires)}:{})})),{name:'Victoire - '+objectiveNames.length+' objectifs requis',victory:true,...(goalPermits.length?{requires:requires(goalPermits)}:{})}],
      events:[],regions:{},categories:{},options:{},meta:{docs:{apworld_description:p.title+' — campagne du Carnet Dofus. Voir REGLES.md.'}}};
    const yaml='name: '+JSON.stringify(p.player)+'\ngame: '+game+'\ndescription: '+JSON.stringify(p.title)+'\n'+game+':\n  progression_balancing: 50\n  accessibility: full\n';
    return {hash,game,folder:game.toLowerCase(),content,data,yaml,report:result};
  }
  function renamePermit(p,index,name){
    const old=p.permits[index].name;p.permits[index].name=name;
    p.objectives.forEach(o=>{o.requires=o.requires.map(n=>n===old?name:n);});
    p.victory.permits=p.victory.permits.map(n=>n===old?name:n);
  }
  function removePermit(p,index){
    const name=p.permits[index].name;p.permits.splice(index,1);
    p.objectives.forEach(o=>{o.requires=o.requires.filter(n=>n!==name);});p.victory.permits=p.victory.permits.filter(n=>n!==name);
  }
  function newObjective(){const k=id('objectif');return {id:k,name:'Objectif '+k.slice(-8),title:'Nouvel objectif',autoName:true,description:'Décris précisément l’action à réaliser dans Dofus.',category:'Progression',icon:'star',requires:[]};}
  function newPermit(){const k=id('permis');return {id:k,name:'Permis '+k.slice(-8),title:'Nouvelle autorisation',autoName:true,description:'Décris ce que cet objet autorise dans Dofus.',icon:'gift',kind:'Général'};}
  function rulesMarkdown(p){
    const c=compile(p);return '# '+p.title+'\n\n'+p.rules+'\n\n## Autorisations\n\n'+p.permits.map(x=>'- **'+x.title+'** (`'+x.name+'`) : '+x.description).join('\n')+'\n\n## Objectifs\n\n'+p.objectives.map((x,i)=>(i+1)+'. **'+x.title+'** : '+x.description+'\n   Prérequis : '+(x.requires.join(', ')||'aucun')+(x.counter?' ; compteur '+x.counter+', cible '+x.target:'')+'.').join('\n')+'\n\n## Victoire\n\nAccomplis puis valide ces objectifs :\n'+goals(p).map(x=>'- '+x.title).join('\n')+'\n\nAutorisations requises : '+(c.content.victory.permits.join(', ')||'aucune')+'.\n\nLe carnet vérifie les validations confirmées. Dans Manual Client, respecte manuellement cette condition avant de cocher la victoire. Archipelago simule l’accès par les permis ; il ne vérifie pas les actions Dofus.\n';
  }
  root.CarnetCampaign={clone,icons,kinds,id,fromContent,validate,signature,compile,goals,requiredPermits,renamePermit,removePermit,newObjective,newPermit,rulesMarkdown};
  if(typeof module==='object'&&module.exports)module.exports=root.CarnetCampaign;
})(typeof window==='undefined'?globalThis:window);
