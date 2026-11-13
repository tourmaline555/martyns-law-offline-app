/* Offline action tracker. Separate IndexedDB from historical assessment snapshots.
   No network/API calls. Field changes have a local change log, but this is not tamper-proof. */
(function(root){
'use strict';
const DB='martyns-law-action-tracker-v3', ACTIONS='actions', EVENTS='actionEvents';
const STATUS=['Open','In progress','On hold','Completed'];
const PRIORITY={Immediate:0,High:1,Medium:2,Low:3,Maintain:4};
const uuid=()=>typeof root.crypto?.randomUUID==='function'?root.crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function open(){return new Promise((resolve,reject)=>{
 if(!root.indexedDB)return reject(new Error('IndexedDB unavailable. Use a normal browser session.'));
 const req=root.indexedDB.open(DB,1);
 req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(ACTIONS))db.createObjectStore(ACTIONS,{keyPath:'id'});if(!db.objectStoreNames.contains(EVENTS))db.createObjectStore(EVENTS,{keyPath:'id'});};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Unable to open action database'));
 });}
function operate(storeNames,mode,fn){return open().then(db=>new Promise((resolve,reject)=>{
 let result;const tx=db.transaction(storeNames,mode);
 try{result=fn(tx);}catch(e){tx.abort();reject(e);return;}
 tx.oncomplete=()=>{db.close();resolve(result);};
 tx.onerror=()=>{db.close();reject(tx.error||new Error('Action database transaction failed'));};
 tx.onabort=()=>{db.close();reject(tx.error||new Error('Action database transaction cancelled'));};
 }));}
function all(store){return new Promise((resolve,reject)=>{const out=[];const req=store.openCursor();req.onsuccess=()=>{const c=req.result;if(c){out.push(c.value);c.continue();}else resolve(out);};req.onerror=()=>reject(req.error);});}
async function list(){let rows=[];await operate([ACTIONS],'readonly',tx=>{all(tx.objectStore(ACTIONS)).then(r=>{rows=r;});});return rows.sort((a,b)=>(PRIORITY[a.priority]??5)-(PRIORITY[b.priority]??5)||a.siteKey.localeCompare(b.siteKey)||a.questionId.localeCompare(b.questionId,undefined,{numeric:true}));}
async function events(){let rows=[];await operate([EVENTS],'readonly',tx=>{all(tx.objectStore(EVENTS)).then(r=>{rows=r;});});return rows.sort((a,b)=>a.at.localeCompare(b.at));}
function siteKey(b){return [b.name||'',b.site||''].map(x=>String(x).trim().toLowerCase().replace(/\s+/g,' ')).join('|');}
function actionId(site,questionId){return JSON.stringify([site,questionId]);}
function eventFor(id,type,detail,at=new Date().toISOString()){return {id:uuid(),actionId:id,type,detail:String(detail).slice(0,650),at};}
function checkedDate(v){return typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v+'T00:00:00Z')) ? v : '' ;}
function overdue(a,today){return a.status!=='Completed'&&!!a.dueDate&&a.dueDate<today;}
function stats(rows,today){return {all:rows.length,active:rows.filter(a=>a.status!=='Completed').length,completed:rows.filter(a=>a.status==='Completed').length,overdue:rows.filter(a=>overdue(a,today)).length,inProgress:rows.filter(a=>a.status==='In progress').length};}
function makeNew(record,item){const now=new Date().toISOString();return {
 id:actionId(record.siteKey,item.q.id),siteKey:record.siteKey, business:record.business.name||'',site:record.business.site||'',
 questionId:item.q.id,question:item.q.text,section:item.q.section||'',priority:item.priority||'Medium',recommendation:item.action||'',
 status:'Open',owner:'',dueDate:'',note:'',createdAt:now,updatedAt:now,completedAt:'',
 firstRecordId:record.id,lastRecordId:record.id,lastAssessmentAt:record.createdAt,flagged:true
 };}
/** Sync latest assessment into actions; never overwrite owner, due date, notes or manual status.
    Unresolved gaps remain even when a later assessment no longer flags them, until manually closed.
    A previously Completed item that is found again in a newer assessment is reopened. */
