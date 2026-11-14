/* Readiness score follows the user's scoring matrix (not a statutory compliance scoring system). */
(function(root){
'use strict';
const SPECIAL_USES = new Set(['worship','childcare','school','further']);
const SCORE = {yes:2,partly:1,no:0,not_sure:0};
const PRIORITY = {Immediate:0,High:1,Medium:2,Low:3,Maintain:4};
function countNumber(v){if(v === null || v === '' || v === undefined) return null; const n=Number(v);return Number.isSafeInteger(n) && n>=0 ? n : null;}
function computeScope(b){
  // Preliminary scope screening, not a statutory legal determination. Chapters 4-5,
  // Home Office statutory guidance (25 August 2026). Keep unknowns visible.
  const peak=countNumber(b.peak), eventPeak=countNumber(b.eventPeak);
  const special=SPECIAL_USES.has(b.activity);
  const knownUse=!!b.activity && b.activity!=='unknown';
  const eventLocation=b.eventLocation || 'legacy_at_site'; // Old saved records assumed same-site events.
  let premises='Review required';
  const reasons=[];
  if(b.building==='no'||b.activity==='none'||b.excluded==='yes'||(peak!==null&&peak<200)) premises='Not qualifying on stated information';
  else if(b.building==='yes' && knownUse && b.excluded==='no' && peak!==null){
    premises=peak>=800&&!special?'Enhanced tier':'Standard tier';
  } else reasons.push('Confirm Schedule 1 use, publicly accessible building, exclusions and reasonable peak attendance.');
  if(peak===null || !(b.peakMethod||'').trim()) reasons.push('Record the expected peak and how the estimate was reached.');
  if(!b.reviewDate)reasons.push('Set a date for the next review.');
  let event='No events indicated';
  const atSite=eventLocation==='at_site'||eventLocation==='legacy_at_site';
  if(b.events==='yes'||b.events==='unknown'){
    if(b.events==='unknown') {event='Review required';reasons.push('Confirm whether events or out-of-hours activities take place.');}
    else if(eventLocation==='separate') {event='Separate location - assess independently';reasons.push('A separate location needs its own premises/event scope screen.');}
    else if(eventLocation==='both') {event='Review required - events at multiple locations';reasons.push('Assess events at this premises and separate locations independently.');}
    else if(!atSite) {event='Review required';reasons.push('Identify where events take place before classifying their scope.');}
    else if(special || b.eventExcluded==='yes') event='Not a qualifying event on stated information';
    else if(premises==='Enhanced tier') event='At enhanced-tier premises (no separate event classification)';
    else if(eventPeak!==null&&eventPeak<800) event='Not a qualifying event on stated information';
    else if(b.publicAccess==='no'||b.entryChecks==='no') event='Not a qualifying event on stated information';
    else if(eventPeak!==null&&eventPeak>=800&&b.publicAccess==='yes'&&b.entryChecks==='yes'&&b.eventExcluded==='no') {
      event='Potential qualifying event (enhanced duties)';
      reasons.push('A qualifying event at otherwise standard-tier premises can instead lead to enhanced-tier classification: review sections 2 and 3 for the circumstances.');
    }
    else {event='Review required';reasons.push('Confirm event peak attendance, public accessibility, qualifying entry-condition checks and exclusions.');}
  } else if(b.events!=='no') {event='Review required';reasons.push('Confirm whether events take place.');}
  if(b.shared==='unknown'||(['yes','unknown'].includes(b.shared)&&(!b.otherResponsible||b.otherResponsible==='unknown'))) reasons.push('Clarify who controls the premises/event and whether responsible persons must coordinate.');
  if(['yes','unknown'].includes(b.events)&&!b.accessGeneral)reasons.push('Record how event or out-of-hours access is controlled (distinct from statutory entry-condition checks).');
  if(b.shared==='yes' && b.otherResponsible==='no') reasons.push('Shared use does not necessarily mean several responsible persons; clarify control.');
  return {premises,event,special,peak,eventPeak,eventLocation,scopeUnknown:premises==='Review required'||event.startsWith('Review required'),reasons};
}
function activeQuestions(questions,b){return questions.filter(q=>q.section!=='Scope' && (q.section!=='Events'||b.events==='yes'||b.events==='unknown') && (q.id!=='Q38'||b.shared!=='no'));}
function summarize(questions,b,answers){
  const active=activeQuestions(questions,b), sections={};
  let max=0,earned=0,answered=0,na=0,unanswered=0;
  const critical=[]; const actions=[]; const rows=[];
  for(const q of active){
    if(!sections[q.section])sections[q.section]={name:q.section,earned:0,max:0,answered:0,unanswered:0,na:0};
    const sec=sections[q.section], answer=answers[q.id];
    if(answer==='na') {if(q.critical==='Y'){unanswered++;sec.unanswered++;rows.push({q,answer:''});}else{na++;sec.na++;rows.push({q,answer});}continue;}
    if(!(answer in SCORE)){unanswered++;sec.unanswered++;rows.push({q,answer:''});continue;}
    const w=Number(q.weight)||1;
    earned += SCORE[answer]*w;max+=2*w;answered++;
    sec.earned+=SCORE[answer]*w;sec.max+=2*w;sec.answered++;
    const triggered=q.critical==='Y' && (answer==='no'||answer==='not_sure');
    if(triggered) critical.push(q);
    if(answer==='no'||answer==='not_sure'||answer==='partly'){
      const negative=answer!=='partly';
      actions.push({q,answer,priority:negative?q.priorityNo:q.priorityPartly,action:negative?q.actionNo:q.actionPartly,finding:negative?q.findingNo:q.findingPartly,critical:triggered});
    }
    rows.push({q,answer});
  }
  const scope=computeScope(b);
  // Tailor the existing recommendation text to the legal duty tier without changing
  // scoring, priorities or which gaps produce actions. These texts are snapshot on save.
  const basis=root.ReadinessBasis;
  if(basis?.recommendation)for(const a of actions){a.action=basis.recommendation(a.q.id,a.answer,scope,b,a.action);}
  const score = max ? Math.round(10000*earned/max)/100 : null;
  let rag=score===null?'Unrated':score>=75?'Green':score>=50?'Amber':'Red';
  if(rag==='Green' && (critical.length>0||unanswered>0)) rag='Amber';
  actions.sort((a,b)=>(PRIORITY[a.priority]??5)-(PRIORITY[b.priority]??5) || (Number(b.q.weight)||0)-(Number(a.q.weight)||0) || a.q.id.localeCompare(b.q.id,undefined,{numeric:true}));
  return {score,rag,earned,max,answered,unanswered,na,total:active.length,critical,actions,rows,sections:Object.values(sections),scope,provisional:unanswered>0};
}
function defaultState(){return {version:1,screen:'welcome',index:0,business:{name:'',site:'',assessor:'',date:new Date().toISOString().slice(0,10),activity:'',building:'',excluded:'',peak:'',events:'',eventPeak:'',publicAccess:'',entryChecks:'',eventExcluded:'',accessGeneral:'',shared:'',peakMethod:'',eventLocation:'',otherResponsible:'',reviewDate:''},answers:{},notes:{}};}
const api={computeScope,activeQuestions,summarize,defaultState};
if(typeof module!=='undefined' && module.exports) module.exports=api;
root.ReadinessLogic=api;
})(typeof window!=='undefined'?window:globalThis);
