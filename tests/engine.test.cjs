const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../web/content.js');
const {CarnetClient,normalizeAddress}=require('../web/engine.js');
class FakeSocket{constructor(){this.readyState=1;this.sent=[];}send(s){this.sent.push(...JSON.parse(s));}close(){this.readyState=3;}}
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
const names=Object.fromEntries(C.objectives.map((o,i)=>[o.name,i+1]));
const items=Object.fromEntries(C.permits.map((o,i)=>[o.name,i+1]));
function setup(){
 const notices=[];const c=new CarnetClient(C,{WebSocket:FakeSocket,storage:storage(),onNotice:(...a)=>notices.push(a)});
 c.connect({server:'localhost:38281',name:'JoueurDofus'});
 c.handle({cmd:'RoomInfo',seed_name:'test-run',games:[C.game],version:{major:0,minor:6,build:8}});
 c.handle({cmd:'Connected',slot:1,team:0,slot_info:{1:{name:'JoueurDofus',game:C.game}},checked_locations:[],missing_locations:Object.values(names)});
 c.handle({cmd:'DataPackage',data:{games:{[C.game]:{location_name_to_id:{...names},item_name_to_id:{...items}}}}});
 return {c,notices};
}
test('normalizes addresses and rejects unsafe schemes',()=>{
 assert.equal(normalizeAddress(' localhost:38281 '),'ws://localhost:38281/');
 assert.equal(normalizeAddress('wss://example.org:443'),'wss://example.org/');
 assert.throws(()=>normalizeAddress('https://example.org'));
 assert.throws(()=>normalizeAddress('ws://name:pass@localhost'));
});
test('demo never opens a socket and does not reuse demo permits in live mode',()=>{
 const c=new CarnetClient(C,{WebSocket:FakeSocket});c.startDemo();
 assert.equal(c.ws,null);assert.equal(c.completed(),4);assert(c.has('Permis artisanat'));
 c.connect({server:'localhost',name:'JoueurDofus'});assert(!c.has('Permis artisanat'));assert.equal(c.completed(),0);c.disconnect(true);
});
test('checks require a real connection, a matching datapackage, and server acknowledgement',()=>{
 const {c}=setup();assert(c.ready);assert.equal(c.connection,'online');
 const o=C.objectives[0];assert(c.canCheck(o));c.check(o);
 assert(!c.isChecked(o));assert.equal(c.ws.sent.at(-1).cmd,'LocationChecks');
 assert(!c.canCheck(o));c.handle({cmd:'RoomUpdate',checked_locations:[1]});assert(c.isChecked(o));c.disconnect(true);
});
test('locked objectives cannot be sent; counters are notes and do not send checks',()=>{
 const {c}=setup();const o=C.objectives[4];assert.throws(()=>c.check(o));
 c.handle({cmd:'ReceivedItems',index:0,items:[{item:items['Permis artisanat'],location:42,player:2}]});
 const before=c.ws.sent.length;c.setCounter(o,1);assert.equal(c.ws.sent.length,before);assert(c.canCheck(o));
 c.check(o);assert.equal(c.ws.sent.at(-1).locations[0],5);c.disconnect(true);
});
test('duplicate item packets do not duplicate items or permits; gaps request a snapshot',()=>{
 const {c}=setup();c.handle({cmd:'ReceivedItems',index:0,items:[{item:2,location:1,player:2}]});
 const more={cmd:'ReceivedItems',index:1,items:[{item:3,location:2,player:2}]};c.handle(more);c.handle(more);
 assert.equal(c.items.length,2);c.handle({cmd:'ReceivedItems',index:6,items:[{item:4,location:3,player:2}]});assert.equal(c.ws.sent.at(-1).cmd,'Sync');assert.equal(c.items.length,2);c.disconnect(true);
});
test('the first new item after an empty login raises a notification',async()=>{
 const {c,notices}=setup();await Promise.resolve();
 c.handle({cmd:'ReceivedItems',index:0,items:[{item:2,location:45,player:2}]});
 assert.equal(notices.length,1);assert.equal(notices[0][1],'Artisanat');c.disconnect(true);
});
test('counters persist per seed and player, and checked goals restore counter minimums',()=>{
 const {c}=setup();const o=C.objectives[1];c.setCounter(o,2);c.loadLocal();assert.equal(c.progress(o),2);
 c.seed='different-run';c.loadLocal();assert.equal(c.progress(o),0);
 c.checked.add(2);c.reconcileCounters();assert.equal(c.progress(o),3);c.disconnect(true);
});
test('a foreign or incomplete configuration disables sending checks',()=>{
 const {c}=setup();delete c.packages[C.game].location_name_to_id[C.objectives[0].name];c.updateReady();assert(!c.ready);assert.throws(()=>c.check(C.objectives[1]));c.disconnect(true);
});
test('victory needs all twelve confirmed checks and all five permits',()=>{
 const {c}=setup();assert.throws(()=>c.finish());
 c.handle({cmd:'RoomUpdate',checked_locations:Object.values(names)});assert(!c.canGoal());
 c.handle({cmd:'ReceivedItems',index:0,items:Object.values(items).map(item=>({item,location:10,player:2}))});assert(c.canGoal());
 c.finish();assert.equal(c.ws.sent.at(-2).cmd,'StatusUpdate');assert.equal(c.ws.sent.at(-2).status,30);assert(!c.goal);
 c.handle({cmd:'Retrieved',keys:{[c.goalKey()]:30}});assert(c.goal);assert(!c.canGoal());c.disconnect(true);
});
test('bad slot errors are actionable and do not expose the password',()=>{
 const {c}=setup();c.settings.password='secret-test';c.handle({cmd:'ConnectionRefused',errors:['InvalidSlot']});
 assert.match(c.error,/Nom de joueur/);assert(!JSON.stringify(c.logs).includes('secret-test'));assert.equal(c.connection,'offline');
});
