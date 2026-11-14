/* Legal-basis prompts for the 38 readiness checks. Based on the workbook's Framework Position field;
   refined to avoid treating recommended methods as independent statutory obligations.
   This is a screening aid, not legal advice, a compliance determination or an official SIA assessment. */
(function(root){
'use strict';
const CORE=new Set(['Q5','Q6','Q8','Q10','Q11','Q12','Q35','Q38']);
const SUPPORT=new Set(['Q7','Q9','Q14','Q16','Q17','Q18','Q21','Q24','Q25','Q27','Q28','Q30','Q31','Q32','Q39','Q41','Q42']);
const GOOD=new Set(['Q13','Q15','Q19','Q20','Q22','Q23','Q26','Q29','Q33','Q34','Q36','Q37','Q40']);
const SPEC={
 Q5:['Section 5; guidance 7.4 and 7.32','The legal duty is to have appropriate public protection procedures in place, so far as reasonably practicable. Standard-tier premises do not have an express duty to document those procedures; documentation is recommended.'],
 Q6:['Section 5(3)(a); guidance 7.33-7.36','Evacuation is one of the statutory procedure types. The appropriate response depends on the incident; immediate evacuation is not always safest.'],
 Q8:['Section 5(3)(c); guidance 7.43-7.45','Lockdown arrangements are part of the statutory procedures duty, where appropriate and reasonably practicable.'],
 Q10:['Section 5(3)(b); guidance 7.37-7.42','Invacuation is one of the statutory procedure types. Suitable internal options depend on the site and threat.'],
 Q11:['Section 5(3)(c); guidance 7.43-7.45','Lockdown may include controlling entry and exit where it is safe and appropriate; this is not an automatic instruction to lock people in.'],
 Q12:['Section 5(3)(d); guidance 7.46-7.49','Communication procedures should provide warnings and appropriate instructions to people present, including staff and the public where safe.'],
 Q35:['Section 10 (enhanced tier and qualifying events); guidance chapter 8','An enhanced-tier organisation or qualifying-event organisation must designate a senior individual with compliance responsibility. A separately named security lead is not a universal standard-tier duty.'],
 Q38:['Section 8; guidance chapter 7','Where there is more than one responsible person, co-ordination is required so far as reasonably practicable. The exact position depends on control and responsibility.'],
 Q24:['Section 6; guidance chapter 8','Enhanced-tier premises and qualifying events must have appropriate, reasonably practicable protective measures. The Act does not mandate every listed physical device.'],
 Q25:['Section 6; guidance chapter 8','Enhanced-tier protective measures must be appropriate and kept under review. Recording particular vulnerability checks is a means of supporting this duty, not a universal standalone check.'],
 Q31:['Section 7; guidance chapter 8 and paragraph 7.32','Enhanced-tier premises and qualifying events must prepare the required document. For standard-tier premises, written documentation is recommended but not expressly required by section 7.'],
 Q7:['Guidance 7.33-7.36','A fixed roll-call or accounting procedure is not required in every case. Accountability must never delay safe movement away from danger.'],
 Q14:['Guidance 7.51-7.62','The Act does not prescribe a particular training course or a blanket 12-month training interval. Staff responsible for procedures must be adequately informed and competent to carry them out.'],
 Q17:['Guidance 7.28-7.29','Testing and practicing procedures are recommended, but the Act does not prescribe an annual drill for every venue.'],
 Q19:['Guidance chapter 4 and chapter 7','A reasonable estimate of the number of people present is relevant to scope. Keeping a live identifiable list of every person is not an express universal requirement.'],
 Q33:['Guidance 7.29-7.32','Record keeping is useful to demonstrate preparedness. Standard-tier premises are not subject to the enhanced-tier section 7 documentation requirement.']
};
function classify(id,scope={},business={}){
 const enhanced=scope.premises==='Enhanced tier'||scope.event==='Potential qualifying event (enhanced duties)';
 const inScope=enhanced||scope.premises==='Standard tier';
 const standard=scope.premises==='Standard tier'&&!enhanced;
 const core=CORE.has(id),support=SUPPORT.has(id),good=GOOD.has(id);
 if(!core&&!support&&!good)return {kind:'scope',label:'Scope screen',reference:'Chapters 4-5',detail:'This identifies potential applicability and is not readiness-scored.'};
 let kind=core?'linked':support?'advisory':'good';
 if(id==='Q35'&&!enhanced)kind='advisory';
 if(id==='Q38'&&['no','na'].includes(business.otherResponsible))kind='advisory';
 if(id==='Q38'&&(!business.otherResponsible||business.otherResponsible==='unknown'))kind='conditional';
 if(['Q24','Q25','Q31'].includes(id)&&enhanced)kind='linked';
 if(kind==='linked'&&!inScope)kind='conditional';
 let label=kind==='linked'?'Linked to legal duty':kind==='conditional'?'Duty-linked - confirm scope':kind==='good'?'Optional good practice':'Advisory preparedness';
 const [reference,detail]=SPEC[id]||[];
 const fallback=kind==='conditional'?'This check may relate to a statutory duty depending on the confirmed scope and responsible-person arrangements.':kind==='linked'?'This question relates to a wider duty. Its exact control or wording is not necessarily an independent statutory obligation.':kind==='advisory'?'This check supports readiness but is not itself a universally prescribed legal requirement.':'This check goes beyond the minimum statutory duty and should be considered proportionately.';
 return {kind,label,reference:reference||'Home Office statutory guidance: chapters 7-8',detail:detail||fallback,framework:core?'Core statutory-aligned control':support?'Supporting preparedness control':'Good practice / resilience'};
}
function recommendation(id,answer,scope={},business={},original=''){
  // Preserve the question matrix's action unless a tier-specific qualification materially
  // changes the advice. Never mandate specific equipment or a universal written policy.
  const enhanced=scope.premises==='Enhanced tier'||scope.event==='Potential qualifying event (enhanced duties)';
  const standard=scope.premises==='Standard tier'&&!enhanced;
  let advice='';
  if(id==='Q5' && standard)advice='Standard tier: ensure appropriate section 5 procedures work in practice. Written documentation is recommended, not a separate section 7 requirement.';
  if(id==='Q5' && enhanced)advice='Enhanced tier/qualifying event: alongside section 5 procedures, prepare the section 7 document recording procedures, measures and their expected effect.';
  if(id==='Q24' || id==='Q25'){
    if(enhanced)advice='Enhanced tier/qualifying event: assess and implement proportionate public protection measures under section 6, so far as reasonably practicable. No particular physical device is automatically prescribed.';
    else if(standard)advice='Standard tier: extra physical security measures are advisory, not an automatic section 6 duty. Review what is suitable and proportionate.';
    else advice='Check scope first. Additional physical controls may be good practice but must not be presented as a universal statutory requirement.';
  }
  if(id==='Q31'){
    if(enhanced)advice='Enhanced tier/qualifying event: prepare the section 7 compliance document covering existing/planned procedures and measures and how they are expected to reduce harm or vulnerability.';
    else advice='Standard tier or unconfirmed scope: documenting procedures is recommended, but the enhanced-tier section 7 document is not automatically required.';
  }
  if(id==='Q35'){
    if(enhanced)advice='If the enhanced-tier or qualifying-event responsible person is an organisation, designate a senior individual with responsibility for compliance under section 10. An individual responsible person is treated differently.';
    else advice='Standard tier: a named preparedness lead is useful governance but a section 10 senior-individual designation is not required solely by being standard tier.';
  }
  if(id==='Q38'){
    if(business.otherResponsible==='yes')advice='Where multiple responsible persons have relevant control, coordinate so far as reasonably practicable under section 8; clarify responsibilities and contact arrangements.';
    else advice='Clarify whether any other responsible person actually has control before treating statutory coordination as applicable. Agree practical arrangements with other users of the site.';
  }
  if(['Q39','Q40','Q41','Q42'].includes(id)){
    if(enhanced)advice='Enhanced-tier premises/qualifying events: take account of event-specific arrangements when implementing appropriate section 5 procedures and section 6 measures; document these as section 7 requires.';
    else if(standard)advice='Standard-tier premises: adapt and communicate the applicable section 5 procedures for out-of-hours activities; extra event security controls are not automatically separate legal duties.';
    else advice='Event scope has not been confirmed. Assess the event against public access, 800-person attendance, entry-condition checks and exclusions before treating enhanced duties as applicable.';
    if(id==='Q41')advice+=' General supervision or controlled access alone does not satisfy the statutory qualifying-event entry condition.';
  }
  return advice ? (original ? original.trim()+'  '+advice : advice) : original;
}
function overview(scope={}){
 const qualifying=scope.premises==='Enhanced tier'||scope.premises==='Standard tier'||scope.event==='Potential qualifying event (enhanced duties)';
 const enhanced=scope.premises==='Enhanced tier'||scope.event==='Potential qualifying event (enhanced duties)';
 const inScope=enhanced||scope.premises==='Standard tier';
 const standard=scope.premises==='Standard tier'&&!enhanced;
 const notes=[];
 notes.push('If the premises or event is legally in scope: section 5 requires appropriate public protection procedures, so far as reasonably practicable (evacuation, invacuation, lockdown and communication).');
 notes.push('Where applicable: section 8 co-ordination between responsible persons and section 9 notification to the regulator are separate duties, not assessed by the RAG score.');
 if(enhanced)notes.push('Enhanced-tier / qualifying-event duties also include section 6 protective measures, section 7 documentation, and section 10 senior-individual designation where the responsible person is an organisation.');
 else notes.push('Enhanced-tier / qualifying-event duties under sections 6, 7 and 10 may apply if that classification is established; they are not automatically standard-tier obligations.');
 if(!qualifying)notes.unshift('Scope is not established as qualifying on the answers provided; review any exclusions, complex uses and events before treating duties as applicable.');
 notes.push('Check which provisions and supporting regulations are in force at the assessment date; this app does not determine legal compliance.');
 return notes;
}
const api={classify,overview,recommendation,CORE,SUPPORT,GOOD};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.ReadinessBasis=api;
})(typeof window!=='undefined'?window:globalThis);
