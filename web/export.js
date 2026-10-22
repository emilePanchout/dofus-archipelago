(function(root){
  'use strict';
  const encoder=new TextEncoder();
  const table=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  function join(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){out.set(p,i);i+=p.length;}return out;}
  function zip(files){
    const local=[],central=[];let offset=0;
    for(const [path,value] of Object.entries(files)){
      if(path.startsWith('/')||path.split('/').includes('..'))throw Error('Chemin ZIP invalide.');
      const name=encoder.encode(path),bytes=typeof value==='string'?encoder.encode(value):value;
      const crc=crc32(bytes),h=new Uint8Array(30),v=new DataView(h.buffer);
      v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);
      local.push(h,name,bytes);
      const ch=new Uint8Array(46),cv=new DataView(ch.buffer);
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);
      central.push(ch,name);offset+=h.length+name.length+bytes.length;
    }
    const cd=join(central),end=new Uint8Array(22),e=new DataView(end.buffer),n=Object.keys(files).length;
    e.setUint32(0,0x06054b50,true);e.setUint16(8,n,true);e.setUint16(10,n,true);e.setUint32(12,cd.length,true);e.setUint32(16,offset,true);
    return join([...local,cd,end]);
  }
  function packageCampaign(p,assets){
    const M=root.CarnetCampaign,c=M.compile(p),files={};
    for(const [name,value] of Object.entries(assets.manual))files[c.folder+'/'+name]=value;
    for(const [name,value] of Object.entries(c.data))files[c.folder+'/data/'+name+'.json']=JSON.stringify(value,null,2)+'\n';
    files[c.folder+'/archipelago.json']=JSON.stringify({game:c.game,world_version:'0.2.1',minimum_ap_version:'0.6.3',compatible_version:7,version:7},null,2);
    files[c.folder+'/REGLES.md']=M.rulesMarkdown(p);
    const hook=c.folder+'/hooks/World.py';
    files[hook]=files[hook].replace('def after_fill_slot_data(slot_data: dict, world: World, multiworld: MultiWorld, player: int) -> dict:\n    return slot_data','def after_fill_slot_data(slot_data: dict, world: World, multiworld: MultiWorld, player: int) -> dict:\n    slot_data["carnet_campaign"] = "'+c.hash+'"\n    return slot_data');
    if(!files[hook].includes('slot_data["carnet_campaign"]'))throw Error('Base Manual incompatible : export annulé.');
    const safeJSON=x=>JSON.stringify(x).replace(/</g,'\\u003c');
    const contentJS='window.CarnetContent='+safeJSON(c.content)+';';
    function inject(html,slot,source){
      const marker='<scr'+'ipt data-carnet-slot="'+slot+'">',close='</scr'+'ipt>';
      const start=html.indexOf(marker),end=html.indexOf(close,start);
      if(start<0||end<0)throw Error('Modèle HTML incomplet : export annulé.');
      return html.slice(0,start+marker.length)+source+html.slice(end);
    }
    const html=inject(assets.carnet,'content',contentJS);
    const editor=inject(inject(assets.editor,'content',contentJS+'\nwindow.CarnetInitialCampaign='+safeJSON(p)+';'),'assets','window.CarnetExportAssets='+safeJSON(assets)+';');
    const guide='# Installer cette campagne\n\n1. Ferme Archipelago puis installe le fichier .apworld de ce dossier (Install APWorld ou custom_worlds). Conserve Manual Client installé si tu veux l’utiliser.\n2. Mets le YAML de ce dossier et ceux de tes amis (dont HuniePop) dans Players. Un seul YAML par joueur.\n3. Génère une NOUVELLE partie, puis héberge son fichier généré.\n4. Ouvre Carnet-Dofus.html et connecte le joueur '+p.player+'. Avec Manual Client, utilise le fichier .apmanual produit par cette nouvelle génération.\n5. Lis REGLES.md avant de jouer.\n\nCette exportation ne modifie aucune partie en cours. Les objectifs envoient les objets tirés au sort par Archipelago. Un permis ne change pas automatiquement Dofus.\n\nPour modifier la campagne : importe campagne.json dans Editeur-Dofus.html du kit. Chaque définition de campagne modifiée possède une nouvelle identité de monde ; ne mélange pas ses fichiers avec une génération précédente.\n\nMonde : '+c.game+'\nBase Manual stable manual_stable_20260319, commit f14927694656a33923817cd1b2ef556cab3eedda, licence MIT incluse dans l’APWorld.\n';
    const notices=assets.clientLicense?{'LICENSE':assets.clientLicense,'THIRD_PARTY_NOTICES.md':assets.thirdPartyNotices||'','vendor/manual/LICENSE':assets.manual.LICENSE}:{};
    return {compiled:c,files:{[c.folder+'.apworld']:zip(files),[p.player.replace(/[^A-Za-z0-9_-]/g,'_')+'.yaml']:c.yaml,'campagne.json':JSON.stringify(p,null,2)+'\n','Carnet-Dofus.html':html,'Editeur-Dofus.html':editor,'REGLES.md':M.rulesMarkdown(p),'INSTALLATION.md':guide,...notices}};
  }
  function download(name,value,type='application/octet-stream'){
    const blob=new Blob([value],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  root.CarnetExport={zip,crc32,packageCampaign,download};
  if(typeof module==='object'&&module.exports)module.exports=root.CarnetExport;
})(typeof window==='undefined'?globalThis:window);
