const assert=require('node:assert/strict');
const C=process.env.CARNET_CONTENT?JSON.parse(require('node:fs').readFileSync(process.env.CARNET_CONTENT,'utf8')).content:require('../web/content.js');
const {CarnetClient}=require('../web/engine.js');
const c=new CarnetClient(C,{uuid:'carnet-live-test'});
const second=new CarnetClient(C,{uuid:'manual-compatible-test'});
const wait=async(check,label)=>{const end=Date.now()+12000;while(!check()){if(Date.now()>end)throw new Error(label+' timed out: '+c.error+' '+JSON.stringify(c.logs.slice(0,3)));await new Promise(r=>setTimeout(r,25));}};
(async()=>{
 try{
  c.connect({server:'127.0.0.1:38289',name:C.player||'JoueurDofus'});
  await wait(()=>c.ready,'Connection');
  assert.equal(c.connection,'online');
  assert.equal(c.completed(),0);
  second.connect({server:'127.0.0.1:38289',name:C.player||'JoueurDofus'});
  await wait(()=>second.ready,'Second connection on same slot');
  const first=C.objectives.find(o=>c.unlocked(o));
  if(first.counter)second.setCounter(first,first.target);second.check(first);
  await wait(()=>c.isChecked(first)&&second.isChecked(first),'Shared confirmation');
  assert.equal(c.connection,'online');assert.equal(second.connection,'online');
  console.log('PASS: two independent clients share the same slot and receive confirmed checks.');
  let iterations=0;
  while(c.completed()<C.objectives.length){
   const available=C.objectives.filter(o=>!c.isChecked(o)&&c.unlocked(o));
   if(!available.length){await new Promise(r=>setTimeout(r,75));if(++iterations>40)throw Error('Progression stalled.');continue;}
   for(const o of available){if(o.counter)c.setCounter(o,o.target);c.check(o);await wait(()=>c.isChecked(o),o.title);}
  }
  await wait(()=>C.permits.every(p=>c.has(p.name)),'Permits');
  assert(c.canGoal());c.finish();await wait(()=>c.goal,'Victory');
  console.log('PASS: actual server handshake, mapping, '+C.objectives.length+' acknowledged checks, '+C.permits.length+' permits and victory.');
  c.disconnect(true);
  c.connect({server:'127.0.0.1:38289',name:C.player||'JoueurDofus'});
  await wait(()=>c.ready&&c.completed()===C.objectives.length&&c.goal,'Reconnect');
  await wait(()=>C.permits.every(p=>c.has(p.name)),'Restored inventory');
  console.log('PASS: reconnect restores all checks, items and victory from server.');
 }finally{c.disconnect(true);second.disconnect(true);}
})().catch(e=>{console.error(e);process.exitCode=1;});
