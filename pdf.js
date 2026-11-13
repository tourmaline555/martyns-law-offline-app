/* Dependency-free, wholly offline PDF generator. A4 pages, built-in Helvetica fonts. */
(function(root){
'use strict';
const W=595.28,H=841.89,M=43,RIGHT=W-M;
const INK=[0.09,0.20,0.31],MUTED=[0.37,0.44,0.51],NAVY=[0.063,0.173,0.278],TEAL=[0.06,0.44,0.44];
const RAG={Green:[0.14,0.48,0.30],Amber:[0.65,0.39,0.09],Red:[0.70,0.21,0.17],Unrated:[0.40,0.45,0.49]};
function safe(t){return String(t??'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2010-\u2015]/g,'-').replace(/\u2026/g,'...').replace(/\u00a3/g,'GBP ').replace(/\u00a0/g,' ').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'?');}
function pdfLiteral(s){return '('+safe(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')+')';}
function estimate(s,size){let w=0;for(const c of s){w+=(/[ilIjtfr\.,:'!\| ]/.test(c)?.29:/[MW@#%]/.test(c)?.88:/[A-Z]/.test(c)?.65:.53)*size;}return w;}
function wrap(text,width,size){const lines=[];for(const paragraph of safe(text).split(/\r?\n/)){if(!paragraph.trim()){lines.push('');continue;}let line='';for(let word of paragraph.split(/\s+/)){if(!word)continue;while(word && estimate(word,size)>width){let n=Math.max(1,Math.floor(width/(size*.55)));while(n>1&&estimate(word.slice(0,n),size)>width)n--;if(line){lines.push(line);line='';}lines.push(word.slice(0,n));word=word.slice(n);}if(!word)continue;const test=line?line+' '+word:word;if(estimate(test,size)<=width)line=test;else{lines.push(line);line=word;}}if(line)lines.push(line);}return lines;}
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
   const lines=wrap(text,max,size);
   for(const ln of lines){this.ensure(leading+3);if(ln)this.at(ln,x,this.y,size,bold,color);this.y-=leading;}
   this.y-=after;
 }
 kv(label,value){this.lineText(`${label}  ${value||'-'}`,{size:9.5,after:3});}
 block(title,text){this.ensure(36);this.lineText(title,{size:10.1,bold:true,after:3});this.lineText(text,{size:9.2,color:INK,after:6});}
 bar(label,score){this.ensure(31);this.at(label,M,this.y,9.5,true,INK);this.at(score===null?'-':`${Math.round(score)}%`,RIGHT-38,this.y,9.5,true,INK);this.y-=10;this.rect(M,this.y-7,RIGHT-M,7,[.90,.94,.95]);if(score!==null)this.rect(M,this.y-7,(RIGHT-M)*Math.max(0,Math.min(100,score))/100,7,TEAL);this.y-=20;}
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
const mapAnswer={yes:'Yes',partly:'Partly',no:'No',not_sure:'Not sure',na:'Not applicable'};
function generate(state,result){
 const p=new Pdf(),b=state.business,r=result;
 p.title('Preparedness assessment report');
 p.kv('Organisation:',b.name||'Not specified');p.kv('Site / location:',b.site||'Not specified');p.kv('Assessed by:',b.assessor||'Not specified');p.kv('Assessment date:',b.date||new Date().toISOString().slice(0,10));
 p.gap(10);
 p.subtitle('OVERALL READINESS');
 p.lineText(`${r.rag.toUpperCase()}  |  ${r.score===null?'No score':`${Math.round(r.score)}% weighted score`}`,{bold:true,size:21,color:RAG[r.rag]||RAG.Unrated,leading:28,after:3});
 p.lineText(`${r.answered} scored / ${r.total} relevant questions; ${r.na} not applicable; ${r.unanswered} unanswered. ${r.provisional?'Provisional - unanswered questions remain.':'Assessment answers recorded.'}`,{size:9.5,after:7});
 p.lineText(`Critical overrides: ${r.critical.length}${r.critical.length?' ('+r.critical.map(q=>q.id).join(', ')+')':' (none triggered)'}. Actions recommended: ${r.actions.length}.`,{size:9.4});
 p.subtitle('PRELIMINARY SCOPE SCREEN');
 p.kv('Premises:',r.scope.premises);p.kv('Events:',r.scope.event);p.kv('Expected premises peak:',r.scope.peak===null?'Not provided':r.scope.peak+' people');
 if(b.events==='yes')p.kv('Expected event peak:',r.scope.eventPeak===null?'Not provided':r.scope.eventPeak+' people');
 if(r.scope.special)p.lineText('Special rule: childcare, schools, further education and places of worship are generally treated as standard-tier premises even at 800+, and qualifying events at these premises are excluded.',{size:8.6,color:MUTED});
 p.lineText('Scope is indicative only. Mixed-use premises, exclusions, shared sites and event conditions require case-specific consideration.',{size:8.6,color:MUTED});
 p.gap(4);
 const summaryFindings=r.actions.filter(a=>(a.answer==='no'||a.answer==='not_sure')&&(a.q.summary==='Y'||a.critical));
 p.subtitle('EXECUTIVE HIGHLIGHTS');
 if(summaryFindings.length){for(const a of summaryFindings.slice(0,6))p.lineText(`${a.q.id}: ${a.finding}`,{size:8.9,after:4});if(summaryFindings.length>6)p.lineText(`${summaryFindings.length-6} further key findings are detailed in the action plan.`,{size:8.8,color:MUTED});}
 else p.lineText('No key-summary finding was triggered by the recorded answers. Review the full record and evidence.',{size:8.9});
 p.gap(2);
 p.subtitle('SCORES BY SECTION');
 for(const s of r.sections) p.bar(`${s.name}  (${s.answered} scored, ${s.unanswered} unanswered)`,s.max?s.earned/s.max*100:null);
 p.gap(2);
 p.subtitle('WHAT THIS SCORE DOES AND DOES NOT SAY');
 p.lineText('This weighted self-assessment is based on the supplied question matrix. It is not an SIA-approved scoring system, a safety guarantee, a certification or a legal compliance determination. Some assessed controls go beyond the express standard-tier legal requirements.',{size:9.1});
 p.lineText('The Act focuses on appropriate, reasonably practicable public protection procedures: evacuation, invacuation, lockdown and communication. Enhanced-tier premises and qualifying events have additional obligations, including measures and documentation. Always review what is safe and proportionate for your circumstances.',{size:9.1});
 p.title('Priority action plan');
 p.lineText('Actions are ordered Immediate, High, Medium and Low. Answers of "Not sure" use the same conservative action/priority as "No". Check each proposed action for practicality and relevance before implementing.',{size:9.2,after:10});
 if(!r.actions.length)p.lineText('No scored responses currently produce improvement actions. Check whether the questionnaire is complete and whether responses are supported by evidence.');
 for(const a of r.actions){
   p.ensure(80);
   p.lineText(`${a.priority.toUpperCase()}  |  ${a.q.id}  |  ${a.q.section}  |  ${mapAnswer[a.answer]}`,{size:9.4,color:a.priority==='Immediate'?RAG.Red:TEAL,bold:true,after:3});
   p.lineText(a.q.text,{size:10,bold:true,after:3});
   p.lineText(`Finding: ${a.finding}`,{size:9,after:2});
   p.lineText(`Recommended action: ${a.action}`,{size:9.3,bold:true,after:2});
   p.lineText(`Suggested evidence: ${a.q.evidence}`,{size:8.5,color:MUTED,after:2});
   const note=state.notes?.[a.q.id];if(note)p.lineText(`Assessor note: ${note}`,{size:8.6,after:2});
   p.gap(7);
 }
 p.title('Full question-by-question record');
 p.lineText('Q1-Q4 form the separate scope screen. The record below contains each readiness question shown in this assessment. Items skipped by conditional branching are not scored.',{size:9.2,after:9});
 for(const {q,answer} of r.rows){
   p.ensure(78);
   p.lineText(`${q.id}  |  ${q.section}  |  Weight ${q.weight}  |  ${mapAnswer[answer]||'Unanswered'}`,{size:9.4,bold:true,color:TEAL,after:3});
   p.lineText(q.text,{size:9.6,bold:true,after:3});
   if(answer==='yes'||answer==='partly'||answer==='no'||answer==='not_sure'){
     const kind=answer==='yes'?'Yes':answer==='partly'?'Partly':'No';
     p.lineText('Finding: '+q['finding'+kind],{size:8.8,after:2});
     p.lineText('Recommended: '+q['action'+kind],{size:8.8,after:2});
   }
   if(answer==='na')p.lineText('Not applicable - excluded from readiness score.',{size:8.7,color:MUTED,after:2});
   if(!answer)p.lineText('Not answered - score is provisional.',{size:8.7,color:MUTED,after:2});
   const note=state.notes?.[q.id];if(note)p.lineText('Assessor note / evidence: '+note,{size:8.6,color:MUTED,after:2});
   p.gap(5);
 }
 p.title('Scope details and scoring method');
 p.lineText('PREMISES AND EVENT SCREEN (Q1-Q4)',{size:10,bold:true,color:TEAL});
 p.kv('Q1 - expected peak attendance:',b.peak===''?'Not sure':`${b.peak} people`);
 p.kv('Q2 - events / higher attendance:',b.events||'Not sure');
 p.kv('Q3 - largest event attendance:',b.events==='yes'?(b.eventPeak===''?'Not sure':`${b.eventPeak} people`):'Not applicable');
 p.kv('Q4 - event access controls:',b.events==='yes'?(mapAnswer[b.accessGeneral]||'Not sure'):'Not applicable');
 p.kv('Schedule 1 principal use category:',b.activity||'Unknown');
 p.kv('Building or part of building:',b.building||'Unknown');p.kv('Premises excluded:',b.excluded||'Unknown');
 if(b.events==='yes'){
   p.kv('Public attendance:',b.publicAccess||'Unknown');p.kv('Tickets / membership checked:',b.entryChecks||'Unknown');p.kv('Event excluded:',b.eventExcluded||'Unknown');
 }
 p.kv('Shared premises:',b.shared||'Unknown');
 p.gap(11);
 p.lineText('SCORING', {size:10,bold:true,color:TEAL});
 p.lineText('Yes = 2; Partly = 1; No or Not sure = 0. Weighted % = sum(answer score x weight) / sum(2 x weight) for answered, applicable questions. Not applicable and unanswered questions are excluded from the denominator. Green >=75%; Amber 50% to less than 75%; Red below 50%.', {size:9});
 p.lineText('If any critical override question is No or Not sure, overall cannot be Green. Incomplete assessments cannot be Green. Q1-Q4 are not included in readiness scoring. These RAG bands and overrides come from the supplied spreadsheet, not the Act.',{size:9});
 p.gap(5);
 p.lineText('OFFICIAL REFERENCES (available online when connected)',{size:10,bold:true,color:TEAL});
 p.lineText('Home Office statutory guidance, updated 25 August 2026:',{size:9,after:2});
 p.lineText('gov.uk/government/publications/the-terrorism-protection-of-premises-act-2025/terrorism-protection-of-premises-act-2025-statutory-guidance',{size:8.1});
 p.lineText('SIA regulator guidance: gov.uk/guidance/understanding-martyns-law-and-the-sias-role-as-regulator',{size:8.4});
 p.lineText('Prepared using government guidance reviewed on 13 November 2026. Check for newer requirements before relying on this assessment.',{size:9.1,color:MUTED});
 return p.save();
}
const api={generate};root.ReadinessPdf=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
