/* Local IndexedDB audit snapshots. Records are append-only via the UI, not tamper-proof. */
(function(root){
'use strict';
const DB='martyns-law-audit-v2', STORE='assessments';
function open(){return new Promise((resolve,reject)=>{if(!root.indexedDB)return reject(new Error('IndexedDB is unavailable. Use a normal browser session.'));const req=root.indexedDB.open(DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};req.onerror=()=>reject(req.error||new Error('Cannot open local records database'));req.onsuccess=()=>resolve(req.result);});}
async function transact(mode,fn){const db=await open();return new Promise((resolve,reject)=>{let result;const tx=db.transaction(STORE,mode);const store=tx.objectStore(STORE);try{result=fn(store);}catch(e){db.close();reject(e);return;}tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error||new Error('Records operation failed'));};tx.onabort=()=>{db.close();reject(tx.error||new Error('Records operation cancelled'));};});}
const clone=x=>JSON.parse(JSON.stringify(x));
function siteKey(b){return (typeof b.siteKeyId==='string'&&b.siteKeyId.startsWith('site:'))?b.siteKeyId:
  (typeof b.siteKeyId==='string'&&b.siteKeyId.includes('|'))?b.siteKeyId:
  [b.name||'',b.site||''].map(x=>String(x).trim().toLowerCase().replace(/\s+/g,' ')).join('|');}
function snapshot(state,report){
 if(!state?.business?.name?.trim())throw new Error('Business name is required');
 const id= typeof root.crypto?.randomUUID==='function'?root.crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const createdAt=new Date().toISOString();
 return {id,createdAt,format:'ml-record-v2',scoringVersion:report.scoringVersion||'legacy-methodology',questionnaireVersion:'v3.9-reliability-2026-11-14',siteKey:siteKey(state.business),
   business:clone(state.business),answers:clone(state.answers),notes:clone(state.notes||{}),result:clone(report),appVersion:'3.9'};
}
async function list(){const out=[];await transact('readonly',store=>{const req=store.openCursor();req.onsuccess=()=>{const c=req.result;if(c){out.push(c.value);c.continue();}};});return out.sort((a,b)=>a.createdAt.localeCompare(b.createdAt));}
async function put(record){if(record?.format!=='ml-record-v2'||typeof record.id!=='string')throw new Error('Invalid record');return transact('readwrite',store=>{store.add(record);});}
async function merge(records){if(!Array.isArray(records)||records.length>10000)throw new Error('Invalid records list');const existing=new Set((await list()).map(x=>x.id));let added=0;for(const record of records){if(!record||record.format!=='ml-record-v2'||!record.result||!record.business||!record.answers||typeof record.id!=='string'||record.id.length>128||!Number.isFinite(Date.parse(record.createdAt)))throw new Error('Invalid audit record');if(existing.has(record.id))continue;await put(record);existing.add(record.id);added++;}return added;}
function trend(records){return records.filter(r=>typeof r.result?.score==='number').sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(r=>({id:r.id,date:r.business?.date||r.createdAt.slice(0,10),savedAt:r.createdAt,score:r.result.score,rag:r.result.rag,scoringVersion:r.scoringVersion||r.result.scoringVersion||'legacy',scoredIds:(r.result.scoredQuestionIds||r.result.rows?.filter(x=>['yes','partly','no','not_sure'].includes(x.answer)).map(x=>x.q.id)||[]).slice().sort().join(',')}));}
root.AuditStore={snapshot,siteKey,trend,list,put,merge};
if(typeof module!=='undefined' && module.exports)module.exports={snapshot,siteKey,trend};
})(typeof window!=='undefined'?window:globalThis);
