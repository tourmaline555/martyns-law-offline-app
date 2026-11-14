/* Readiness score follows the user's scoring matrix (not a statutory compliance scoring system). */
(function(root){
'use strict';
const SPECIAL_USES = new Set(['worship','childcare','school','further']);
const SCORE = {yes:2,partly:1,no:0,not_sure:0};
const PRIORITY = {Immediate:0,High:1,Medium:2,Low:3,Maintain:4};
// Only these advisory checks can reasonably be inapplicable without removing a statutory-linked control.
// The assessor must still give a meaningful reason; routing makes other irrelevant items disappear.
const NA_ALLOWED = new Set(['Q22','Q23','Q37']);
const METHODOLOGY='premivue-2026-v39-coverage-and-tier';
function isEnhanced(scope){return scope.premises==='Enhanced tier'||scope.event==='Potential qualifying event (enhanced duties)';}
function isScoredCritical(q,scope){return q.critical==='Y' && q.id!=='Q35';}
function relevantNa(q,b,notes){return NA_ALLOWED.has(q.id)&&typeof notes?.[q.id]==='string'&&notes[q.id].trim().length>=15;}
function scoredIds(rows){return rows.filter(r=>['yes','partly','no','not_sure'].includes(r.answer)).map(r=>r.q.id).sort();}

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
  const listedUse=knownUse && b.activity!=='none';
  const potentiallyInScope=listedUse && peak!==null && peak>=200;
  // A high-attendance Schedule 1 venue can be open to paying, ticket-holding or club-member
  // visitors. A mistaken 'No' to public access should never become a confident exclusion.
  if(potentiallyInScope && b.building==='no'){
    premises='Review required - conflicting scope answers';
    reasons.push('You entered a Schedule 1 premises use and '+peak+' people, but selected No for a publicly accessible building. Check whether the building admits paying customers, ticket-holders, guests or club members: access restrictions do not necessarily make it private. If there really is no publicly accessible building, document why and assess events separately.');
  } else if(potentiallyInScope && b.excluded==='yes'){
    premises='Review required - claimed statutory exclusion';
    reasons.push('The venue has '+peak+' people and a listed use, but a Schedule 2 exclusion was selected. Identify and verify the specific statutory exclusion before concluding that the premises are outside the Act.');
  } else if(peak!==null&&peak<200){
    premises='Not qualifying on stated information';
  } else if(b.building==='no'||b.activity==='none'||b.excluded==='yes'){
    premises='Not qualifying on stated information';
    if(b.excluded==='yes')reasons.push('Confirm which Schedule 2 exclusion applies and retain the rationale.');
  } else if(b.building==='yes' && listedUse && b.excluded==='no' && peak!==null){
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
  return {premises,event,special,peak,eventPeak,eventLocation,scopeUnknown:premises.startsWith('Review required')||event.startsWith('Review required'),reasons};
}
function activeQuestions(questions,b){
  // Only events at the assessed premises contribute to this premises assessment.
  // Unknown/mixed locations must be clarified or assessed separately rather than inflating this site's readiness.
  const siteEvents=(b.events==='yes'||b.events==='unknown')&&(b.eventLocation==='at_site'||(!b.eventLocation&&!b.siteId));
  return questions.filter(q=>q.section!=='Scope' && (q.section!=='Events'||siteEvents) && (q.id!=='Q38'||b.shared!=='no'));
}
function summarize(questions,b,answers,notes={}){
  const active=activeQuestions(questions,b),scope=computeScope(b),sections={};
  let max=0,earned=0,answered=0,na=0,unanswered=0;
  const critical=[],criticalPartly=[],actions=[],rows=[],invalidNa=[];
  for(const q of active){
    if(!sections[q.section])sections[q.section]={name:q.section,earned:0,max:0,answered:0,unanswered:0,na:0};
    const sec=sections[q.section],answer=answers[q.id],criticalHere=isScoredCritical(q,scope);
    if(answer==='na'){
      if(relevantNa(q,b,notes)){na++;sec.na++;rows.push({q,answer});}
      else{unanswered++;sec.unanswered++;invalidNa.push(q.id);rows.push({q,answer:'',invalidNa:true});}
      continue;
    }
    if(!(answer in SCORE)){unanswered++;sec.unanswered++;rows.push({q,answer:''});continue;}
    const w=Number(q.weight)||1;
    earned+=SCORE[answer]*w;max+=2*w;answered++;
    sec.earned+=SCORE[answer]*w;sec.max+=2*w;sec.answered++;
    const triggered=criticalHere && ['no','not_sure'].includes(answer);
    if(triggered)critical.push(q);
    if(criticalHere&&answer==='partly')criticalPartly.push(q);
    if(['no','not_sure','partly'].includes(answer)){
      const negative=answer!=='partly', unknown=answer==='not_sure';
      let priority=negative?q.priorityNo:q.priorityPartly;
      // A named senior individual under section 10 is not a universal standard-tier duty.
      if(q.id==='Q35')priority=negative?'High':'Medium';
      actions.push({q,answer,priority,action:negative?q.actionNo:q.actionPartly,
        finding:unknown?`Not verified: the assessor could not confirm the answer to: ${q.text}`:negative?q.findingNo:q.findingPartly,
        critical:triggered||criticalHere&&answer==='partly'});
    }
    rows.push({q,answer});
  }
  const basis=root.ReadinessBasis;
  for(const a of actions){
    if(basis?.recommendation)a.action=basis.recommendation(a.q.id,a.answer,scope,b,a.action);
    if(a.answer==='not_sure')a.action='VERIFY FIRST: seek confirmation from the person responsible and review the relevant arrangements. If the safeguard is missing, '+(a.action||'agree a proportionate improvement');
  }
  const rawScore=max?Math.round(10000*earned/max)/100:null;
  const coverage=active.length?Math.round((answered+na)/active.length*10000)/100:0;
  // Do not display a deceptively perfect score from a very small number of answered questions.
  const score=coverage<80?null:rawScore;
  let rag=score===null?'Unrated':score>=75?'Green':score>=50?'Amber':'Red';
  const lowSections=Object.values(sections).filter(x=>x.answered>=2&&x.max>0&&x.earned/x.max<.25).map(x=>x.name);
  const ragReasons=[];
  if(coverage<80)ragReasons.push('Insufficient coverage to rate: '+coverage+'% of applicable questions have valid answers (minimum 80% for a provisional score).');
  if(rag==='Green'){
    if(critical.length)ragReasons.push('Critical procedure answered No / Not sure: '+critical.map(q=>q.id).join(', '));
    if(criticalPartly.length)ragReasons.push('Critical procedure partly in place: '+criticalPartly.map(q=>q.id).join(', '));
    if(unanswered)ragReasons.push('Unanswered / invalid N/A questions: '+unanswered);
    if(lowSections.length)ragReasons.push('Severe section gap (below 25%): '+lowSections.join(', '));
    if(ragReasons.length)rag='Amber';
  }
  actions.sort((a,b)=>(PRIORITY[a.priority]??5)-(PRIORITY[b.priority]??5)||(Number(b.q.weight)||0)-(Number(a.q.weight)||0)||a.q.id.localeCompare(b.q.id,undefined,{numeric:true}));
  const questionBank=questions.filter(q=>q.section!=='Scope').length;
  const answerConflicts=[];
  if(answers.Q5==='yes')for(const id of ['Q6','Q8','Q10','Q11','Q12'])if(['partly','no','not_sure'].includes(answers[id]))answerConflicts.push({ids:['Q5',id],message:`Q5 says all four protective procedures are in place, but ${id} is ${answers[id].replace('_',' ')}. Check what is missing and whether Q5 remains Yes.`});
  if(answers.Q8==='partly'&&answers.Q11==='yes')answerConflicts.push({ids:['Q8','Q11'],message:'Q11 indicates entry/exit control, but Q8 indicates lockdown may be slow. Confirm the difference between having barriers and activating the procedure safely.'});
  if(answers.Q17==='yes'&&['no','not_sure'].includes(answers.Q32))answerConflicts.push({ids:['Q17','Q32'],message:'Q17 reports recent drills, while Q32 does not confirm procedure effectiveness. Clarify which procedures the drills tested.'});
  if(answers.Q16==='yes'&&['no','not_sure'].includes(answers.Q26))answerConflicts.push({ids:['Q16','Q26'],message:'Q16 reports staff know whom to contact, while Q26 reports no simple reporting route. Clarify the distinction.'});
  if(scope.premises.startsWith('Review required'))answerConflicts.push({ids:[],message:'Legal scope is unresolved. Review the premises use, public access and attendance answers.'});
  const answerChecks=answerConflicts.map(x=>x.message);
  const dutyProcedureGaps=rows.filter(r=>['Q5','Q6','Q8','Q10','Q11','Q12'].includes(r.q.id)&&r.answer!=='yes').map(r=>r.q.id);
  return {score,rawScore,rag,earned,max,answered,unanswered,na,coverage,invalidNa,dutyProcedureGaps,total:active.length,questionBank,skippedByRouting:questionBank-active.length,
    critical,criticalPartly,lowSections,ragReasons,answerChecks,answerConflicts,actions,rows,sections:Object.values(sections),scope,provisional:unanswered>0||!answered,
    scoredQuestionIds:scoredIds(rows),scoringVersion:METHODOLOGY};
}

function defaultState(){return {version:1,screen:'welcome',index:0,business:{name:'',site:'',assessor:'',date:new Date().toISOString().slice(0,10),activity:'',building:'',excluded:'',peak:'',events:'',eventPeak:'',publicAccess:'',entryChecks:'',eventExcluded:'',accessGeneral:'',shared:'',peakMethod:'',eventLocation:'',otherResponsible:'',reviewDate:'',siteId:'',siteKeyId:''},answers:{},notes:{}};}
const api={computeScope,activeQuestions,summarize,defaultState,relevantNa,isScoredCritical,NA_ALLOWED,METHODOLOGY};
if(typeof module!=='undefined' && module.exports) module.exports=api;
root.ReadinessLogic=api;
})(typeof window!=='undefined'?window:globalThis);
