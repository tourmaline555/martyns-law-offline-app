/* Dependency-free, wholly offline PDF generator. A4 pages, built-in Helvetica fonts. */
(function(root){
'use strict';
const W=595.28,H=841.89,M=43,RIGHT=W-M;
const INK=[0.094,0.169,0.243],MUTED=[0.376,0.455,0.529],NAVY=[0.063,0.137,0.231],TEAL=[0.086,0.647,0.545],MINT=[0.392,0.878,0.788];
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
 brandShield(x,top,s=1){
   // The same rounded shield/check symbol as the Premivue website, translated to PDF vector paths.
   const px=n=>this.fmt(x+n*s), py=n=>this.fmt(top-n*s);
   this.out(`${this.color([0.082,0.216,0.333])} rg ${this.color(MINT)} RG ${this.fmt(2*s)} w `+
    `${px(24)} ${py(3)} m ${px(42)} ${py(10)} l ${px(42)} ${py(23)} l `+
    `${px(42)} ${py(35.5)} ${px(34.3)} ${py(43.8)} ${px(24)} ${py(46)} c `+
    `${px(13.7)} ${py(43.8)} ${px(6)} ${py(35.5)} ${px(6)} ${py(23)} c `+
    `${px(6)} ${py(10)} l h B\n`);
   this.out(`${this.color(MINT)} RG ${this.fmt(4*s)} w 1 J 1 j ${px(14)} ${py(25)} m ${px(21)} ${py(32)} l ${px(35)} ${py(17)} l S\n`);
 }
 newPage(){const page={commands:'',n:this.pages.length+1};this.pages.push(page);this.page=page;
  this.rect(0,H-72,W,72,NAVY);
  this.brandShield(M-1, H-10, 1.02);
  const left=M+58, y=H-39, brandSize=20;
  this.at('Premi',left,y,brandSize,true,[1,1,1]);
  this.at('vue',left+estimate('Premi',brandSize,true),y,brandSize,true,MINT);
  this.at("MARTYN'S LAW READINESS & ASSURANCE",left,H-55,8,false,[.80,.89,.91]);
  this.y=H-101;
 }
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
 bar(label,score,barColor=TEAL){this.ensure(31);this.at(label,M,this.y,9.5,true,INK);this.at(score===null?'-':`${Math.round(score)}%`,RIGHT-38,this.y,9.5,true,barColor);this.y-=10;this.rect(M,this.y-7,RIGHT-M,7,[.90,.94,.95]);if(score!==null)this.rect(M,this.y-7,(RIGHT-M)*Math.max(0,Math.min(100,score))/100,7,barColor);this.y-=20;}
 countBar(label,count,maximum,color=TEAL){this.ensure(31);this.at(label,M,this.y,9.5,true,INK);this.at(String(count),RIGHT-38,this.y,9.5,true,INK);this.y-=10;this.rect(M,this.y-7,RIGHT-M,8,[.90,.94,.95]);if(count>0 && maximum>0)this.rect(M,this.y-7,(RIGHT-M)*count/maximum,8,color);this.y-=20;}
 save(){
  this.pages.forEach((p,i)=>{p.commands+=`${this.color([.83,.87,.90])} RG .5 w ${M} 47 m ${RIGHT} 47 l S\n`;p.commands+=`${this.color(MUTED)} rg BT /F1 8 Tf 1 0 0 1 ${M} 33 Tm ${pdfLiteral('Premivue  |  Independent readiness assessment  |  Generated on device')} Tj ET\n`;p.commands+=`${this.color(MUTED)} rg BT /F1 8 Tf 1 0 0 1 ${RIGHT-50} 33 Tm ${pdfLiteral(`Page ${i+1} / ${this.pages.length}`)} Tj ET\n`;});
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
const mapAnswer={yes:'Yes',partly:'Partly',no:'No',not_sure:'Not sure',na:'N/A'};
const priorityColours={Immediate:RAG.Red,High:RAG.Amber,Medium:TEAL,Low:MUTED};
function pct(score){return score===null||!Number.isFinite(score)?'Not rated':Math.round(score)+'%';}
function lineCount(str,w,size,bold){return wrap(str,w,size,bold).length;}
function smallRule(p){p.rule(M,p.y+7,RIGHT-M,[.86,.9,.92]);p.y-=8;}
function nextPage(p,title){p.newPage();p.title(title);}
function readableScopeStatus(s){return (s||'Review required').replace(' - conflicting scope answers',' - check answers');}
function generate(state,result,tracker=[],options={}){
 const p=new Pdf(),r=result||{},b=state.business||{},detailed=!!options.detailed;
 const sc=r.scope||{premises:'Review required',event:'Review required',reasons:[],scopeUnknown:true};
 const actions=Array.isArray(r.actions)?r.actions:[];
 const sections=Array.isArray(r.sections)?r.sections:[];
 const rows=Array.isArray(r.rows)?r.rows:[];
 const criticalFlags=(r.critical||[]).length+(r.criticalPartly||[]).length;
 const lowSections=r.lowSections||[];
 const scopeReview=!!sc.scopeUnknown || String(sc.premises||'').startsWith('Review required');
 const status=state._audit?'ARCHIVED / READ-ONLY':r.provisional?'PROVISIONAL / NOT ARCHIVED':'DRAFT / NOT ARCHIVED';
 const title=String(b.name||'Organisation').slice(0,120);
 // Page one: actual management decision and prioritised risks; no full question duplication.
 p.title('Assessment summary');
 p.lineText(title,{size:14,bold:true,after:2});
 p.lineText(`${b.site||'Site not recorded'}  |  Assessed ${b.date||'Date not recorded'}`,{size:9,color:MUTED,after:2});
 p.lineText(`Assessor: ${b.assessor||'Not supplied'}   |   ${status}`,{size:8.4,color:MUTED,after:4});
 if(state._audit?.id)p.lineText(`Audit reference: ${state._audit.id}`,{size:8.4,color:MUTED,after:4});
 if(r.provisional)p.lineText('PROVISIONAL: unanswered questions or unjustified N/A answers; check completeness before relying on this score.',{size:8.6,bold:true,color:RAG.Amber,after:3});
 p.gap(7);
 // Distinguish legal scope from self-assessment readiness.
 p.subtitle('01  Legal scope - preliminary');
 const scopeColour=scopeReview?RAG.Red:TEAL;
 p.rect(M,p.y-48,RIGHT-M,56,[.95,.97,.98]);p.rect(M,p.y-48,3,56,scopeColour);
 p.at('Premises',M+15,p.y-9,8,false,MUTED);
 p.at('Events',M+15,p.y-29,8,false,MUTED);
 const statusX=M+75,area=RIGHT-statusX-12;
 const prem=wrap(readableScopeStatus(sc.premises),area,9.1,true);
 const evt=wrap(sc.event||'Review required',area,8.7,false);
 p.at(prem[0]||'',statusX,p.y-9,9.1,true,scopeColour);
 p.at(evt[0]||'',statusX,p.y-29,8.7,false,INK);
 p.y-=66;
 if(scopeReview){
   p.lineText('SCOPE NEEDS REVIEW BEFORE RELYING ON ANY LEGAL TIER',{size:9.5,bold:true,color:RAG.Red,after:3});
   if((sc.reasons||[]).length)p.lineText('Check: '+sc.reasons[0],{size:8.6,color:INK,leading:12,after:4});
 }
 p.gap(6);
 p.subtitle('02  Readiness score');
 const rag=r.rag||'Unrated',score=pct(r.score),c=RAG[rag]||MUTED;
 p.rect(M,p.y-58,RIGHT-M,65,[.95,.97,.98]);p.rect(M,p.y-58,4,65,c);
 p.at(rag.toUpperCase(),M+18,p.y-15,16,true,c);p.at(score,RIGHT-110,p.y-24,27,true,NAVY);
 p.at(`${r.answered||0} of ${r.total||0} applicable questions  |  ${r.skippedByRouting||0} routed out  |  ${r.unanswered||0} unanswered`,M+18,p.y-41,8.6,false,MUTED);
 p.y-=70;
 p.lineText(`${criticalFlags} critical safeguards flagged   |   ${lowSections.length} very low-scoring sections   |   ${actions.length} improvement actions`,{size:8.8,after:4});
 const reasons=r.ragReasons||[];
 if(reasons.length)p.lineText('Rating limited by: '+reasons.join('; '),{size:8.7,bold:true,color:RAG.Amber,after:4});
 p.lineText(`${(r.dutyProcedureGaps||[]).length} section 5 procedure checks need confirmation (separate from advisory controls).`,{size:8.5,after:4});
 p.gap(5);
 p.subtitle('03  Immediate management attention');
 if(actions.length){
  const ordered=actions.slice().sort((a,z)=>Number(z.q?.critical==='Y')-Number(a.q?.critical==='Y'));
  for(const a of ordered.slice(0,3)){
    const text=`${a.q.id}  ${a.q.section}: ${a.finding}`;
    p.lineText(text,{size:9.1,after:4,leading:13});
  }
 }else p.lineText('No improvement actions were generated. Review the reliability of the answers.',{size:9.1});
 if((r.answerChecks||[]).length)p.lineText(`${r.answerChecks.length} answer combinations need checking. See page 2.`,{size:8.6,color:RAG.Amber,after:4});
 p.gap(8);smallRule(p);
 p.lineText('Readiness is a weighted self-assessment, not legal compliance or a prediction of an attack. Scope and duty-tier decisions must be confirmed separately. Improvement priority is not the same as a legal obligation.',{size:8.4,color:MUTED,leading:12});
 // Page two: clean section profile and concise supporting information.
 nextPage(p,'Readiness by topic');
 p.lineText('Scores show the distribution of recorded answers. A low advisory section is a preparedness gap, not automatically a statutory breach.',{size:8.9,color:MUTED,after:10});
 for(const section of sections){
   const v=section.max?100*section.earned/section.max:null;
   const clr=lowSections.includes(section.name)?RAG.Red:(v!==null&&v<50)?RAG.Amber:TEAL;
   p.bar(section.name+(lowSections.includes(section.name)?'  -  review needed':''),v,clr);
 }
 p.gap(11);
 p.subtitle('Answer summary');
 const counts={yes:0,partly:0,no:0,not_sure:0,na:0,missing:0};
 for(const row of rows){const a=row.answer||'missing';counts[a]=(counts[a]||0)+1;}
 p.lineText(`${counts.yes} Yes   |   ${counts.partly} Partly   |   ${counts.no} No   |   ${counts.not_sure} Not sure   |   ${counts.na} N/A`,{size:10,bold:true,after:4});
 p.gap(7);
 if((r.answerChecks||[]).length){
  p.subtitle('Answers to confirm');
  for(const item of (r.answerChecks||[]).slice(0,5)){
   const compact=item.replace(/\. Check whether Q5 should remain Yes and record what is missing\./,'. Check whether Q5 remains Yes.');
   p.lineText('- '+compact,{size:8.6,leading:12,after:4});
  }
  p.gap(5);
 }
 p.subtitle('Scope facts');
 p.lineText(`Premises use: ${b.activity||'Not specified'}    Expected peak: ${b.peak||'Not supplied'}    Public building: ${b.building||'Not sure'}`,{size:8.8,after:4});
 p.lineText(`Events: ${b.events||'Not sure'}    Event peak: ${b.eventPeak||'Not supplied'}    Next review: ${b.reviewDate||'Not set'}`,{size:8.8,after:5});
 p.gap(5);smallRule(p);
 p.lineText('Scoring version: '+(r.scoringVersion||'historical method')+'   |   Coverage: '+(r.coverage??'Not recorded')+'%',{size:8.1,color:MUTED,leading:11.5,after:2});
 p.lineText('Scoring: Yes = 2, Partly = 1, No/Not sure = 0, multiplied by question weights. Green 75%+, Amber 50%-74.99%, Red below 50%; fewer than 80% valid answers withholds a rating; other critical, unanswered or very low-section gaps can prevent Green. This is Premivue methodology, not an official statutory standard.',{size:8.4,color:MUTED,leading:12,after:3});
 p.lineText('SIA planning tools (10 Nov 2026): standard-tier planning tool / enhanced-tier template. Premivue does not complete or submit these official documents.',{size:8.0,color:MUTED,leading:11,after:3});
 p.lineText('Source: Home Office, Terrorism (Protection of Premises) Act 2025 statutory guidance (updated 25 August 2026). Verify current official guidance and scope before making compliance decisions.',{size:8.2,color:MUTED,leading:11.5,after:3});
 // Clear and succinct full action plan, not repeated in full question record.
 nextPage(p,'Prioritised action plan');
 p.lineText('Each action shows its readiness priority and legal/advisory basis. Validate applicability and record responsibility in the action tracker.',{size:9,color:MUTED,after:13});
 const mapTracker=new Map((Array.isArray(tracker)?tracker:[]).map(a=>[a.questionId,a]));
 if(!actions.length)p.lineText('No actions generated from the recorded answers.',{size:9.5});
 for(const a of actions){
   const basis=B?.classify?.(a.q.id,sc,b)||{label:'Preparedness',reference:''};
   const tr=mapTracker.get(a.q.id);
   const headline=`${a.q.id}  /  ${a.q.section}   -   ${a.priority.toUpperCase()}${(r.critical||[]).some(q=>q.id===a.q.id)||(r.criticalPartly||[]).some(q=>q.id===a.q.id)?'   /   CRITICAL':''}`;
   const recommendation=a.action||'Review the identified gap.';
   const label=`${basis.label}${tr?'   |   '+tr.status:''}`;
   const add=`${tr?'Owner: '+(tr.owner||'Unassigned')+'   |   Due: '+(tr.dueDate||'Not set'):''}`;
   const h=31+lineCount(recommendation,RIGHT-M-12,9.15,false)*13+lineCount(label,RIGHT-M-12,8.3,false)*11+(add?18:0);
   p.ensure(Math.max(58,h-6));
   p.rule(M,p.y+12,RIGHT-M,[.85,.89,.92]);
   p.at(headline,M,p.y,9.2,true,a.priority==='Immediate'?RAG.Red:a.priority==='High'?RAG.Amber:TEAL);p.y-=15;
   p.lineText(label,{size:8.1,color:MUTED,leading:10.8,after:2});
   p.lineText(recommendation,{size:9.15,leading:12.4,after:1});
   if(add)p.lineText(add,{size:8.2,color:MUTED,after:2});
   p.gap(4);
 }
 // Scope and legal disclaimers are presented once in the summary and scoring page.
 // Keep question-by-question content in the optional report, with a plain compact record.
 if(detailed){
   nextPage(p,'Appendix - all question responses');
   p.lineText('Detailed audit appendix. Original answers and assessor notes; recommendations are listed once in the preceding action plan.',{size:9,color:MUTED,after:11});
   for(const {q,answer} of rows){
     const head=`${q.id}   ${mapAnswer[answer]||'Unanswered'}   |   ${q.section}${(r.critical||[]).some(x=>x.id===q.id)||(r.criticalPartly||[]).some(x=>x.id===q.id)?'   |   Critical':''}`;
     const qtxt=q.text||'';
     const note=state.notes?.[q.id];
     const h=27+lineCount(qtxt,RIGHT-M-8,9.1,false)*13+(note?lineCount('Note: '+note,RIGHT-M-8,8.2,false)*11+5:0);
     p.ensure(h);
     p.rule(M,p.y+10,RIGHT-M,[.89,.91,.94]);
     p.at(head,M,p.y,9,true,answer==='no'||answer==='not_sure'?RAG.Red:answer==='partly'?RAG.Amber:INK);p.y-=15;
     p.lineText(qtxt,{size:9.1,leading:13,after:3});
     if(note)p.lineText('Note: '+note,{size:8.2,color:MUTED,leading:11,after:3});
     p.gap(5);
   }
   p.gap(6);
   p.subtitle('Recorded scope answers');
   for(const [name,val] of Object.entries(b)){
     if(!['name','site','assessor','date','activity','building','excluded','peak','events','eventPeak','publicAccess','entryChecks','eventExcluded','accessGeneral','shared','peakMethod','eventLocation','otherResponsible','reviewDate'].includes(name))continue;
     p.lineText(`${name}: ${val||'Not entered'}`,{size:8.8,after:1,leading:12});
   }
 }
 // Basic references appear once at end, no long repeated caveat page.
 if(detailed){p.gap(8);p.lineText('The detailed appendix records the answers entered at assessment time; it is not an independent verification of those answers.',{size:8.3,color:MUTED});}
 return p.save();
}
const api={generate};root.ReadinessPdf=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
