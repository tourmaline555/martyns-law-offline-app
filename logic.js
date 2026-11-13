/* Readiness score follows the user's scoring matrix (not a statutory compliance scoring system). */
(function(root){
'use strict';
const SPECIAL_USES = new Set(['worship','childcare','school','further']);
const SCORE = {yes:2,partly:1,no:0,not_sure:0};
const PRIORITY = {Immediate:0,High:1,Medium:2,Low:3,Maintain:4};
function countNumber(v){if(v === null || v === '' || v === undefined) return null; const n=Number(v);return Number.isSafeInteger(n) && n>=0 ? n : null;}
function computeScope(b){
  const peak=countNumber(b.peak), eventPeak=countNumber(b.eventPeak);
  const knownUse= !!b.activity && b.activity !== 'unknown';
  const special=SPECIAL_USES.has(b.activity);
  let premises='Review required';
  if(b.building==='no' || b.activity==='none' || b.excluded==='yes' || (peak!==null && peak<200)) premises='Not qualifying on stated information';
  else if(b.building==='yes' && knownUse && b.excluded==='no' && peak!==null){
    premises=peak>=800 && !special ? 'Enhanced tier' : 'Standard tier';
  }
  let event='No events indicated';
  if(b.events==='yes'){
    if(special || b.eventExcluded==='yes') event='Not a qualifying event on stated information';
    else if(premises==='Enhanced tier') event='At enhanced-tier premises (no separate event classification)';
    else if(eventPeak!==null && eventPeak<800) event='Not a qualifying event on stated information';
    else if(b.publicAccess==='no' || b.entryChecks==='no') event='Not a qualifying event on stated information';
    else if(eventPeak!==null && eventPeak>=800 && b.publicAccess==='yes' && b.entryChecks==='yes' && b.eventExcluded==='no' && premises!=='Review required') event='Potential qualifying event (enhanced duties)';
    else event='Review required';
  } else if(b.events!=='no') event='Review required';
  return {premises,event,special,peak,eventPeak,scopeUnknown:premises==='Review required'||event==='Review required'};
}
function activeQuestions(questions,b){return questions.filter(q=>q.section!=='Scope' && (q.section!=='Events'||b.events==='yes') && (q.id!=='Q38'||b.shared!=='no'));}
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
  const score = max ? Math.round(10000*earned/max)/100 : null;
  let rag=score===null?'Unrated':score>=75?'Green':score>=50?'Amber':'Red';
  if(rag==='Green' && (critical.length>0||unanswered>0)) rag='Amber';
  actions.sort((a,b)=>(PRIORITY[a.priority]??5)-(PRIORITY[b.priority]??5) || (Number(b.q.weight)||0)-(Number(a.q.weight)||0) || a.q.id.localeCompare(b.q.id,undefined,{numeric:true}));
  return {score,rag,earned,max,answered,unanswered,na,total:active.length,critical,actions,rows,sections:Object.values(sections),scope:computeScope(b),provisional:unanswered>0};
}
function defaultState(){return {version:1,screen:'welcome',index:0,business:{name:'',site:'',assessor:'',date:new Date().toISOString().slice(0,10),activity:'',building:'',excluded:'',peak:'',events:'',eventPeak:'',publicAccess:'',entryChecks:'',eventExcluded:'',accessGeneral:'',shared:''},answers:{},notes:{}};}
const api={computeScope,activeQuestions,summarize,defaultState};
if(typeof module!=='undefined' && module.exports) module.exports=api;
root.ReadinessLogic=api;
})(typeof window!=='undefined'?window:globalThis);
