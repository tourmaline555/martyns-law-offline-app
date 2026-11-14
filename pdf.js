/* Dependency-free, wholly offline PDF generator. A4 pages, built-in Helvetica fonts. */
(function(root){
'use strict';
const W=595.28,H=841.89,M=43,RIGHT=W-M;
const INK=[0.094,0.169,0.243],MUTED=[0.376,0.455,0.529],NAVY=[0.063,0.137,0.231],TEAL=[0.086,0.647,0.545],MINT=[0.392,0.878,0.788];
const RAG={Green:[0.14,0.48,0.30],Amber:[0.65,0.39,0.09],Red:[0.70,0.21,0.17],Unrated:[0.40,0.45,0.49]};
// WinAnsi font encoding handles Western European accents accurately. For other scripts,
// rasterize only the affected line using the device's own fonts when Canvas is available.
const special={0x20ac:0x80,0x201a:0x82,0x0192:0x83,0x201e:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,0x02c6:0x88,0x2030:0x89,0x0160:0x8a,0x2039:0x8b,0x0152:0x8c,0x017d:0x8e,0x2018:0x91,0x2019:0x92,0x201c:0x93,0x201d:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02dc:0x98,0x2122:0x99,0x0161:0x9a,0x203a:0x9b,0x0153:0x9c,0x017e:0x9e,0x0178:0x9f};
function canWinAnsi(t){return [...String(t??'')].every(c=>{const x=c.codePointAt(0);return (x>=32&&x<=126)||(x>=160&&x<=255)||special[x]!==undefined||c==='\n'||c==='\t';});}
function safe(t){return [...String(t??'')].map(c=>{const x=c.codePointAt(0);if(c==='\n'||c==='\t')return ' ';if(x>=32&&x<=126||x>=160&&x<=255)return c;if(special[x]!==undefined)return String.fromCharCode(special[x]);return '?';}).join('');}
function pdfLiteral(s){return '('+safe(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')+')';}
const FONT_WIDTHS={regular:[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584],bold:[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]};
function estimate(s,size,bold=false){const w=FONT_WIDTHS[bold?'bold':'regular'];let n=0;for(const c of s){const code=c.charCodeAt(0)-32;n+=code>=0&&code<95?w[code]:600;}return n*size/1000;}
function wrap(text,width,size,bold=false){const lines=[];for(const paragraph of String(text??'').split(/\r?\n/)){if(!paragraph.trim()){lines.push('');continue;}let line='';for(let word of paragraph.split(/\s+/)){if(!word)continue;while(word && estimate(word,size,bold)>width){let n=Math.max(1,Math.floor(width/(size*.55)));while(n>1&&estimate(word.slice(0,n),size,bold)>width)n--;if(line){lines.push(line);line='';}lines.push(word.slice(0,n));word=word.slice(n);}if(!word)continue;const test=line?line+' '+word:word;if(estimate(test,size,bold)<=width)line=test;else{lines.push(line);line=word;}}if(line)lines.push(line);}return lines;}
function bytes(s){const arr=new Uint8Array(s.length);for(let i=0;i<s.length;i++)arr[i]=s.charCodeAt(i)&255;return arr;}
class Pdf {
 constructor(){this.pages=[];this.images=[];this.newPage();}
 fmt(n){return Number(n).toFixed(2).replace(/\.00$/,'');}
 color(v){return v.map(x=>this.fmt(x)).join(' ');}
 rect(x,y,w,h,fill){this.out(`${this.color(fill)} rg ${this.fmt(x)} ${this.fmt(y)} ${this.fmt(w)} ${this.fmt(h)} re f\n`);}
 rule(x,y,w,color=[.85,.89,.91]){this.out(`${this.color(color)} RG .6 w ${this.fmt(x)} ${this.fmt(y)} m ${this.fmt(x+w)} ${this.fmt(y)} l S\n`);}
 out(cmd){this.page.commands+=cmd;}
 at(text,x,y,size=10,bold=false,color=INK){if(!canWinAnsi(text)&&typeof document!=='undefined') {if(this.drawUnicode(text,x,y,size,bold,color))return;}this.out(`${this.color(color)} rg BT /${bold?'F2':'F1'} ${this.fmt(size)} Tf 1 0 0 1 ${this.fmt(x)} ${this.fmt(y)} Tm ${pdfLiteral(text)} Tj ET\n`);}
 drawUnicode(text,x,y,size,bold,color){
  try{
   const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');if(!ctx)return false;
   const factor=2.5, fontSize=Math.max(12,Math.round(size*factor));ctx.font=`${bold?'700':'400'} ${fontSize}px sans-serif`;
   const width=Math.min(2500,Math.ceil(ctx.measureText(String(text)).width)+12),height=Math.ceil(fontSize*1.6);
   canvas.width=width;canvas.height=height;ctx.fillStyle='white';ctx.fillRect(0,0,width,height);
   ctx.font=`${bold?'700':'400'} ${fontSize}px sans-serif`;ctx.fillStyle=`rgb(${color.map(c=>Math.round(c*255)).join(',')})`;ctx.textBaseline='alphabetic';ctx.fillText(String(text),4,fontSize*1.17);
   const jpg=canvas.toDataURL('image/jpeg',.94).split(',')[1],bin=typeof atob==='function'?atob(jpg):Buffer.from(jpg,'base64').toString('binary');
   const name='Im'+(this.images.length+1),pw=width/factor,ph=height/factor;
   this.images.push({name,width,height,bin,page:this.page.n});
   this.out(`q ${this.fmt(pw)} 0 0 ${this.fmt(ph)} ${this.fmt(x-1)} ${this.fmt(y-fontSize*.4/factor)} cm /${name} Do Q\n`);return true;
  }catch(e){return false;}
 }
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
 title(text){this.ensure(42);this.at(text,M,this.y,17,true,NAVY);this.y-=26;this.rule(M,this.y+5,W-2*M);this.y-=10;}
 subtitle(text){this.ensure(29);this.at(text,M,this.y,12,true,TEAL);this.y-=19;}
 lineText(text,{size=9.4,bold=false,color=INK,indent=0,after=5,leading=13.4,width=null}={}){
   const x=M+indent;const max=width??(RIGHT-x);
   const lines=wrap(text,max-9,size,bold);
   for(const ln of lines){this.ensure(leading+3);if(ln)this.at(ln,x,this.y,size,bold,color);this.y-=leading;}
   this.y-=after;
 }
 kv(label,value){this.lineText(`${label}  ${value||'-'}`,{size:9.5,after:3});}
 block(title,text){this.ensure(36);this.lineText(title,{size:10.1,bold:true,after:3});this.lineText(text,{size:9.2,color:INK,after:6});}
 bar(label,score,barColor=TEAL){this.ensure(37);this.at(label,M,this.y,10.7,true,INK);this.at(score===null?'-':`${Math.round(score)}%`,RIGHT-38,this.y,10.7,true,barColor);this.y-=12;this.rect(M,this.y-8,RIGHT-M,9,[.90,.94,.95]);if(score!==null)this.rect(M,this.y-8,(RIGHT-M)*Math.max(0,Math.min(100,score))/100,9,barColor);this.y-=24;}
 countBar(label,count,maximum,color=TEAL){this.ensure(31);this.at(label,M,this.y,9.5,true,INK);this.at(String(count),RIGHT-38,this.y,9.5,true,INK);this.y-=10;this.rect(M,this.y-7,RIGHT-M,8,[.90,.94,.95]);if(count>0 && maximum>0)this.rect(M,this.y-7,(RIGHT-M)*count/maximum,8,color);this.y-=20;}
 save(){
  this.pages.forEach((p,i)=>{p.commands+=`${this.color([.83,.87,.90])} RG .5 w ${M} 47 m ${RIGHT} 47 l S\n`;p.commands+=`${this.color(MUTED)} rg BT /F1 8 Tf 1 0 0 1 ${M} 33 Tm ${pdfLiteral('Premivue  |  Independent readiness assessment  |  Generated on device')} Tj ET\n`;p.commands+=`${this.color(MUTED)} rg BT /F1 8 Tf 1 0 0 1 ${RIGHT-50} 33 Tm ${pdfLiteral(`Page ${i+1} / ${this.pages.length}`)} Tj ET\n`;});
  const objects=[];
  function add(s){objects.push(s);return objects.length;}
  const catalog=add(''),pages=add(''),regular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const imrefs={};for(const im of this.images){imrefs[im.name]=add(`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes(im.bin).length} >>\nstream\n${im.bin}\nendstream`);}
  const refs=[];
  for(const p of this.pages){const resources=this.images.filter(im=>im.page===p.n).map(im=>`/${im.name} ${imrefs[im.name]} 0 R`).join(' ');const content=add(`<< /Length ${bytes(p.commands).length} >>\nstream\n${p.commands}endstream`);const page=add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> /XObject << ${resources} >> >> /Contents ${content} 0 R >>`);refs.push(`${page} 0 R`);}
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
const CURRENT_QUESTIONS=root.ASSESSMENT_QUESTIONS||(typeof require==='function'?require('./question-data.json'):[]);
const REPORT_REFRESH=new Set(['Q8','Q25','Q30','Q34']);
// These are report-only next steps, not new statutory requirements or changes to the assessment.
// Tier-specific text from the scoring engine takes precedence for Q5, Q24, Q25, Q31, Q35 and events.
const PRACTICAL_ACTION={
 Q9:'Brief relevant staff on lockdown decisions, areas and responsibilities. Check their understanding with a short scenario.',
 Q10:'Agree when invacuation is safer than evacuation, identify suitable internal areas and brief the staff who would guide people.',
 Q11:'Identify who controls entry and exit during a threat and rehearse safe activation without blocking emergency escape.',
 Q13:'Choose a backup warning method, assign who activates it and check that relevant staff can use it if the main system fails.',
 Q14:'Identify staff who need incident-response training, arrange a suitable briefing and record when it was completed.',
 Q15:'Use realistic examples to brief staff on suspicious behaviour, including who to contact about concerns.',
 Q16:'Confirm the person or channel for raising a concern, make it easy to find and check staff understand the route.',
 Q17:'Plan a proportionate scenario review or drill, record what worked and assign improvements for anything that did not.',
 Q18:'Name an incident lead and deputy, clarify their decisions and brief staff on who takes charge.',
 Q20:'Explain when staff should report an unknown person rather than challenge them, and rehearse the safe reporting route.',
 Q21:'Review how staff, visitors and contractors gain access; identify weaknesses and agree proportionate controls.',
 Q22:'Review visitor arrangements, including suitable sign-in and supervision, without creating unsafe delays during an emergency.',
 Q23:'Review peak-time movement and crowd-flow risks; agree who monitors busy areas and how concerns are escalated.',
 Q26:'Provide a straightforward route for reporting suspicious activity, tell staff where to use it and check it works.',
 Q27:'Set out who reviews incoming concerns, how urgent matters are escalated and how follow-up is recorded.',
 Q28:'Confirm who may send incident alerts, which channels reach different areas and how message clarity is checked.',
 Q29:'Use a simple incident and near-miss log; assign someone to review patterns and agreed actions.',
 Q32:'Check which protective procedures were actually tested; arrange a proportionate exercise or review and record improvements.',
 Q33:'Record relevant briefings, exercises, reviews and key decisions in a dated log that an authorised manager can find.',
 Q36:'Brief each relevant role on actions during an incident and check understanding through a short scenario.',
 Q37:'Identify external contacts relevant to the site, decide when to notify them and keep details current.',
 Q38:'Agree responsibility boundaries with other site users and record arrangements for shared incidents.',
 Q40:'Assign event roles, incident decision-makers and deputies; brief them before events take place.',
 Q41:'Check how entry arrangements work for each event and how protective instructions will reach entrants safely.',
 Q42:'Review each event against expected attendance, venue layout and protective procedures; record required adjustments.'
};
const SHORT_ACTION={
 Q5:'Confirm appropriate evacuation, invacuation, lockdown and communication procedures, and who implements each.',
 Q8:'Confirm lockdown activation responsibilities, warnings and safe implementation; rehearse the response.',
 Q31:'Make procedures accessible and appropriately documented for the confirmed duty tier.',
 Q13:'Agree and test a backup communication method if the primary system fails.',
 Q7:'Review proportionate missing-person arrangements without delaying safe evacuation.',
 Q25:'Record relevant vulnerabilities, then assign proportionate improvements and review dates.'
};
function adviceFor(a){
 const fallback=a.action||'Review the identified gap and assign a suitable next action.';
 if(a.answer==='not_sure')return 'Confirm whether this arrangement exists and works in practice. '+(PRACTICAL_ACTION[a.q?.id]||fallback);
 if(!['no','partly'].includes(a.answer))return fallback;
 const q=CURRENT_QUESTIONS.find(x=>x.id===a.q?.id);
 if(REPORT_REFRESH.has(a.q?.id))return q?.[a.answer==='no'?'actionNo':'actionPartly']||fallback;
 if(['Q5','Q24','Q25','Q31','Q35','Q39','Q41','Q42'].includes(a.q?.id)){
   if(a.q?.id==='Q31')return a.answer==='no'?'Draft clear, accessible procedures and check what documentation is appropriate for the confirmed duty tier.':'Review existing procedures for missing steps, accessibility and any tier-specific documentation requirements.';
   if(a.q?.id==='Q35')return 'Confirm a preparedness lead and their responsibilities. A statutory senior-individual designation applies only where the enhanced-tier/event conditions are met.';
   if(['Q24','Q39','Q41','Q42'].includes(a.q?.id)){
     const detail={Q24:'Review existing barriers and access measures, identify proportionate improvements and check safe escape arrangements.',Q39:'Brief event staff on the relevant protective procedures and check their suitability for event layouts and operating hours.',Q41:PRACTICAL_ACTION.Q41,Q42:PRACTICAL_ACTION.Q42}[a.q.id];
     const tierNote=fallback.includes('Check scope first.')?fallback.slice(fallback.indexOf('Check scope first.')):
       fallback.includes('Event scope has not been confirmed.')?fallback.slice(fallback.indexOf('Event scope has not been confirmed.')):'';
     return detail+(tierNote?' '+tierNote:'');
   }
   return fallback;
 }
 return PRACTICAL_ACTION[a.q?.id]||fallback;
}
function legalBasisFor(a,scope,business){
 const label=(B?.classify?.(a.q.id,scope,business)||{label:'Preparedness'}).label;
 return label==='Linked to legal duty'?'Statutory-duty-linked (scope and commencement apply)':label;
}
function ukDate(s){
 const isoDate=String(s||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(isoDate))return '';
 const [y,m,d]=isoDate.split('-');return `${Number(d)} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m)-1]} ${y}`;
}
const mapAnswer={yes:'Yes',partly:'Partly',no:'No',not_sure:'Not sure',na:'N/A'};
const priorityColours={Immediate:RAG.Red,High:RAG.Amber,Medium:TEAL,Low:MUTED};
function pct(score){return score===null||!Number.isFinite(score)?'Not rated':Math.round(score)+'%';}
function lineCount(str,w,size,bold){return wrap(str,w,size,bold).length;}
function smallRule(p){p.rule(M,p.y+7,RIGHT-M,[.86,.9,.92]);p.y-=8;}
function nextPage(p,title){p.newPage();p.title(title);}
function readableScopeStatus(s){return (s||'Review required').replace(' - conflicting scope answers',' - check answers');}
function generate(state,result,tracker=[],options={}){
 const p=new Pdf(),r=result||{},b=state.business||{},detailed=!!options.detailed;
 const historical=!!options.historical, generatedAt=options.generatedAt||new Date().toISOString(),I=root.PremivueIntegrity;
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
 p.lineText(`Assessor: ${b.assessor||'Not supplied'}   |   ${status}`,{size:8.4,color:MUTED,after:3});
 p.lineText(`Report generated: ${generatedAt.slice(0,10)}   |   Assessment: ${b.date||'Not recorded'}   |   Scoring: ${r.scoringVersion||'legacy'}`,{size:8.0,color:MUTED,after:3});
 if(state._audit?.importValidation==='legacy')p.lineText('LEGACY / UNVERIFIED IMPORT: recorded score not independently recalculated.',{size:8.6,color:RAG.Amber,bold:true,after:4});
 if(b.date&&generatedAt.slice(0,10)>b.date)p.lineText('Retrospective report: guidance references reflect report generation, not necessarily the assessment date.',{size:8.3,color:MUTED,after:3});
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
 p.lineText('Duty tier is indicative. Confirm whether statutory duties were in force on the assessment date before treating them as obligations.',{size:8,color:MUTED,leading:11,after:2});
 if(scopeReview){
   p.lineText('SCOPE NEEDS REVIEW BEFORE RELYING ON ANY LEGAL TIER',{size:9.5,bold:true,color:RAG.Red,after:3});
   if((sc.reasons||[]).length)p.lineText('Check: '+sc.reasons[0],{size:8.6,color:INK,leading:12,after:4});
 }
 p.gap(6);
 p.subtitle('02  Readiness score');
 const rag=r.provisional?'Unrated':(r.rag||'Unrated'),score=pct(r.provisional?null:r.score),c=RAG[rag]||MUTED;
 p.rect(M,p.y-58,RIGHT-M,65,[.95,.97,.98]);p.rect(M,p.y-58,4,65,c);
 p.at(rag.toUpperCase(),M+18,p.y-15,16,true,c);p.at(score,RIGHT-110,p.y-24,27,true,NAVY);
 p.at(`${r.answered||0} of ${r.total||0} applicable questions  |  ${r.skippedByRouting||0} routed out  |  ${r.unanswered||0} unanswered`,M+18,p.y-41,8.6,false,MUTED);
 p.y-=70;
 p.lineText(`${criticalFlags} critical safeguards flagged${criticalFlags?' ('+[...(r.critical||[]),...(r.criticalPartly||[])].map(q=>q.id).join(', ')+')':''}   |   ${lowSections.length} very low-scoring sections   |   ${actions.length} actions`,{size:9.1,after:5});
 const reasons=r.ragReasons||[];
 if(reasons.length)p.lineText('Rating limited by: '+reasons.join('; '),{size:8.7,bold:true,color:RAG.Amber,after:4});
 p.lineText(`${(r.dutyProcedureGaps||[]).length} section 5 procedure checks need confirmation${(r.dutyProcedureGaps||[]).length?': '+(r.dutyProcedureGaps||[]).map(id=>id+' '+({Q5:'overall procedures',Q6:'evacuation',Q8:'lockdown',Q10:'invacuation',Q11:'access control',Q12:'communication'}[id]||'procedure')).join('; '):''}.`,{size:8.9,leading:12.5,after:5});
 p.gap(5);
 p.subtitle('03  Recommended management actions');
 if(actions.length){
  const ordered=actions.slice(); // effective, tier-specific urgency already determined by the scoring engine
  for(const a of ordered.slice(0,3)){
    const line=SHORT_ACTION[a.q.id]||adviceFor(a);
    p.lineText(`${a.q.id}  |  ${a.priority.toUpperCase()}  |  ${a.q.section}`,{size:10.0,bold:true,color:a.priority==='Immediate'?RAG.Red:a.priority==='High'?RAG.Amber:TEAL,after:1,leading:13});
    p.lineText(line,{size:10.0,leading:13.5,after:6,indent:6});
  }
 }else p.lineText('No improvement actions were generated. Review the reliability of the answers.',{size:9.1});
 if((r.answerChecks||[]).length)p.lineText(`${r.answerChecks.length} answer combinations need checking. See page 2.`,{size:8.6,color:RAG.Amber,after:4});
 if(typeof options.comparison==='number')p.lineText(`Change since previous comparable assessment: ${options.comparison>0?'+':''}${options.comparison.toFixed(1)} percentage points.`,{size:8.7,bold:true,color:TEAL,after:3});
 p.gap(8);smallRule(p);
 p.lineText('Readiness is a self-assessment, not a compliance certificate. Statutory-duty-linked actions depend on confirmed scope and commencement; High priority is not the same as a legal breach.',{size:8.9,color:MUTED,leading:12.5});
 // Page two: clean section profile and concise supporting information.
 nextPage(p,'Readiness by topic');
 p.lineText('Scores reflect recorded answers. Advisory weaknesses are not automatically statutory breaches.',{size:9.6,color:MUTED,after:11,leading:13.5});
 for(const section of sections){
   const v=section.max?100*section.earned/section.max:null;
   const clr=lowSections.includes(section.name)?RAG.Red:(v!==null&&v<50)?RAG.Amber:TEAL;
   p.bar(section.name+(lowSections.includes(section.name)?'  -  review needed':''),v,clr);
 }
 const weak=sections.filter(s=>s.max&&100*s.earned/s.max<=50).sort((a,b)=>a.earned/a.max-b.earned/b.max).slice(0,3);
 if(weak.length){
   p.gap(6);p.subtitle('Areas requiring attention');
   p.lineText(weak.map(s=>`${s.name} ${Math.round(s.earned/s.max*100)}%`).join('   |   '),{size:10.0,bold:true,color:RAG.Amber,leading:13.8,after:5});
 }
 p.gap(6);
 p.subtitle('Answer summary');
 const counts={yes:0,partly:0,no:0,not_sure:0,na:0,missing:0};
 for(const row of rows){const a=row.answer||'missing';counts[a]=(counts[a]||0)+1;}
 p.lineText(`${counts.yes} Yes   |   ${counts.partly} Partly   |   ${counts.no} No   |   ${counts.not_sure} Not sure   |   ${counts.na} N/A`,{size:10.4,bold:true,after:4});
 p.gap(7);
 if((r.answerChecks||[]).length){
  p.subtitle('Answers to confirm');
  for(const item of (r.answerChecks||[]).slice(0,detailed?3:2)){
   const compact=item.replace(/\. Check whether Q5 should remain Yes and record what is missing\./,'. Check whether Q5 remains Yes.');
   p.lineText('- '+compact,{size:9.1,leading:13,after:4});
  }
  if((r.answerChecks||[]).length>(detailed?3:2))p.lineText(`Plus ${(r.answerChecks||[]).length-(detailed?3:2)} further checks in the app.`,{size:8.6,color:MUTED,after:3});
  p.gap(5);
 }
 p.subtitle('Scope facts');
 p.lineText(`Premises use: ${b.activity||'Not specified'}    Expected peak: ${b.peak||'Not supplied'}    Public building: ${b.building||'Not sure'}`,{size:9.4,after:4});
 p.lineText(`Events: ${b.events||'Not sure'}    Event peak: ${b.eventPeak||'Not supplied'}    Next review: ${b.reviewDate||'Not set'}`,{size:9.4,after:5});
 p.gap(5);smallRule(p);
 p.lineText('Scoring version: '+(r.scoringVersion||'historical method')+'   |   Coverage: '+(r.coverage??'Not recorded')+'%',{size:8.1,color:MUTED,leading:11.5,after:2});
 p.lineText('Scoring: Yes = 2, Partly = 1, No/Not sure = 0, multiplied by question weights. Green 75%+, Amber 50%-74.99%, Red below 50%; any unanswered or unjustified N/A item withholds a rating; critical or very low-section gaps may prevent Green. This is Premivue methodology, not an official statutory standard.',{size:8.4,color:MUTED,leading:12,after:3});
 p.lineText(`Regulatory references are current to report generation (${generatedAt.slice(0,10)}), not retrospectively applicable to the assessment. SIA planning tools (10 Nov 2026): standard-tier planning tool / enhanced-tier template. Premivue does not complete or submit these official documents.`,{size:8.0,color:MUTED,leading:11,after:3});
 p.lineText('Source: Home Office, Terrorism (Protection of Premises) Act 2025 statutory guidance (updated 25 August 2026). Verify current official guidance and scope before making compliance decisions.',{size:8.2,color:MUTED,leading:11.5,after:3});
 // Clear and succinct full action plan, not repeated in full question record.
 nextPage(p,'Prioritised action plan');
 p.lineText(historical?
   'Statuses reflect dated information at the assessment date; where unknown they are marked Not recorded. Owners and due dates appear only when known.':
   'Actions are prioritised by preparedness urgency; legal and advisory labels are separate. Current tracker information is dated when available.',
   {size:detailed?9.2:8.8,color:MUTED,leading:detailed?13.2:12.1,after:detailed?8:4});
 p.lineText('Assign an owner and target date to each outstanding action. Current wording is used; historic answers and logs are unchanged.',{size:detailed?9.0:8.8,color:MUTED,leading:detailed?13:12,after:detailed?9:4});
 const mapTracker=new Map((Array.isArray(tracker)?tracker:[]).map(a=>[a.questionId,a]));
 if(!actions.length)p.lineText('No actions generated from the recorded answers.',{size:9.5});
 const displayed=detailed?actions:actions.slice(0,8);
 let previousGroup='';
 for(const a of displayed){
   const group=a.priority==='Immediate'?'Immediate priority':a.priority==='High'?'High priority':a.priority==='Medium'?'Medium priority':'Low priority';
   if(group!==previousGroup){p.ensure(34);p.gap(previousGroup?(detailed?9:5):(detailed?4:1));p.subtitle(group+` - ${displayed.filter(x=>(x.priority==='Immediate'?'Immediate priority':x.priority==='High'?'High priority':x.priority==='Medium'?'Medium priority':'Low priority')===group).length} ${detailed?'actions':'shown'}`);previousGroup=group;} 
   const basis={label:legalBasisFor(a,sc,b)};
   const tr=mapTracker.get(a.q.id);
   const headline=`${a.q.id}  /  ${a.q.section}   -   ${a.priority.toUpperCase()}${(r.critical||[]).some(q=>q.id===a.q.id)||(r.criticalPartly||[]).some(q=>q.id===a.q.id)?'   /   CRITICAL':''}`;
   const recommendation=adviceFor(a);
   const statusAt=historical&&tr&&I?.stateAt?I.stateAt(tr,options.actionEvents||[],b.date):null;
   let label=basis.label,metadata='';
   if(historical){
      if(statusAt?.recorded){
         label+='  |  '+statusAt.status+' ('+(statusAt.raisedAt?.slice(0,10)===statusAt.at?.slice(0,10)?'raised ':'recorded ')+ukDate(statusAt.at)+')';
         const info=[];
         if(statusAt.raisedAt&&statusAt.raisedAt.slice(0,10)!==statusAt.at.slice(0,10))info.push('Raised '+ukDate(statusAt.raisedAt));
         if(statusAt.owner)info.push('Owner: '+statusAt.owner);
         if(statusAt.dueDate)info.push('Due: '+ukDate(statusAt.dueDate));
         metadata=info.join('   |   ');
      }else label+='  |  Status: Not recorded';
   }else if(tr){
      label+='  |  '+tr.status;
      const info=[];
      if(tr.owner)info.push('Owner: '+tr.owner);
      if(tr.dueDate)info.push('Due: '+ukDate(tr.dueDate));
      if(tr.completedAt)info.push('Completed: '+ukDate(tr.completedAt));
      info.push('Tracker updated: '+ukDate(tr.updatedAt||generatedAt));
      metadata=info.join('   |   ');
   }
   const closure=tr?.status==='Completed'&&!historical&&tr.note?'Closure: '+tr.note:'';
   const bodySize=detailed?10.0:9.55,bodyLeading=detailed?14:12.7,labelSize=detailed?8.9:8.5,labelLeading=detailed?12:10.9;
   const height=(detailed?36:29)+lineCount(recommendation,RIGHT-M-14,bodySize,false)*bodyLeading+
      lineCount(label,RIGHT-M-14,labelSize,false)*labelLeading+
      (metadata?lineCount(metadata,RIGHT-M-14,8.6,false)*12:0)+
      (closure?lineCount(closure,RIGHT-M-14,8.6,false)*12:0);
   p.ensure(Math.max(48,height));
   p.rule(M,p.y+12,RIGHT-M,[.85,.89,.92]);
   p.at(headline,M,p.y,detailed?10.0:9.6,true,a.priority==='Immediate'?RAG.Red:a.priority==='High'?RAG.Amber:TEAL);p.y-=15;
   p.lineText(label,{size:labelSize,color:MUTED,leading:labelLeading,after:detailed?2:1});
   p.lineText(recommendation,{size:bodySize,leading:bodyLeading,after:detailed?2:1});
   if(metadata)p.lineText(metadata,{size:8.6,color:MUTED,leading:12,after:1});
   if(closure)p.lineText(closure,{size:8.6,color:MUTED,leading:12,after:1});
   p.gap(detailed?7:2);
 }
 if(!detailed&&actions.length>8){p.gap(9);p.lineText(`${actions.length-8} further actions are in the full assessment appendix and action tracker.`,{size:9,bold:true,color:TEAL,after:3});}
 // Scope and legal disclaimers are presented once in the summary and scoring page.
 // Keep question-by-question content in the optional report, with a plain compact record.
 if(detailed){
   if(p.y>H-290){p.gap(10);p.title('Appendix - all question responses');}
   else nextPage(p,'Appendix - all question responses');
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
   const labels={name:'Organisation',site:'Premises and address',assessor:'Assessor',date:'Assessment date',activity:'Premises use',building:'Publicly accessible building',excluded:'Premises statutory exclusion',peak:'Expected peak attendance',events:'Events/out-of-hours use',eventPeak:'Expected event attendance',publicAccess:'Event public access',entryChecks:'Event qualifying admission checks',eventExcluded:'Event exclusion',accessGeneral:'Event access arrangements',shared:'Shared premises',peakMethod:'Attendance estimate basis',eventLocation:'Event location',otherResponsible:'Other responsible persons',reviewDate:'Next review date'};
   const translations={at_site:'At these premises',separate:'Separate location',both:'Both these premises and elsewhere',unknown:'Not sure',yes:'Yes',no:'No',partly:'Partly',not_sure:'Not sure'};
   for(const [name,val] of Object.entries(b)){
     if(!['name','site','assessor','date','activity','building','excluded','peak','events','eventPeak','publicAccess','entryChecks','eventExcluded','accessGeneral','shared','peakMethod','eventLocation','otherResponsible','reviewDate'].includes(name))continue;
     p.lineText(`${labels[name]||name}: ${translations[val]||val||'Not entered'}`,{size:8.8,after:1,leading:12});
   }
 }
 // Basic references appear once at end, no long repeated caveat page.
 if(detailed){p.gap(8);p.lineText('The detailed appendix records the answers entered at assessment time; it is not an independent verification of those answers.',{size:8.3,color:MUTED});}
 return p.save();
}
const api={generate};root.ReadinessPdf=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
