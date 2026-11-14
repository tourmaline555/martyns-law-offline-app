/* Node smoke test for v3 action history using an in-memory IndexedDB test double.
   Does not require npm or internet. */
const assert=require('node:assert/strict');
const {ActionStore:unused}=globalThis;
const database=new Map();
function later(fn){setTimeout(fn,0);}
class FakeDB{
 constructor(){this.data={};this.objectStoreNames={contains:n=>!!this.data[n]};}
 createObjectStore(n){this.data[n]=new Map();}
 transaction(names){const db=this;let active=0,completed=false;
  const tx={oncomplete:null,onerror:null,onabort:null,error:null,aborted:false,abort(){tx.aborted=true;later(()=>tx.onabort?.());},objectStore(n){
   const map=db.data[n];
   const schedule=work=>{active++;const req={result:null,error:null,onsuccess:null,onerror:null};later(()=>{if(tx.aborted)return;try{req.result=work();req.onsuccess?.();}catch(e){req.error=e;tx.error=e;req.onerror?.();tx.abort();}active--;finish();});return req;};
   return {getAll:()=>schedule(()=>[...map.values()].map(structuredClone)),add:v=>schedule(()=>{if(map.has(v.id))throw Error('duplicate key');map.set(v.id,structuredClone(v));}),put:v=>schedule(()=>{map.set(v.id,structuredClone(v));}),get:k=>schedule(()=>map.has(k)?structuredClone(map.get(k)):undefined),openCursor(){
    active++;const values=[...map.values()].sort((a,b)=>a.id.localeCompare(b.id));let index=0;
    const req={result:null,onsuccess:null,onerror:null};
    function step(){later(()=>{if(tx.aborted)return;const value=values[index];if(value){req.result={value:structuredClone(value),update(v){map.set(v.id,structuredClone(v));},continue(){index++;step();}};req.onsuccess?.();}else{req.result=null;req.onsuccess?.();active--;finish();}});}
    step();return req;
   }};
  }};
  let finishQueued=false;
  function finish(){if(active!==0||completed||finishQueued||tx.aborted)return;finishQueued=true;later(()=>{finishQueued=false;if(active||tx.aborted||completed)return;completed=true;tx.oncomplete?.();});}
  return tx;
 }
 close(){}
}
globalThis.indexedDB={open(name){const req={onsuccess:null,onerror:null,onupgradeneeded:null,result:null};later(()=>{let db=database.get(name);if(!db){db=new FakeDB();database.set(name,db);req.result=db;req.onupgradeneeded?.();}req.result=db;req.onsuccess?.();});return req;}};
globalThis.PremivueIntegrity=require('./integrity.js');globalThis.AuditStore=require('./audit.js');const A=require('./actions.js');
const L=require('./logic.js');
const vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/questions.js','utf8'),ctx);const Q=ctx.window.ASSESSMENT_QUESTIONS;
const Pdf=require('./pdf.js');
const base=L.defaultState();Object.assign(base.business,{name:'Example Community Hall',site:'South Hall',activity:'halls',building:'yes',excluded:'no',peak:'350',events:'no',shared:'no'});
const available=L.activeQuestions(Q,base.business);
function makeRecord(id,createdAt,bad){const ans=Object.fromEntries(available.map(q=>[q.id,'yes']));ans.Q5=bad;const result=L.summarize(Q,base.business,ans);return {id,createdAt,business:structuredClone(base.business),siteKey:A.siteKey(base.business),result};}
(async()=>{
 const a=makeRecord('audit-1','2026-11-01T10:00:00.000Z','partly');
 assert.equal(a.result.actions.length,1);
 const n=await A.syncRecord(a);assert.equal(n.created,1);
 let rows=await A.list();assert.equal(rows.length,1);assert.equal(rows[0].questionId,'Q5');assert.equal(rows[0].status,'Open');
 await A.update(rows[0].id,{status:'In progress',owner:'Operations lead',dueDate:'2026-11-05',note:'Review on next meeting'});
 rows=await A.list();assert.equal(rows[0].owner,'Operations lead');assert.equal(rows[0].status,'In progress');
 assert.equal(A.stats(rows,'2026-11-12').overdue,1);
 const b=makeRecord('audit-2','2026-11-02T10:00:00.000Z','yes');
 const n2=await A.syncRecord(b);assert.equal(n2.cleared,1);
 rows=await A.list();assert.equal(rows[0].flagged,false);assert.equal(rows[0].status,'In progress');
 await A.update(rows[0].id,{status:'Completed',note:'Completed after staff review'});
 rows=await A.list();assert.equal(rows[0].status,'Completed');assert.ok(rows[0].completedAt);
 const c=makeRecord('audit-3','2026-11-03T10:00:00.000Z','no');
 const n3=await A.syncRecord(c);assert.equal(n3.reopened,1);
 rows=await A.list();assert.equal(rows[0].status,'Open');assert.equal(rows[0].flagged,true);assert.equal(rows[0].owner,'Operations lead');
 assert.equal((await A.events()).filter(e=>e.type==='reopened').length,1);
 const repeat=await A.reconcile([a,b,c]);assert.equal(repeat,3);assert.equal((await A.list()).length,1);
 const history=await A.events();const merge=await A.merge(rows,history);assert.equal(merge.actionsAdded,0);assert.equal(merge.eventsAdded,0);
 const result=c.result;const state={business:c.business,answers:{},notes:{}};
 const bytes=Pdf.generate(state,result,rows);assert.ok(bytes.length>5000);
 if(process.env.SAMPLE_PDF)require('node:fs').writeFileSync(process.env.SAMPLE_PDF,bytes);
 console.log(`PASS action DB: saved + changed + carried + completed + re-opened; ${history.length} logged events; archive merge idempotent; PDF ${bytes.length} bytes`);
})().catch(e=>{console.error(e);process.exitCode=1;});
