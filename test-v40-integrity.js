'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const Integrity=require('./integrity.js'),Logic=require('./logic.js');
const Q=require('./question-data.json');
const fixture=JSON.parse(fs.readFileSync('/mnt/data/Premivue-Synthetic-3-Monthly-Assessments/Premivue-DEMO-ALL-THREE.json','utf8'));
const valid=Integrity.validateBundle(fixture,Q,Logic);
assert.equal(valid.records.length,3);assert.equal(valid.records[0].importValidation,'verified');
let tampered=structuredClone(fixture);tampered.records[0].result.score=100;tampered.records[0].result.rag='Green';
assert.throws(()=>Integrity.validateBundle(tampered,Q,Logic),/do not agree/);
tampered=structuredClone(fixture);tampered.actionEvents.push({id:'bad',actionId:'bad',detail:'bad',at:'not-date'});
assert.throws(()=>Integrity.validateBundle(tampered,Q,Logic),/Invalid action history/);
const b={...Logic.defaultState().business,name:'Sample Site',site:'York',activity:'shops',building:'yes',excluded:'no',peak:'250',peakMethod:'Observed',events:'no',shared:'no'};
let q=Logic.activeQuestions(Q,b),ans=Object.fromEntries(q.map(i=>[i.id,'yes']));delete ans.Q8;
const incomplete=Logic.summarize(Q,b,ans);assert.equal(incomplete.rag,'Unrated');assert.equal(incomplete.score,null);assert.ok(incomplete.rawScore>99);
assert.equal(Integrity.chronological(valid.records[0],valid.records[1])<0,true);
const reversed=valid.records.slice().reverse().sort(Integrity.chronological);assert.equal(reversed[0].business.date,'2026-05-14');
assert.equal(Integrity.compareVersions(valid.records[0],valid.records[2]),true);
let updated=structuredClone(valid.actions[0]);updated.status='In progress';updated.updatedAt='2026-11-14T20:00:00.000Z';
let conflicts=Integrity.planMerge(valid.actions,[updated]);assert.equal(conflicts.length,1);assert.equal(conflicts[0].kind,'incoming newer');
const e=valid.events.filter(ev=>ev.actionId===valid.actions[0].id);
assert.notEqual(Integrity.stateAt(valid.actions[0],e,'2026-05-14').status,'Completed');
assert.equal(Integrity.stateAt(valid.actions[0],e,'2026-11-14').status,'Completed');

