/* Premivue v4 single IndexedDB containing audit records, actions, action history and import conflicts.
   Imports are committed in one database transaction; records are not tamper-evident. */
(function(root){
'use strict';
const DB='martyns-law-audit-v2',VERSION=2,ASSESS='assessments',ACTIONS='actions',EVENTS='actionEvents',CONFLICTS='importConflicts';
const clone=x=>JSON.parse(JSON.stringify(x));
const I=root.PremivueIntegrity||(typeof require==='function'?require('./integrity.js'):null);
function open(){return new Promise((resolve,reject)=>{
 if(!root.indexedDB)return reject(new Error('IndexedDB unavailable in this browser'));
 const q=root.indexedDB.open(DB,VERSION);
 q.onupgradeneeded=()=>{const db=q.result;for(const name of [ASSESS,ACTIONS,EVENTS,CONFLICTS])if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});};
 q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||Error('Unable to open audit storage'));
 });}
function transaction(names,mode,fn){return open().then(db=>new Promise((resolve,reject)=>{
 const tx=db.transaction(names,mode);let answer;
 try{answer=fn(tx);}catch(e){tx.abort();reject(e);return;}
 tx.oncomplete=()=>{db.close();resolve(answer);};
 tx.onerror=()=>{db.close();reject(tx.error||Error('Records transaction failed; no changes committed'));};
 tx.onabort=()=>{db.close();reject(tx.error||Error('Records transaction rolled back'));};
 }));}
function all(store){return new Promise((resolve,reject)=>{const out=[];const req=store.openCursor();req.onsuccess=()=>{const c=req.result;if(c){out.push(c.value);c.continue();}else resolve(out);};req.onerror=()=>reject(req.error);});}
function siteKey(b){return (typeof b.siteKeyId==='string'&&b.siteKeyId.startsWith('site:'))?b.siteKeyId:
  (typeof b.siteKeyId==='string'&&b.siteKeyId.includes('|'))?b.siteKeyId:
  [b.name||'',b.site||''].map(x=>String(x).trim().toLowerCase().replace(/\s+/g,' ')).join('|');}
function snapshot(state,report){
 if(!state?.business?.name?.trim())throw Error('Business name required');
 const id=typeof root.crypto?.randomUUID==='function'?root.crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const createdAt=new Date().toISOString();
 return {id,createdAt,format:'ml-record-v2',scoringVersion:report.scoringVersion||'legacy',questionnaireVersion:'v4.0-integrity',siteKey:siteKey(state.business),
 business:clone(state.business),answers:clone(state.answers),notes:clone(state.notes||{}),result:clone(report),appVersion:'4.1',importValidation:'local',importValidationNote:'Created in this browser; not independently audited'};
}
async function list(){let out=[];await transaction([ASSESS],'readonly',tx=>{all(tx.objectStore(ASSESS)).then(r=>{out=r;});});
 // Existing local v3.9 snapshots were never marked as verified. Check without rewriting history.
 const Q=root.ASSESSMENT_QUESTIONS,L=root.ReadinessLogic;
 if(Q&&L)out=out.map(r=>{if(r.importValidation)return r;
   if(r.appVersion==='3.9'||r.appVersion==='3.8'){
      try{const checked=I.validateRecord(r,Q,L);return {...r,importValidation:checked.importValidation,importValidationNote:checked.importValidationNote};}
      catch(e){return {...r,importValidation:'legacy',importValidationNote:'Stored rating not verified under current method: '+e.message};}
   }return {...r,importValidation:'legacy',importValidationNote:'Older local record; method not recalculated'};
 });
 return out.sort(I?.chronological||((a,b)=>a.createdAt.localeCompare(b.createdAt)));}

async function put(r){if(!r||r.format!=='ml-record-v2'||typeof r.id!=='string')throw Error('Invalid audit record');return transaction([ASSESS],'readwrite',tx=>{tx.objectStore(ASSESS).add(r);});}
// Legacy helper used by earlier tests. New UI uses importBundleAtomic for all-or-nothing import.
async function merge(records){if(!Array.isArray(records)||records.length>10000)throw Error('Invalid record list');const known=new Set((await list()).map(r=>r.id));let count=0;
 await transaction([ASSESS],'readwrite',tx=>{const store=tx.objectStore(ASSESS);for(const r of records){if(!r?.id||r.format!=='ml-record-v2'||!r.business||!r.result||!r.answers||!r.createdAt)throw Error('Invalid audit record');if(!known.has(r.id)){store.add(r);known.add(r.id);count++;}}});return count;}
