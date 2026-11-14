/* Premivue v4 - deterministic archive validation, comparability and date handling.
   Imported self-assessments can be recalculated, but no local file is cryptographically attested. */
(function(root){
'use strict';
const METHOD='premivue-2026-v40-complete-coverage',PREVIOUS='premivue-2026-v39-coverage-and-tier';
const ANSWERS=new Set(['yes','partly','no','not_sure','na']);
const STATUS=new Set(['Open','In progress','On hold','Completed']);
const FIELDS=['status','owner','dueDate','note','completedAt','flagged','priority','recommendation','question','lastRecordId','lastAssessmentAt','lastAssessmentDate'];
const numeric=v=>typeof v==='number'&&Number.isFinite(v);
const iso=t=>typeof t==='string'&&Number.isFinite(Date.parse(t))&&t.length<=35;
const day=t=>{if(typeof t!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t))return false;const date=new Date(t+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===t;};
const dateOf=r=>day(r?.business?.date)?r.business.date:iso(r?.createdAt)?r.createdAt.slice(0,10):'';
const chronological=(a,b)=>dateOf(a).localeCompare(dateOf(b))||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id).localeCompare(String(b.id));
const importedTrust=r=>r.importValidation||((r.appVersion==='4.0'||r.appVersion==='3.9')?'local':'legacy');
const verified=r=>['verified','local'].includes(importedTrust(r));
function compareVersions(a,b){const x=a?.result||a,y=b?.result||b;
 const methodA=a?.scoringVersion||x?.scoringVersion||'legacy',methodB=b?.scoringVersion||y?.scoringVersion||'legacy';
 const ids=z=>(z?.scoredQuestionIds||z?.rows?.filter(q=>['yes','partly','no','not_sure'].includes(q.answer)).map(q=>q.q.id)||[]).slice().sort().join(',');
 return verified(a)&&verified(b)&&methodA===methodB&&ids(x)===ids(y)&&numeric(x.score)&&numeric(y.score)&&!x.provisional&&!y.provisional;
}
function validateRecord(r,questions,logic){
 if(!r||r.format!=='ml-record-v2'||typeof r.id!=='string'||!r.id||r.id.length>128||!iso(r.createdAt)||!r.business||!r.answers||!r.result||!Array.isArray(r.result.rows)||!Array.isArray(r.result.actions)||typeof r.siteKey!=='string'||r.siteKey.length>500)throw Error('Invalid assessment record structure');
 if(!day(r.business.date)||typeof r.business.name!=='string'||!r.business.name.trim())throw Error(`Invalid date or venue for assessment ${r.id}`);
 const known=new Set(questions.map(q=>q.id));for(const [key,val] of Object.entries(r.answers))if(known.has(key)&&!ANSWERS.has(val))throw Error(`Invalid response in ${r.id}: ${key}`);
 const version=r.scoringVersion||r.result.scoringVersion;
 // Older questionnaires must remain visible but cannot be represented as verified by the current matrix.
 if(version!==METHOD&&version!==PREVIOUS)return {...r,importValidation:'legacy',importValidationNote:'Legacy method - score not independently verified against the current question matrix',importedAt:new Date().toISOString()};
 const actual=logic.summarize(questions,r.business,r.answers,r.notes||{});
 const prior=r.result;
 const same=(p,q)=>p===q||(p===null&&q===null);
 const criticalEqual=(prior.critical||[]).map(q=>q.id).sort().join(',')===(actual.critical||[]).map(q=>q.id).sort().join(',');
 const keyEqual=['score','rag','answered','unanswered','total','earned','max','na'].every(k=>same(prior[k],actual[k]));
 const actionsEqual=(prior.actions||[]).map(a=>`${a.q?.id}:${a.answer}:${a.priority}`).sort().join(',')===(actual.actions||[]).map(a=>`${a.q?.id}:${a.answer}:${a.priority}`).sort().join(',');
 const idsEqual=(prior.scoredQuestionIds||[]).slice().sort().join(',')===(actual.scoredQuestionIds||[]).slice().sort().join(',');
 if(version===PREVIOUS&&prior.unanswered>0&&prior.earned===actual.earned&&prior.max===actual.max&&prior.answered===actual.answered&&prior.total===actual.total&&prior.na===actual.na&&criticalEqual&&actionsEqual&&idsEqual){
   return {...r,importValidation:'legacy',importValidationNote:'Earlier incomplete assessment used a provisional percentage. Retained as historical, excluded from verified comparisons.',importedAt:new Date().toISOString()};
 }
 if(!keyEqual||!criticalEqual||!actionsEqual||!idsEqual||prior.provisional!==actual.provisional)throw Error(`Assessment ${r.id} has a stored rating or actions that do not agree with its answers; import stopped`);
 return {...r,importValidation:'verified',importValidationNote:'Recalculated against the matching Premivue questionnaire; not independently audited',importedAt:new Date().toISOString()};
}
function validateBundle(body,questions,logic){
 if(!body||!['ml-readiness-archive-v2','ml-readiness-archive-v3','ml-readiness-archive-v4'].includes(body.format)||!Array.isArray(body.records)||body.records.length>10000)throw Error('Unsupported or oversized archive');
 const records=body.records.map(r=>validateRecord(r,questions,logic));
 const ids=new Set();for(const r of records){if(ids.has(r.id))throw Error('Duplicate record identifier within archive');ids.add(r.id);}
 const actions=body.actions||[],events=body.actionEvents||[];
 if(!Array.isArray(actions)||actions.length>20000||!Array.isArray(events)||events.length>100000)throw Error('Invalid or oversized action data');
 const aIds=new Set(),eIds=new Set();
 for(const a of actions){if(!a||typeof a.id!=='string'||!a.id||a.id.length>512||typeof a.siteKey!=='string'||typeof a.questionId!=='string'||!STATUS.has(a.status)||!iso(a.updatedAt)||typeof a.question!=='string'||typeof a.owner!=='string'&&a.owner!==undefined)throw Error('Invalid action data');if(aIds.has(a.id))throw Error('Duplicate action in archive');aIds.add(a.id);}
 for(const e of events){if(!e||typeof e.id!=='string'||!e.id||typeof e.actionId!=='string'||!iso(e.at)||typeof e.detail!=='string')throw Error('Invalid action history');if(eIds.has(e.id))throw Error('Duplicate action event in archive');eIds.add(e.id);}
 return {records,actions,events};
}
function actionDiff(a,b){return FIELDS.some(k=>(a?.[k]||'')!==(b?.[k]||''));}
function planMerge(local,remote){const localMap=new Map(local.map(a=>[a.id,a]));const differences=[];
 for(const incoming of remote){const existing=localMap.get(incoming.id);if(!existing||!actionDiff(existing,incoming))continue;
 const cmp=incoming.updatedAt>existing.updatedAt?'incoming newer':incoming.updatedAt<existing.updatedAt?'local newer':'same revision, divergent fields';
 differences.push({id:incoming.id,site:incoming.business||existing.business,questionId:incoming.questionId,existing,incoming,kind:cmp});
 }return differences;
}
function stateAt(action,history,when){
 if(!action)return null;
 const whenTime=day(when)?when+'T23:59:59.999Z':when;
 const log=(history||[]).filter(e=>e.actionId===action.id&&iso(e.at)&&e.at<=whenTime).sort((a,b)=>a.at.localeCompare(b.at));
 if(iso(action.createdAt)&&action.createdAt>whenTime)return {status:'Not yet raised',evidence:'created later'};
 // Modern structured events are used as the historical source of truth.
 const create=log.find(e=>e.type==='created');
 let status=create?.after?.status||'Open';let seen=!!create;
 for(const e of log){if(e.after&&STATUS.has(e.after.status)){status=e.after.status;seen=true;}
   else if(e.type==='reopened'){status='Open';seen=true;}
   else if(e.type==='updated'){
     const match=String(e.detail).match(/status:\s*(?:\S[\s\S]*?)\s*->\s*(Open|In progress|On hold|Completed)/);
     if(match){status=match[1];seen=true;}
   }
 }
 if(action.status==='Completed'&&iso(action.completedAt)&&action.completedAt<=whenTime&&!log.some(e=>e.type==='reopened'&&e.at>action.completedAt))return {status:'Completed',evidence:'dated completion'};
 if(iso(action.updatedAt)&&action.updatedAt<=whenTime&&action.status!=='Completed'&&!log.some(e=>e.type==='reopened'&&e.at>action.updatedAt))return {status:action.status,evidence:'last known dated action update'};
 if(seen)return {status,evidence:'dated action history'};
 if(action.status==='Completed'&&iso(action.completedAt)&&action.completedAt<=whenTime)return {status:'Completed',evidence:'dated completion'};
 if(action.status==='Completed'&&iso(action.completedAt)&&action.completedAt>whenTime)return {status:'Not completed at assessment date',evidence:'completed later'};
 if(iso(action.createdAt)&&action.createdAt<=whenTime&&action.status!=='Completed'&&iso(action.updatedAt)&&action.updatedAt<=whenTime)return {status:action.status,evidence:'action last updated before assessment'};
 return {status:'Historical status unverified',evidence:'legacy action log lacks sufficient detail'};
}
const api={METHOD,PREVIOUS,day,dateOf,chronological,verified,compareVersions,validateRecord,validateBundle,actionDiff,planMerge,stateAt};
root.PremivueIntegrity=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