async function syncRecord(record){
 if(!record?.business||!record?.result||!Array.isArray(record.result.actions)||!record.id||!record.createdAt)throw new Error('Invalid audit assessment to link');
 const key=siteKey(record.business), data={...record,siteKey:key};let created=0,reopened=0,cleared=0;
 await operate([ACTIONS,EVENTS],'readwrite',tx=>{
  const act=tx.objectStore(ACTIONS), ev=tx.objectStore(EVENTS);
  const cursor=act.openCursor();cursor.onsuccess=()=>{
   const c=cursor.result;if(!c){
    // All existing site rows have been processed by the cursor.
    const pending=record.result.actions||[];
    for(const item of pending){const id=actionId(key,item.q.id);if(seen.has(id))continue;const a=makeNew(data,item);act.add(a);ev.add(eventFor(id,'created',`Created from assessment ${record.business.date||record.createdAt.slice(0,10)} (${record.id}).`));created++;}
    return;
   }
   const a=c.value;
   if(a.siteKey===key && (!a.lastAssessmentAt || a.lastAssessmentAt<record.createdAt)){
    seen.add(a.id);
    const active=(record.result.actions||[]).find(x=>x.q.id===a.questionId);
    a.lastAssessmentAt=record.createdAt;
    a.lastRecordId=record.id;
    if(active){
      a.business=record.business.name||a.business;a.site=record.business.site||a.site;
      a.question=active.q.text;a.section=active.q.section||'';a.priority=active.priority||a.priority;a.recommendation=active.action||a.recommendation;
      if(!a.flagged)ev.add(eventFor(a.id,'gap-returned','This gap was flagged again in a later assessment.'));
      a.flagged=true;
      if(a.status==='Completed'){
       a.status='Open';a.completedAt='';a.updatedAt=new Date().toISOString();reopened++;
       ev.add(eventFor(a.id,'reopened','Reopened automatically: latest assessment flags the gap again.'));
      }
    }else if(a.flagged){a.flagged=false;cleared++;ev.add(eventFor(a.id,'assessment-improved','Latest assessment no longer flags this item. Completion still requires an explicit owner review.'));}
    c.update(a);
   }else if(a.siteKey===key)seen.add(a.id);
   c.continue();
  };
  // Transaction request callbacks share this mutable set; populated as cursor walks
  const seen=new Set();
  cursor.onerror=()=>tx.abort();
 });
 return {created,reopened,cleared};
}
async function reconcile(records){let count=0;for(const record of records.slice().sort((a,b)=>a.createdAt.localeCompare(b.createdAt))){await syncRecord(record);count++;}return count;}
async function update(id,updates){
 if(!id || typeof id!=='string')throw new Error('Invalid action ID');
 const val={};
 if('status' in updates){if(!STATUS.includes(updates.status))throw new Error('Invalid action status');val.status=updates.status;}
 if('owner' in updates)val.owner=String(updates.owner??'').trim().slice(0,120);
 if('dueDate' in updates){const due=String(updates.dueDate??'');if(due && checkedDate(due)!==due)throw new Error('Invalid due date');val.dueDate=due;}
 if('note' in updates)val.note=String(updates.note??'').trim().slice(0,1000);
 let changed=false;
 await operate([ACTIONS,EVENTS],'readwrite',tx=>{
  const act=tx.objectStore(ACTIONS),ev=tx.objectStore(EVENTS),req=act.get(id);
  req.onsuccess=()=>{
   const row=req.result;if(!row){tx.abort();return;}
   const before={...row},parts=[];
   for(const [key,value] of Object.entries(val))if(row[key]!==value){row[key]=value;parts.push(`${key}: ${key==='note'?`progress note updated: ${value||'(cleared)'}`:`${String(before[key]||'(empty)')} -> ${value||'(empty)'}`}`);}
   if(!parts.length)return;
   changed=true;row.updatedAt=new Date().toISOString();
   if(row.status==='Completed'&&before.status!=='Completed')row.completedAt=row.updatedAt;
   if(row.status!=='Completed'&&before.status==='Completed')row.completedAt='';
   act.put(row);ev.add(eventFor(id,'updated',parts.join('; ')));
  };
  req.onerror=()=>tx.abort();
 });
 return changed;
}
function validateImport(rows,history){
 if(!Array.isArray(rows)||rows.length>20000||!Array.isArray(history)||history.length>100000)throw new Error('Action archive is invalid or too large');
 for(const x of rows){if(!x||typeof x.id!=='string'||x.id.length>512||typeof x.siteKey!=='string'||typeof x.questionId!=='string'||!STATUS.includes(x.status)||typeof x.updatedAt!=='string'||!x.question)throw new Error('Invalid action in archive');}
 for(const e of history){if(!e||typeof e.id!=='string'||typeof e.actionId!=='string'||typeof e.at!=='string'||typeof e.detail!=='string')throw new Error('Invalid history entry in archive');}
}
async function merge(rows,history){validateImport(rows,history);let actionsAdded=0,eventsAdded=0;
 await operate([ACTIONS,EVENTS],'readwrite',tx=>{
  const a=tx.objectStore(ACTIONS),e=tx.objectStore(EVENTS);
  for(const row of rows){const req=a.get(row.id);req.onsuccess=()=>{if(!req.result){a.add(row);actionsAdded++;}};req.onerror=()=>tx.abort();}
  for(const row of history){const req=e.get(row.id);req.onsuccess=()=>{if(!req.result){e.add(row);eventsAdded++;}};req.onerror=()=>tx.abort();}
 });return {actionsAdded,eventsAdded};}
const api={siteKey,actionId,makeNew,overdue,stats,syncRecord,reconcile,update,list,events,merge,STATUS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.ActionStore=api;
})(typeof window!=='undefined'?window:globalThis);