async function listConflicts(){let rows=[];await transaction([CONFLICTS],'readonly',tx=>{all(tx.objectStore(CONFLICTS)).then(r=>{rows=r;});});return rows.filter(r=>r.type!=='system').sort((a,b)=>b.at.localeCompare(a.at));}
/** One atomic transaction across all three user-data stores; no partial imports.
 * Decision map: action ID -> 'incoming' or 'local'. Both copies retained in conflict store.
 * Caller must preflight/validate all remote records and obtain explicit decisions first.
 */
async function importBundleAtomic(prepared,decisions={}){
 const existingRecords=await list();const localActions=await root.ActionStore.list();const knownRecords=new Map(existingRecords.map(r=>[r.id,r]));
 const knownActions=new Map(localActions.map(a=>[a.id,a]));
 for(const r of prepared.records){const prev=knownRecords.get(r.id);if(prev&&JSON.stringify(prev.answers)!==JSON.stringify(r.answers))throw Error('An existing record ID has different answers. Import cancelled without modifying records.');}
 const clashes=root.PremivueIntegrity.planMerge(localActions,prepared.actions);
 for(const c of clashes)if(!['incoming','local'].includes(decisions[c.id]))throw Error('Action edit conflict must be resolved before import: '+c.questionId);
 let recordsAdded=0,actionsAdded=0,actionsUpdated=0,eventsAdded=0,conflictsRecorded=0;
 await transaction([ASSESS,ACTIONS,EVENTS,CONFLICTS],'readwrite',tx=>{
  const ar=tx.objectStore(ASSESS),ac=tx.objectStore(ACTIONS),ev=tx.objectStore(EVENTS),cf=tx.objectStore(CONFLICTS);
  // Read all keys again under the same write transaction: avoid race between preview and apply.
  for(const r of prepared.records){const req=ar.get(r.id);req.onsuccess=()=>{if(!req.result){ar.add(r);recordsAdded++;}else if(JSON.stringify(req.result.answers)!==JSON.stringify(r.answers))tx.abort();};}
  for(const incoming of prepared.actions){const req=ac.get(incoming.id);req.onsuccess=()=>{
    const local=req.result;if(!local){ac.add(incoming);actionsAdded++;return;}
    if(!root.PremivueIntegrity.actionDiff(local,incoming))return;
    const decision=decisions[incoming.id];if(!decision){tx.abort();return;}
    // Preserve the discarded version in an explicitly labelled conflict record.
    const loser=decision==='incoming'?local:incoming;
    const id='import-'+Date.now()+'-'+(root.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
    cf.add({id,at:new Date().toISOString(),actionId:incoming.id,questionId:incoming.questionId,siteKey:incoming.siteKey,
      choice:decision,localUpdatedAt:local.updatedAt,incomingUpdatedAt:incoming.updatedAt,retainedAlternative:loser});conflictsRecorded++;
    if(decision==='incoming'){ac.put(incoming);actionsUpdated++;}
   };}
  for(const row of prepared.events){if(decisions[row.actionId]==='local')continue;const req=ev.get(row.id);req.onsuccess=()=>{if(!req.result){ev.add(row);eventsAdded++;}};}
 });
 return {recordsAdded,actionsAdded,actionsUpdated,eventsAdded,conflictsRecorded};
}
function trend(records){return records.filter(r=>typeof r.result?.score==='number'&&Number.isFinite(r.result.score)&&!r.result.provisional)
 .sort(I.chronological).map(r=>({id:r.id,date:I.dateOf(r),savedAt:r.createdAt,importedAt:r.importedAt||'',score:r.result.score,rag:r.result.rag,verified:I.verified(r),scoringVersion:r.scoringVersion||r.result.scoringVersion||'legacy',scoredIds:(r.result.scoredQuestionIds||r.result.rows?.filter(x=>['yes','partly','no','not_sure'].includes(x.answer)).map(x=>x.q.id)||[]).slice().sort().join(','),backdated:!!(r.business?.date&&r.createdAt.slice(0,10)>r.business.date)}));}
const api={open,transaction,all,snapshot,siteKey,trend,list,put,merge,importBundleAtomic,listConflicts};
root.AuditStore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