// Deliberately small in-memory asynchronous IndexedDB with atomic transaction staging.
const DBs=new Map();let failNext=false;
class DB{
 constructor(){this.data=new Map();this.version=0;this.objectStoreNames={contains:n=>this.data.has(n)};}
 createObjectStore(name){this.data.set(name,new Map());}
 transaction(names,mode){const base=this;const staged=new Map(names.map(n=>[n,new Map(base.data.get(n)||[])]));let pending=0,finished=false,stopped=false;
 const tx={oncomplete:null,onerror:null,onabort:null,error:null,abort(){if(stopped)return;stopped=true;setTimeout(()=>tx.onabort?.(),0);},objectStore(name){const map=staged.get(name);if(!map)throw Error('Missing store '+name);
 const later=fn=>{pending++;const r={result:undefined,onsuccess:null,onerror:null};setTimeout(()=>{
  if(stopped)return;try{if(failNext){failNext=false;throw Error('test injected write failure');}r.result=fn();r.onsuccess?.();}catch(e){tx.error=e;r.onerror?.();tx.abort();}pending--;commitIfReady();},0);return r;};
 return {get:k=>later(()=>structuredClone(map.get(k))),getAll:()=>later(()=>[...map.values()].map(v=>structuredClone(v))),add:v=>later(()=>{if(map.has(v.id))throw Error('duplicate');map.set(v.id,structuredClone(v));}),put:v=>later(()=>{map.set(v.id,structuredClone(v));}),openCursor(){
  pending++;const rows=[...map.values()].sort((a,b)=>a.id.localeCompare(b.id));let index=0;const r={result:null,onsuccess:null,onerror:null};const fire=()=>setTimeout(()=>{if(stopped)return;if(index>=rows.length){r.result=null;r.onsuccess?.();pending--;commitIfReady();return;}const value=rows[index];r.result={value:structuredClone(value),update(v){map.set(v.id,structuredClone(v));},continue(){index++;fire();}};r.onsuccess?.();},0);fire();return r;
 }};}};
 const commitIfReady=()=>{if(pending||finished||stopped)return;finished=true;setTimeout(()=>{if(stopped)return;if(mode==='readwrite')for(const [k,v] of staged)base.data.set(k,v);tx.oncomplete?.();},0);};
 return tx;
 }
 close(){}
}
globalThis.indexedDB={open(name,version=1){const r={result:null,onsuccess:null,onerror:null,onupgradeneeded:null};setTimeout(()=>{let db=DBs.get(name);if(!db){db=new DB();DBs.set(name,db);}const upgrading=db.version<version;db.version=version;r.result=db;if(upgrading)r.onupgradeneeded?.();r.onsuccess?.();},0);return r;}};
const legacy=new DB();legacy.createObjectStore('actions');legacy.createObjectStore('actionEvents');legacy.data.get('actions').set('legacy-action',{id:'legacy-action',siteKey:'legacy-site',questionId:'Q9',question:'Old local action',status:'Open',updatedAt:'2026-05-01T00:00:00.000Z',priority:'High',owner:'',note:'',dueDate:'',business:'Old site',site:'Old location'});legacy.data.get('actionEvents').set('legacy-event',{id:'legacy-event',actionId:'legacy-action',type:'created',detail:'Old event',at:'2026-05-01T00:00:00.000Z'});DBs.set('martyns-law-action-tracker-v3',legacy);
globalThis.PremivueIntegrity=Integrity;
globalThis.AuditStore=require('./audit.js');globalThis.ActionStore=require('./actions.js');
(async()=>{
 const store=globalThis.AuditStore,actions=globalThis.ActionStore;
await actions.migrateLegacy();assert.equal((await actions.list()).some(a=>a.id==='legacy-action'),true,'old action database migrated safely');
const added=await store.importBundleAtomic(valid,{});
 assert.equal(added.recordsAdded,3);assert.ok(added.actionsAdded>20);
 const rows=await store.list();assert.deepEqual(rows.map(x=>x.business.date),['2026-05-14','2026-08-14','2026-11-14']);
 const trend=store.trend(rows);assert.deepEqual(trend.map(x=>Math.round(x.score)),[40,60,90]);
 assert.equal(trend.every(x=>x.verified),true);
 // Apply edited action from other device, preserving local version in a conflict record.
 const latest=structuredClone(valid.actions[0]);latest.status='On hold';latest.updatedAt='2026-11-14T20:00:00.000Z';latest.note='Other-device review';
 let planned=Integrity.planMerge(await actions.list(),[latest]);assert.equal(planned.length,1);
 const incoming={records:[],actions:[latest],events:[]};
 assert.rejects(store.importBundleAtomic(incoming,{}),/must be resolved/);
 const result=await store.importBundleAtomic(incoming,{[latest.id]:'incoming'});
 assert.equal(result.actionsUpdated,1);assert.equal((await store.listConflicts()).length,1);
 assert.equal((await actions.list()).find(x=>x.id===latest.id).status,'On hold');
 // Full validation before commit: after an injected failed transaction all three stores stay unchanged.
 const current=(await store.list()).length,newRec=structuredClone(valid.records[0]);newRec.id='new-test-case';
 failNext=true;await assert.rejects(store.importBundleAtomic({records:[newRec],actions:[],events:[]},{}));
 assert.equal((await store.list()).length,current);
 // Duplicate import harmless.
 const dup=await store.importBundleAtomic(valid,{[latest.id]:'local'});
 assert.equal(dup.recordsAdded,0);
 console.log('PASS v4.0: scoring integrity, historic date ordering, verified imports, action conflict retention, atomic rollback, encrypted-backup compatible data.');
})().catch(e=>{console.error(e);process.exitCode=1;});
