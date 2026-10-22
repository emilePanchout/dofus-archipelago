const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const M=require('../web/campaign.js');
const E=require('../web/export.js');
const {CarnetClient}=require('../web/engine.js');
const C=require('../web/content.js');
const base=()=>M.fromContent(C);
const assets={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/export-assets.js'),'utf8'),{window:assets});
test('the published sample matches the generic defaults',()=>{
 const example=JSON.parse(fs.readFileSync(path.join(__dirname,'../examples/campagne-exemple.json'),'utf8'));
 assert.deepEqual(example,base());
});
test('a profile produces one coherent Manual world, YAML and carnet',()=>{
 const p=base(),c=M.compile(p);assert.equal(c.data.locations.length,13);assert.equal(c.data.items.length,5);
 assert(c.yaml.includes(c.game));assert.equal(c.content.game,c.game);assert.equal(M.validate(p).errors.length,0);
 assert.equal(c.data.locations[4].requires,'|Permis artisanat|');
});
test('changing rules changes campaign identity; importing exact JSON preserves it',()=>{
 const p=base(),hash=M.compile(p).hash;assert.equal(M.compile(JSON.parse(JSON.stringify(p))).hash,hash);
 p.objectives[0].description+=' Avec une classe imposée.';assert.notEqual(M.compile(p).hash,hash);
});
test('different players can share the same campaign world and choose their own slot names',()=>{
 const p=base();p.player='Alice';const a=M.compile(p);p.player='Bob';const b=M.compile(p);
 assert.equal(a.game,b.game);assert.equal(a.hash,b.hash);assert.notEqual(a.yaml,b.yaml);
 assert.equal(a.content.player,'Alice');assert.equal(b.content.player,'Bob');
 assert.equal(base().creator,'Communaute');assert.equal(base().player,'JoueurDofus');
});
test('invalid references, duplicate names, invalid counters and closed starts are blocked',()=>{
 for(const mutate of [p=>p.objectives[1].name=p.objectives[0].name,p=>p.objectives[1].requires=['permis absent'],p=>{p.objectives[1].target=0;},p=>p.objectives.forEach(o=>o.requires=['Permis artisanat']),p=>p.permits[0].name='bad|name',p=>p.permits=Array.from({length:13},(_,i)=>({...M.newPermit(),name:'Permis '+i}))]){
  const p=base();mutate(p);assert(M.validate(p).errors.length);assert.throws(()=>M.compile(p));
 }
});
test('renaming or removing a permit updates objective and victory references',()=>{
 const p=base();M.renamePermit(p,1,'Métier autorisé');assert.deepEqual(p.objectives[4].requires,['Métier autorisé']);assert(p.victory.permits.includes('Métier autorisé'));
 M.removePermit(p,1);assert.deepEqual(p.objectives[4].requires,[]);assert(!p.victory.permits.includes('Métier autorisé'));assert.equal(M.validate(p).errors.length,0);
});
test('selected victory includes permissions required by its chosen objectives',()=>{
 const p=base();p.victory={mode:'selected',objectives:[p.objectives[4].id],permits:[]};
 const c=M.compile(p);assert.deepEqual(c.content.victory.objectives,[p.objectives[4].name]);assert.deepEqual(c.content.victory.permits,['Permis artisanat']);
 const client=new CarnetClient(c.content);client.startDemo();assert(!client.canGoal());client.demoPermits.add('Permis artisanat');client.demoChecked.add(p.objectives[4].name);assert(client.canGoal());assert.equal(client.completed(),1);
});
test('arbitrary counts and shared counters work without assuming twelve goals or five permits',()=>{
 const p=base();p.objectives=p.objectives.slice(0,3);p.permits=[];p.victory={mode:'all',objectives:[],permits:[]};
 p.objectives[1].counter=p.objectives[2].counter='actions';p.objectives[1].target=2;p.objectives[2].target=5;
 const client=new CarnetClient(M.compile(p).content);client.startDemo();client.setCounter(p.objectives[1],4);assert.equal(client.progress(p.objectives[1]),2);assert.equal(client.progress(p.objectives[2]),4);assert.equal(client.completed(),0);
 p.objectives.forEach(o=>client.demoChecked.add(o.name));assert(client.canGoal());client.disconnect(true);
});
test('campaign fingerprint and exact objective set prevent using another generation',()=>{
 const c=M.compile(base()),client=new CarnetClient(c.content);client.authenticated=true;client.slotData={carnet_campaign:c.hash};
 const ids=Object.fromEntries(c.content.objectives.map((o,i)=>[o.name,i+1]));client.missing=new Set(Object.values(ids));
 client.packages[c.game]={location_name_to_id:ids,item_name_to_id:Object.fromEntries(c.content.permits.map((p,i)=>[p.name,i+100]))};client.updateReady();assert(client.ready);
 client.slotData={carnet_campaign:'different'};client.updateReady();assert(!client.ready);
 client.slotData={carnet_campaign:c.hash};client.missing.add(9999);client.updateReady();assert(!client.ready);
});
test('export bundles an installable APWorld, both standalone interfaces and escaped user text',()=>{
 const p=base();p.rules+=' </script><img src=x onerror=alert(1)>';
 const out=E.packageCampaign(p,assets.CarnetExportAssets);
 assert(out.files['Editeur-Dofus.html'].includes('window.CarnetInitialCampaign='));
 assert(!out.files['Carnet-Dofus.html'].includes('</script><img src=x'));
 assert(out.files['Carnet-Dofus.html'].includes('\\u003c/script>'));
 for(const name of ['Carnet-Dofus.html','Editeur-Dofus.html']){
  const html=out.files[name],scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  assert(scripts.length>=5);scripts.forEach((s,i)=>new vm.Script(s[1],{filename:name+' script '+i}));
  assert(!/<script[^>]+src=/.test(html));
 }
 assert(out.files[out.compiled.folder+'.apworld'].length>10000);
 assert(out.files.LICENSE.includes('Dofus Archipelago contributors'));
 assert(out.files['vendor/manual/LICENSE'].includes('Manual for Archipelago'));
 const dir=path.join(__dirname,'generated');fs.mkdirSync(dir,{recursive:true});
 for(const [name,value] of Object.entries(out.files)){const target=path.join(dir,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);}
 fs.writeFileSync(path.join(dir,'pack.zip'),E.zip(out.files));
 fs.writeFileSync(path.join(dir,'compiled.json'),JSON.stringify(out.compiled));
});
