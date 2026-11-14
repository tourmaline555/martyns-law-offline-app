/* Dependency-free, wholly offline PDF generator. A4 pages, built-in Helvetica fonts. */
(function(root){
'use strict';
const W=595.28,H=841.89,M=43,RIGHT=W-M;
const INK=[0.09,0.20,0.31],MUTED=[0.37,0.44,0.51],NAVY=[0.063,0.173,0.278],TEAL=[0.06,0.44,0.44];
const RAG={Green:[0.14,0.48,0.30],Amber:[0.65,0.39,0.09],Red:[0.70,0.21,0.17],Unrated:[0.40,0.45,0.49]};
function safe(t){return String(t??'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2010-\u2015]/g,'-').replace(/\u2026/g,'...').replace(/\u00a3/g,'GBP ').replace(/\u00a0/g,' ').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'?');}
function pdfLiteral(s){return '('+safe(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')+')';}
const FONT_WIDTHS={regular:[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584],bold:[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]};
function estimate(s,size,bold=false){const w=FONT_WIDTHS[bold?'bold':'regular'];let n=0;for(const c of s){const code=c.charCodeAt(0)-32;n+=code>=0&&code<95?w[code]:600;}return n*size/1000;}
function wrap(text,width,size,bold=false){const lines=[];for(const paragraph of safe(text).split(/\r?\n/)){if(!paragraph.trim()){lines.push('');continue;}let line='';for(let word of paragraph.split(/\s+/)){if(!word)continue;while(word && estimate(word,size,bold)>width){let n=Math.max(1,Math.floor(width/(size*.55)));while(n>1&&estimate(word.slice(0,n),size,bold)>width)n--;if(line){lines.push(line);line='';}lines.push(word.slice(0,n));word=word.slice(n);}if(!word)continue;const test=line?line+' '+word:word;if(estimate(test,size,bold)<=width)line=test;else{lines.push(line);line=word;}}if(line)lines.push(line);}return lines;}
function bytes(s){const arr=new Uint8Array(s.length);for(let i=0;i<s.length;i++)arr[i]=s.charCodeAt(i)&255;return arr;}
class Pdf {
 constructor(){this.pages=[];this.newPage();}
 fmt(n){return Number(n).toFixed(2).replace(/\.00$/,'');}
 color(v){return v.map(x=>this.fmt(x)).join(' ');}
 rect(x,y,w,h,fill){this.out(`${this.color(fill)} rg ${this.fmt(x)} ${this.fmt(y)} ${this.fmt(w)} ${this.fmt(h)} re f\n`);}
 rule(x,y,w,color=[.85,.89,.91]){this.out(`${this.color(color)} RG .6 w ${this.fmt(x)} ${this.fmt(y)} m ${this.fmt(x+w)} ${this.fmt(y)} l S\n`);}
 out(cmd){this.page.commands+=cmd;}
 at(text,x,y,size=10,bold=false,color=INK){this.out(`${this.color(color)} rg BT /${bold?'F2':'F1'} ${this.fmt(size)} Tf 1 0 0 1 ${this.fmt(x)} ${this.fmt(y)} Tm ${pdfLiteral(text)} Tj ET\n`);}
 newPage(){const page={commands:'',n:this.pages.length+1};this.pages.push(page);this.page=page;this.rect(0,H-72,W,72,NAVY);this.at("MARTYN'S LAW  /  READINESS CHECK",M,H-43,16,true,[1,1,1]);this.at('Private self-assessment  |  Not a legal compliance certificate',M,H-60,8,false,[.81,.87,.91]);this.y=H-103;}
 ensure(h){if(this.y-h<62)this.newPage();}
 gap(n=8){this.y-=n;this.ensure(4);}
 title(text){this.ensure(42);this.at(text,M,this.y,15,true,NAVY);this.y-=23;this.rule(M,this.y+5,W-2*M);this.y-=10;}
 subtitle(text){this.ensure(29);this.at(text,M,this.y,11,true,TEAL);this.y-=17;}
 lineText(text,{size=9.4,bold=false,color=INK,indent=0,after=5,leading=13.4,width=null}={}){
   const x=M+indent;const max=width??(RIGHT-x);
   const lines=wrap(text,max-5,size,bold);
   for(const ln of lines){this.ensure(leading+3);if(ln)this.at(ln,x,this.y,size,bold,color);this.y-=leading;}
   this.y-=after;
 }
 kv(label,value){this.lineText(`${label}  ${value||'-'}`,{size:9.5,after:3});}
 block(title,text){this.ensure(36);this.lineText(title,{size:10.1,bold:true,after:3});this.lineText(text,{size:9.2,color:INK,after:6});}
 bar(label,score,barColor=TEAL){this.ensure(31);this.at(label,M,this.y,9.5,true,INK);this.at(score===null?'-':`${Math.round(score)}%`,RIGHT-38,this.y,9.5,true,INK);this.y-=10;this.rect(M,this.y-7,RIGHT-M,7,[.90,.94,.95]);if(score!==null)this.rect(M,this.y-7,(RIGHT-M)*Math.max(0,Math.min(100,score))/100,7,barColor);this.y-=20;}
 countBar(label,count,maximum,color=TEAL){this.ensure(31);this.at(label,M,this.y,9.5,true,INK);this.at(String(count),RIGHT-38,this.y,9.5,true,INK);this.y-=10;this.rect(M,this.y-7,RIGHT-M,8,[.90,.94,.95]);if(count>0 && maximum>0)this.rect(M,this.y-7,(RIGHT-M)*count/maximum,8,color);this.y-=20;}
 save(){
  this.pages.forEach((p,i)=>{p.commands+=`${this.color([.83,.87,.90])} RG .5 w ${M} 47 m ${RIGHT} 47 l S\n`;p.commands+=`${this.color(MUTED)} rg BT /F1 8 Tf 1 0 0 1 ${M} 33 Tm ${pdfLiteral('Readiness self-assessment  |  Generated on device; no external processing')} Tj ET\n`;p.commands+=`${this.color(MUTED)} rg BT /F1 8 Tf 1 0 0 1 ${RIGHT-50} 33 Tm ${pdfLiteral(`Page ${i+1} / ${this.pages.length}`)} Tj ET\n`;});
  const objects=[];
  function add(s){objects.push(s);return objects.length;}
  const catalog=add(''),pages=add(''),regular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const refs=[];
  for(const p of this.pages){const content=add(`<< /Length ${bytes(p.commands).length} >>\nstream\n${p.commands}endstream`);const page=add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R >>`);refs.push(`${page} 0 R`);}
  objects[catalog-1]=`<< /Type /Catalog /Pages ${pages} 0 R >>`;
  objects[pages-1]=`<< /Type /Pages /Count ${this.pages.length} /Kids [${refs.join(' ')}] >>`;
  let all='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';const offsets=[0];
  objects.forEach((object,i)=>{offsets.push(bytes(all).length);all+=`${i+1} 0 obj\n${object}\nendobj\n`;});
  const xref=bytes(all).length;
  all+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(const offset of offsets.slice(1))all+=`${String(offset).padStart(10,'0')} 00000 n \n`;
  all+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return bytes(all);
 }
}
const B=root.ReadinessBasis || (typeof require==='function' ? require('./basis.js') : null);
const mapAnswer={yes:'Yes',partly:'Partly',no:'No',not_sure:'Not sure',na:'Not applicable'};
function generate(state,result,tracker=[]){
 const p=new Pdf(),b=state.business,r=result;
 p.title('Management summary - readiness assessment');
 p.kv('Organisation:',b.name||'Not specified');p.kv('Premises:',b.site||'Not specified');
 p.kv('Assessor:',b.assessor||'Not specified');p.kv('Assessment date:',b.date||new Date().toISOString().slice(0,10));
 p.kv('Report status:',state._audit?'Archived - read-only record':'DRAFT - NOT SAVED TO AUDIT TRAIL');
 p.kv('Questionnaire:',state._audit?.questionnaireVersion||'v3.6 current assessment');
 if(state._audit){p.kv('Audit record ID:',state._audit.id);p.kv('Saved at (UTC):',state._audit.createdAt);}
 p.gap(8);
 p.subtitle('1  |  PRELIMINARY LEGAL SCOPE - CHECK THIS FIRST');
 const flagged=r.scope.scopeUnknown || r.scope.premises.startsWith('Review required');
 p.lineText('Premises: '+r.scope.premises,{size:11,bold:true,color:flagged?RAG.Red:NAVY,after:3});
 p.lineText('Events: '+r.scope.event,{size:9.6,bold:true,color:r.scope.event.startsWith('Review required')?RAG.Amber:INK,after:4});
 if(flagged){p.lineText('SCOPE REVIEW REQUIRED: The answers may be inconsistent or incomplete. Do not treat the readiness rating as a determination that the Act does or does not apply.',{size:9.2,bold:true,color:RAG.Red,after:5});}
 for(const reason of (r.scope.reasons||[]).slice(0,2))p.lineText('Check: '+reason,{size:8.7,after:3});
 p.gap(4);
 p.subtitle('2  |  READINESS RATING - NOT A COMPLIANCE CERTIFICATE');
 p.lineText(`${r.rag.toUpperCase()}  |  ${r.score===null?'No score':`${Math.round(r.score)}% weighted score`}`,{bold:true,size:23,color:RAG[r.rag]||RAG.Unrated,leading:29,after:3});
 p.lineText(`${r.answered}/${r.total} applicable scored, ${r.skippedByRouting??0} routed out of ${r.questionBank||38}; scope checked separately. ${r.unanswered} unanswered.`,{size:9.2,after:4});
 p.lineText(`Critical safeguards: ${r.critical.length} No/Not sure and ${(r.criticalPartly||[]).length} Partly. Severe sections: ${(r.lowSections||[]).length}. Actions: ${r.actions.length}.`,{size:9.3,after:5});
 if(r.ragReasons?.length)p.lineText('AMBER CAP: '+r.ragReasons.join('; '),{size:8.8,bold:true,color:RAG.Amber,after:4});
 p.gap(3);
 p.subtitle('3  |  TOP IMPROVEMENTS');
 const top=[...r.actions].sort((a,b)=>(a.q.critical==='Y'?0:1)-(b.q.critical==='Y'?0:1)).slice(0,3);
 if(top.length){for(const a of top)p.lineText(`${a.priority}  |  ${a.q.id}${a.q.critical==='Y'?' (critical safeguard)':''}: ${a.finding}`,{size:9.1,after:4});}
 else p.lineText('No improvement actions raised from the recorded answers. Review their accuracy and the site context.',{size:9,after:4});
 if(r.answerChecks?.length){p.gap(4);p.subtitle('ANSWERS TO VERIFY');for(const message of r.answerChecks.slice(0,3))p.lineText(message,{size:8.6,color:RAG.Amber,after:3});if(r.answerChecks.length>3)p.lineText(`${r.answerChecks.length-3} further checks appear in the results screen.`,{size:8.5,color:MUTED});}
 p.gap(4);
 p.lineText('Readiness and legal scope are separate. The RAG methodology is independent and does not establish compliance, safety or likelihood of an attack.',{size:8.7,color:MUTED});
 p.newPage();
 p.title('Legal scope and duties to confirm');
 p.lineText('The following is a preliminary scope screen, not legal advice. Confirm ambiguous answers before relying on a duty-tier conclusion.',{size:9.2,after:9});
 p.kv('Premises classification:',r.scope.premises);p.kv('Event classification:',r.scope.event);
 p.kv('Expected premises peak:',r.scope.peak===null?'Not provided':r.scope.peak+' people');
 if(b.events==='yes'||b.events==='unknown')p.kv('Expected event peak:',r.scope.eventPeak===null?'Not provided':r.scope.eventPeak+' people');
 p.kv('Premises use:',b.activity||'Unspecified');p.kv('Publicly accessible building:',b.building||'Unconfirmed');
 p.kv('Premises exclusion selected:',b.excluded||'Unconfirmed');
 if(r.scope.special)p.lineText('Special tier arrangements may apply to places of worship and education/childcare settings. Confirm the precise use.',{size:9});
 p.subtitle('SCOPE ANSWERS TO CHECK');
 if(r.scope.reasons?.length)for(const reason of r.scope.reasons.slice(0,5))p.lineText('- '+reason,{size:8.9,after:4});
 else p.lineText('No additional scope clarification indicated by these answers; independent verification is still appropriate.',{size:8.8});
 p.gap(5);p.subtitle('STATUTORY OBLIGATIONS TO CONFIRM IF IN SCOPE');
 for(const n of B.overview(r.scope))p.lineText('- '+n,{size:8.8,after:4});
 p.gap(6);
 p.lineText('A nightclub may be accessible to the public even where entry requires payment, a ticket or club membership. Events also have separate qualifying-event tests. See section 2, section 3 and chapters 4-5 of the statutory guidance.',{size:8.8,color:MUTED});
 p.newPage();
 p.subtitle('SCORES BY SECTION');
 for(const section of r.sections){const value=section.max?section.earned/section.max*100:null;const flagged=value!==null&&value<25&&section.answered>=2;p.bar(`${section.name}${flagged?' [SEVERE GAP]':''}  (${section.answered} scored, ${section.unanswered} unanswered)`,value,flagged?RAG.Red:value!==null&&value<50?RAG.Amber:TEAL);}
 p.gap(2);
 p.title('Visual readiness summary');
 const priorityLabels=['Immediate','High','Medium','Low'];
 const priorityColors=[[.72,.23,.19],[.80,.47,.17],[.91,.66,.23],[.20,.49,.51]];
 const priorityValues=priorityLabels.map(name=>r.actions.filter(a=>a.priority===name).length);
 const maxPriority=Math.max(1,...priorityValues);
 p.subtitle('ACTION PRIORITIES - NUMBER OF ACTIONS');
 priorityLabels.forEach((name,i)=>p.countBar(name,priorityValues[i],maxPriority,priorityColors[i]));
 const answerLabels=[['yes','Yes'],['partly','Partly'],['no','No'],['not_sure','Not sure'],['na','N/A'],['','Unanswered']];
 const answerValues=answerLabels.map(([key])=>r.rows.filter(v=>v.answer===key).length);
 const maxAnswer=Math.max(1,...answerValues);
 p.subtitle('ANSWER PROFILE - NUMBER OF QUESTIONS');
 answerLabels.forEach(([key,name],i)=>p.countBar(name,answerValues[i],maxAnswer, key==='yes'?RAG.Green:key==='partly'?RAG.Amber:key==='no'?RAG.Red:TEAL));
 p.lineText('These charts show recorded responses and recommended action counts, not the likelihood of a terrorist attack. The RAG result is the private questionnaire score, not a statutory certification.',{size:8.9,color:MUTED});
  p.newPage();
 p.title('How to read the priorities');
 p.subtitle('WHAT THIS SCORE DOES AND DOES NOT SAY');
 p.lineText('This weighted self-assessment is based on the supplied question matrix. It is not an SIA-approved scoring system, a safety guarantee, a certification or a legal compliance determination. Some assessed controls go beyond the express standard-tier legal requirements.',{size:9.1});
 p.lineText('The Act requires appropriate, reasonably practicable public protection procedures: evacuation, invacuation, lockdown and communication. Documenting procedures is recommended for standard-tier premises but is not an express section 7 duty; enhanced-tier premises and qualifying events have additional measures and documentation duties. Always review what is safe and proportionate for your site.',{size:9.1});
 p.lineText('A legal duty applies only when the Act covers the premises/event and any tier-specific conditions are met. Labels indicate whether a scored question is related to a wider statutory duty or is advisory; a low score alone is not proof of non-compliance.',{size:9.1,after:6});
 p.lineText('Home Office guidance terminology: MUST = legal requirement; SHOULD = recommended but not expressly required; COULD = optional example (paragraph 1.14).',{size:9,after:7});
 p.lineText('The first-page scope classification and duty checks are separate from the independent readiness rating. Confirm scope before applying tier-specific legal duties.',{size:8.8,after:6});
 if(r.answerChecks?.length){p.subtitle('ANSWERS REQUIRING CLARIFICATION');for(const item of r.answerChecks)p.lineText('- '+item,{size:8.6,after:3});}
 p.gap(4);
 p.title('Priority action plan');
 p.lineText('Priorities describe preparedness urgency, not legal enforceability. Answering Not sure uses No priority. Check action appropriateness and legal scope before implementing.',{size:9.2,after:10});
 if(!r.actions.length)p.lineText('No scored responses currently produce improvement actions. Check whether the questionnaire is complete and whether responses are supported by evidence.');
 for(const a of r.actions){
   // Keep the question, finding and recommendation together where practicable.
   p.ensure(172);
   p.lineText(`${a.priority.toUpperCase()}  |  ${a.q.id}  |  ${a.q.section}  |  ${mapAnswer[a.answer]}`,{size:9.4,color:a.priority==='Immediate'?RAG.Red:TEAL,bold:true,after:3});
   p.lineText(a.q.text,{size:10,bold:true,after:3});
   const basis=B.classify(a.q.id,r.scope,b);p.lineText('Basis: '+basis.label+'  |  '+basis.reference,{size:8.3,color:MUTED,after:3});
   p.lineText(`Finding: ${a.finding}`,{size:9,after:2});
   if(a.q.critical==='Y'&&a.answer==='partly')p.lineText('Critical safeguard partly effective - review promptly.',{size:8.8,color:RAG.Amber,bold:true,after:2});
   p.lineText(`Recommended action: ${a.action}`,{size:9.3,bold:true,after:2});
   const note=state.notes?.[a.q.id];if(note)p.lineText(`Assessor note: ${note}`,{size:8.6,after:2});
   p.gap(7);
 }
 // The action register is current at export; it is not frozen with an older audit snapshot.
 if(Array.isArray(tracker) && tracker.length){
   p.title('Action tracker - progress at export');
   p.lineText('This section reflects current saved action statuses on this device at the moment the PDF was generated. It is NOT part of an earlier assessment snapshot. Changes are logged separately in the local action history.',{size:9.1,color:MUTED,after:10});
   const complete=tracker.filter(a=>a.status==='Completed').length;
   const active=tracker.length-complete;
   const overdue=tracker.filter(a=>a.status!=='Completed'&&a.dueDate&&a.dueDate<[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-')).length;
   p.kv('Action register:',`${tracker.length} total, ${active} outstanding, ${complete} completed`);
   p.kv('Overdue:',`${overdue} outstanding actions`);
   p.gap(10);
   for(const a of tracker){
     p.ensure(89);
     p.lineText(`${a.questionId}  |  ${a.priority}  |  ${a.status}${a.flagged?'  |  Gap still flagged':'  |  Gap not flagged in latest review'}`,{bold:true,size:9.4,color:a.status==='Completed'?RAG.Green:a.dueDate&&a.dueDate<new Date().toISOString().slice(0,10)?RAG.Red:TEAL,after:3});
     p.lineText(a.recommendation,{size:9.2,after:3});
     p.lineText(`Owner: ${a.owner||'Not assigned'}   Target date: ${a.dueDate||'Not set'}`,{size:8.9,after:2});
     if(a.note)p.lineText('Progress update: '+a.note,{size:8.7,after:3});
     p.gap(6);
   }
 }
 p.title('Full question-by-question record');
 p.lineText('S1-S12 form a separate scope screen, excluded from RAG scoring. Below are the readiness questions shown in this assessment. Items skipped by routing are not scored.',{size:9.2,after:9});
 for(const {q,answer} of r.rows){
   p.ensure(78);
   p.lineText(`${q.id}  |  ${q.section}  |  Weight ${q.weight}  |  ${mapAnswer[answer]||'Unanswered'}`,{size:9.4,bold:true,color:TEAL,after:3});
   p.lineText(q.text,{size:9.6,bold:true,after:3});
   const basis=B.classify(q.id,r.scope,b);p.lineText('Basis: '+basis.label+'  |  '+basis.reference,{size:8.2,color:MUTED,after:3});
   if(answer==='yes'||answer==='partly'||answer==='no'||answer==='not_sure'){
     const kind=answer==='yes'?'Yes':answer==='partly'?'Partly':'No';
     p.lineText('Finding: '+q['finding'+kind],{size:8.8,after:2});
     const savedAction=r.actions.find(a=>a.q.id===q.id);
     const original=q['action'+kind];
     const tailored= savedAction?.action || B.recommendation(q.id,answer,r.scope,b,original);
     p.lineText('Recommended: '+tailored,{size:8.8,after:2});
   }
   if(answer==='na')p.lineText('Not applicable - excluded from readiness score.',{size:8.7,color:MUTED,after:2});
   if(!answer)p.lineText('Not answered - score is provisional.',{size:8.7,color:MUTED,after:2});
   const note=state.notes?.[q.id];if(note)p.lineText('Assessor note / evidence: '+note,{size:8.6,color:MUTED,after:2});
   p.gap(5);
 }
 p.ensure(450); // Keep the final scope appendix together where possible, without an almost-empty preceding page.
 p.title('Scope answers, method and references');
 p.lineText('SCOPE & ROUTING (S1-S12) - EXCLUDED FROM RAG',{size:10,bold:true,color:TEAL});
 p.kv('S1 - responsible entity:',b.name||'Unknown');
 p.kv('S2 - premises address:',b.site||'Unknown');
 p.kv('S3 - premises use:',b.activity||'Unknown');
 p.kv('S4 - expected peak attendance:',b.peak===''?'Not sure':`${b.peak} people`);
 p.lineText('S5 - peak estimate basis: '+(b.peakMethod||'Not recorded'),{size:9.1});
 p.kv('S6 - events or out-of-hours activities:',b.events||'Not sure');
 if(b.events==='yes'||b.events==='unknown'){
   p.kv('S7 - expected event peak:',b.eventPeak===''?'Not sure':`${b.eventPeak} people`);
   p.kv('S8 - event location:',b.eventLocation||'Not recorded (legacy: same-site assumed)');
   p.kv('S9 - event access controls:',mapAnswer[b.accessGeneral]||b.accessGeneral||'Not sure');
   p.kv('Public access:',b.publicAccess||'Unknown');p.kv('Entry-condition checks:',b.entryChecks||'Unknown');
   p.kv('Event exclusion:',b.eventExcluded||'Unknown');
 }
 p.kv('S10 - shared premises:',b.shared||'Not sure');
 if(b.shared==='yes'||b.shared==='unknown')p.kv('S11 - other responsible persons:',b.otherResponsible||'Not sure');
 p.kv('S12 - assessment date:',b.date||'Not recorded');p.kv('S12 - next review due:',b.reviewDate||'Not recorded');
 p.kv('Building/public access:',b.building||'Unknown');p.kv('Premises statutory exclusion:',b.excluded||'Unknown');
 p.gap(11);
 p.lineText('SCORING', {size:10,bold:true,color:TEAL});
 p.lineText('Yes = 2; Partly = 1; No or Not sure = 0. Weighted % = sum(answer score x weight) / sum(2 x weight) for answered, applicable questions. Not applicable and unanswered questions are excluded from the denominator. Green >=75%; Amber 50% to less than 75%; Red below 50%.', {size:9});
 p.lineText(r.scoringVersion==='matrix-2026-v2-safeguards'?'App guardrails: a critical Partly/No/Not sure, incomplete assessment or a scored section below 25% can cap Green at Amber. Weights and numeric score are unchanged. This is NOT an official statutory scoring method.':'Legacy scoring: critical No/Not sure or incomplete assessment capped Green at Amber. This historical score has not been recalculated.',{size:9});
 p.gap(5);
 p.lineText('OFFICIAL REFERENCES (available online when connected)',{size:10,bold:true,color:TEAL});
 p.lineText('Home Office statutory guidance, updated 25 August 2026:',{size:9,after:2});
 p.lineText('gov.uk/government/publications/the-terrorism-protection-of-premises-act-2025/terrorism-protection-of-premises-act-2025-statutory-guidance',{size:8.1});
 p.lineText('SIA regulator guidance: gov.uk/guidance/understanding-martyns-law-and-the-sias-role-as-regulator',{size:8.4});
 p.lineText('Prepared using government guidance reviewed on 14 November 2026. Check for newer requirements before relying on this assessment.',{size:9.1,color:MUTED});
 return p.save();
}
const api={generate};root.ReadinessPdf=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
