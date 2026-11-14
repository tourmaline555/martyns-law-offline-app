/* Premivue v4.3: wholly offline, assessment-led public protection policy builder.
   This module deliberately NEVER invents site routes, control locations, personnel, or approval.
   Original language informed by official Home Office/SIA guidance. NEBOSH workbook consulted
   for planning topics only; no proprietary workbook text is reproduced or bundled. */
(function(root){
'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FIELDS=[
 ['lead','Responsible person / policy owner','Named person or role accountable for these premises','Governance'],
 ['deputy','Incident decision-maker and deputy','Who takes decisions when the lead is unavailable?','Governance'],
 ['roles','On-duty responsibilities','Which roles warn others, manage movement and call emergency services?','Governance'],
 ['access','People needing additional assistance','How will staff assist people with mobility, communication or other access needs?','Governance'],
 ['evacTriggers','Evacuation decision and triggers','Who decides evacuation is safer, and what information informs that decision?','Evacuation'],
 ['evacRoutes','Safe evacuation arrangements','Site-specific exits, alternative routes, staff direction and how to avoid danger','Evacuation'],
 ['invaTriggers','Invacuation decision and triggers','When would moving to a safer internal area be appropriate?','Invacuation'],
 ['invaAreas','Safer internal areas and support','Identify suitable spaces and any limits; include accessibility considerations','Invacuation'],
 ['lockTriggers','Lockdown activation and authority','Who may activate lockdown and how are they instructed?','Lockdown'],
 ['lockControls','Safe lockdown arrangements','Which areas can be secured, how and by whom, while preserving fire safety and escape?','Lockdown'],
 ['alertMethod','Primary warning and instructions','How do staff and other people on site receive clear protective instructions?','Communications'],
 ['backupMethod','Communications fallback','What works if the main method fails? If absent, state not established','Communications'],
 ['emergencyContact','Emergency services and all-clear','Who contacts 999, relays information and authorises a safe stand-down?','Communications'],
 ['staffPractice','Staff briefings and exercises','Who receives briefings, how procedures are rehearsed, and how lessons are captured','Review'],
 ['reviewOwner','Review and change control','Who will review it and on what triggers or review interval?','Review'],
 ['liaison','Other responsible persons / shared site coordination','How are joint arrangements agreed, if there are others?','Review'],
 ['enhancedMonitoring','Enhanced-tier monitoring and movement','Describe relevant monitoring and people-movement measures, or state not established','Enhanced measures'],
 ['enhancedSecurity','Enhanced-tier physical and information protection','Describe justified security measures and controls over sensitive site information','Enhanced measures'],
 ['enhancedAssessment','Enhanced-tier vulnerability and effectiveness assessment','Record vulnerabilities, how proposed measures reduce them, and reasonably practicable considerations','Enhanced measures'],
 ];
const essential=new Set(['lead','deputy','evacTriggers','evacRoutes','invaTriggers','invaAreas','lockTriggers','lockControls','alertMethod','backupMethod','emergencyContact','reviewOwner']);
const official={
 home:'https://www.gov.uk/government/publications/the-terrorism-protection-of-premises-act-2025',
 sia:'https://www.gov.uk/guidance/understanding-martyns-law-and-the-sias-role-as-regulator#preparing-for-martyns-law',
 standard:'https://www.gov.uk/government/publications/martyns-law-standard-tier-planning-tool',
 enhanced:'https://www.gov.uk/government/publications/martyns-law-enhanced-tier-template'
};
function isEnhanced(result){return result?.scope?.premises==='Enhanced tier'||String(result?.scope?.event||'').includes('Potential qualifying event');}
function requiredIds(result){return FIELDS.filter(([id])=>!id.startsWith('enhanced')||isEnhanced(result)).map(([id])=>id);}
function missing(details,result){return requiredIds(result).filter(id=>essential.has(id)||id.startsWith('enhanced')).filter(id=>!String(details?.[id]||'').trim());}
function answerStatus(state,id){const v=state?.answers?.[id];return ({yes:'Reported in place (self-assessed)',partly:'Partly in place — needs improvement',no:'Not in place on the assessment',not_sure:'Not verified',na:'Not applicable — verify reason'})[v]||'Not assessed';}
function instruction(v,prompt){return String(v||'').trim()?{text:String(v).trim(),unconfirmed:false}:{text:'NOT YET CONFIRMED — '+prompt,unconfirmed:true};}
function build(state,result,details={}){
 const b=state?.business||{}, sc=result?.scope||{}, enhanced=isEnhanced(result);
 const date=(new Date()).toISOString().slice(0,10);
 const sections=[];
 function section(title,items){sections.push({title,items});}
 const p=(label,value)=>({label,text:value,unconfirmed:false});
 const f=(label,id,prompt)=>({label,...instruction(details[id],prompt)});
 const claim=(id,label)=>p(label,`Premivue response ${id}: ${answerStatus(state,id)}. This is self-reported and does not independently verify the procedure.`);
 section('1. Policy statement and applicability',[
  p('Commitment',`${b.name||'The organisation'} aims to reduce the risk of physical harm to people if a terrorist attack occurs at or near its premises. This document sets out proposed arrangements for safe decision-making and response, including evacuation, invacuation, lockdown and communication. The responsible person must ensure that adopted procedures are appropriate and reasonably practicable in the actual circumstances.`),
  p('Premises and use',`${b.site||'Premises not provided'}; reported use: ${b.activity||'not confirmed'}. Peak simultaneous attendance: ${b.peak||'not confirmed'} including relevant staff. Basis: ${b.peakMethod||'not recorded'}.`),
  p('Indicative legal scope',`Premises: ${sc.premises||'Unconfirmed'}. Events: ${sc.event||'Unconfirmed'}. This is not a legal determination and statutory duties depend on scope and commencement.`),
  p('Document status','DRAFT FOR REVIEW — not a verified or approved operating procedure. Any entry headed NOT YET CONFIRMED must be completed before approval.')
 ]);
 section('2. Governance, command and support',[
  f('Responsible person / document owner','lead','identify the responsible person or accountable role'),
  f('Decision-maker and deputy','deputy','assign incident authority and deputy cover'),
  f('On-duty responsibilities','roles','describe staff roles for public protection and emergency-services contact'),
  f('Accessibility and assistance','access','describe proportionate assistance for individuals with access and communication needs'),
  p('Practical principle','Staff must be able to understand who decides the safest response for the circumstances; avoid fixed rules requiring everyone to evacuate, assemble or lock down in every scenario.')
 ]);
 section('3. Evacuation — leaving danger',[
  claim('Q6','Assessment finding'),
  f('Who decides and when','evacTriggers','identify triggers and authority to direct evacuation when safer than staying'),
  f('How people move safely','evacRoutes','record verified routes, alternatives, directions, support and how to avoid moving towards danger'),
  p('Safety check','Routes, assembly choices and directions must be checked against actual site conditions, incident location, emergency-services advice, fire precautions and the needs of people present.')
 ]);
 section('4. Invacuation — moving away from danger indoors',[
  claim('Q10','Assessment finding'),
  f('Decision and activation','invaTriggers','identify scenarios and who can order movement to safer internal areas'),
  f('Suitable areas and assistance','invaAreas','verify which internal areas are safer, how to reach them and their limitations'),
  p('Safety check','Internal spaces must be assessed for suitability; do not identify an area as protective until checked for the actual risks and accessibility needs.')
 ]);
 section('5. Lockdown — restricting access when safer',[
  claim('Q8','Assessment finding'),claim('Q11','Related entry/exit-control finding'),
  f('When and who can initiate','lockTriggers','identify authorised decisions, notification and deputy cover'),
  f('Safe and practical controls','lockControls','verify how areas are secured, who operates controls and how emergency/fire escape remains safe'),
  p('Safety check','Do not lock people into danger or compromise fire evacuation routes. The response must remain proportionate to the situation and coordinated with emergency-services advice.')
 ]);
 section('6. Communication and emergency coordination',[
  claim('Q12','Warning and instruction finding'),claim('Q13','Backup communication finding'),
  f('Primary warnings','alertMethod','identify working methods to alert staff, public, contractors and people needing assistance'),
  f('Fallback if primary method fails','backupMethod','name a tested alternative or explicitly state not established'),
  f('Emergency contact and all-clear','emergencyContact','identify who calls 999, relays facts and coordinates any safe all-clear'),
  p('Practical principle','Messages should be understandable, prompt, consistent with the protective action and suitable for different access and language needs where relevant.')
 ]);
 section('7. Staff readiness, exercises and revision',[
  claim('Q14','Training/briefing assessment'),claim('Q17','Drills assessment'),claim('Q32','Testing and review assessment'),
  f('Staff practice and feedback','staffPractice','describe how relevant staff will be briefed, exercises organised and actions reviewed'),
  f('Review responsibility and triggers','reviewOwner','name an owner, review cycle and circumstances prompting earlier review'),
  f('Shared-site arrangements','liaison','if relevant identify co-ordinated responsibilities; otherwise record not applicable'),
  p('Review due',b.reviewDate||'To be agreed and recorded before approval')
 ]);
 if(enhanced)section('8. Additional enhanced-tier measures — further work required',[
   p('Legal status','Enhanced-tier premises and qualifying events require additional proportionate public protection measures and section 7 documentation when the relevant duties are in force. This working policy is NOT a completed SIA enhanced-tier submission.'),
   f('Monitoring and movement','enhancedMonitoring','describe monitoring and movement controls justified for these premises'),
   f('Physical security and information security','enhancedSecurity','describe physical measures and protection of site-sensitive information'),
   f('Assessment of vulnerabilities and effectiveness','enhancedAssessment','record potential vulnerabilities, measures, their expected risk reduction and reasoned practicability'),
   p('Formal verification','Confirm the senior-individual designation where applicable, co-ordination, SIA notification and the official enhanced-tier section 7 document separately.')
 ]);
 const low=(result?.actions||[]).filter(a=>['Q5','Q6','Q8','Q10','Q11','Q12','Q13','Q14','Q17','Q32'].includes(a.q?.id)).slice(0,8);
 section(`${sections.length+1}. Assessed gaps and items to verify`,[
  p('Implementation review',low.length?'Prioritise these assessed procedure gaps; completing this draft alone does not close them.':'No gaps in the selected core procedure questions were reported. Still confirm the accuracy and practicability of every procedure before approval.'),
  ...low.map(a=>p(`${a.q.id} (${a.priority||'Review'})`,`${a.action||a.finding||'Check the related assessment and verify arrangements.'} — Status at assessment: ${answerStatus(state,a.q.id)}.`))
 ]);
 section(`${sections.length+1}. Approval, version control and record location`,[
  p('Version','Draft 0.1 — not approved'),
  f('Accountable signatory','lead','name the person who will review and formally approve the policy'),
  p('Approval status','NOT APPROVED. Enter approval date, document reference, relevant staff briefing record and location of controlled copy after competent site-specific review.'),
  p('Next planned review',b.reviewDate||'Not yet set'),
  p('Security of document','Restrict access to any sensitive operational detail, contact information, security layouts, vulnerabilities or access arrangements included in the final document.')
 ]);
 section(`${sections.length+1}. Official guidance and document status`,[
  p('Legal framework','Terrorism (Protection of Premises) Act 2025; Home Office statutory guidance (updated 25 August 2026); SIA Preparing for Martyn’s Law guidance (July 2026).'),
  p('Standard tier','SIA standard-tier planning tool, updated 10 November 2026. It supports procedure planning and is not submitted to the SIA as a routine requirement.'),
  p('Enhanced tier','SIA enhanced-tier template, updated 10 November 2026. This Premivue draft is not the official section 7 compliance document and does not file or submit it.'),
  p('Notes','NEBOSH training-course framework used only as conceptual background; no copyrighted material has been copied.'),
  p('Official URLs',`${official.sia}\n${official.home}\n${official.standard}\n${official.enhanced}`)
 ]);
 const gaps=missing(details,result);
 return {title:'Public Protection Policy and Procedures',site:b.site||'Site not entered',organisation:b.name||'Organisation not entered',assessor:b.assessor||'',date:b.date||'',created:date,version:'Draft 0.1',scope:sc.premises||'Review required',enhanced,sections,missing:gaps,unconfirmed:sections.flatMap(s=>s.items).filter(x=>x.unconfirmed).length};
}
function html(model){
 const styles=`body{font:15px/1.54 Arial,sans-serif;max-width:800px;margin:34px auto;padding:0 22px;color:#203249}h1,h2{color:#153755}h1{font-size:29px;border-bottom:4px solid #16a58b;padding-bottom:12px}h2{font-size:20px;margin:27px 0 12px;break-after:avoid}p{margin:9px 0 13px;white-space:pre-line}.mark{background:#fff3d9;border-left:4px solid #c88622;padding:13px 15px;margin:16px 0}.unconfirmed{background:#fff8ee;border-left:3px solid #db943a;padding:8px 12px}.item{break-inside:avoid;margin:13px 0}.item strong{display:block;color:#164660}.meta{font-size:12px;color:#527083}.brand{letter-spacing:.15em;color:#0b856f;font-weight:800;font-size:13px}.small{font-size:12px;color:#587081}footer{border-top:1px solid #dce7e9;margin-top:25px;padding:14px 0}button{background:#10233b;color:white;border:0;padding:12px;border-radius:8px;cursor:pointer}@media print{@page{size:A4;margin:18mm}body{max-width:none;margin:0;padding:0;font-size:11.5pt}h2{break-after:avoid}.item{break-inside:avoid}.noprint{display:none}}`;
 return `<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Premivue draft policy - ${E(model.organisation)}</title><style>${styles}</style><div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div><div class="brand">PREMIVUE | MARTYN'S LAW READINESS &amp; ASSURANCE</div><h1>${E(model.title)}</h1><p class="meta"><strong>${E(model.organisation)}</strong> — ${E(model.site)}<br>Assessment: ${E(model.date)} · Draft generated: ${E(model.created)} · ${E(model.version)} · Indicative tier: ${E(model.scope)}</p><div class="mark"><strong>DRAFT — NOT AN APPROVED POLICY OR COMPLIANCE CERTIFICATE.</strong> This text is based on self-reported answers and any details entered by the responsible person. Check operational arrangements on site before signing and issuing. ${model.unconfirmed?'The draft has '+model.unconfirmed+' unanswered operational fields.':''}</div>${model.sections.map(s=>`<section><h2>${E(s.title)}</h2>${s.items.map(i=>`<div class="item ${i.unconfirmed?'unconfirmed':''}"><strong>${E(i.label)}</strong><p>${E(i.text)}</p></div>`).join('')}</section>`).join('')}<footer class="small">Premivue | Private working draft | Generated locally on device | Not submitted to the SIA</footer></html>`;
}
// Genuine editable DOCX, created offline using an uncompressed ZIP containing minimal OOXML.
function docx(model){
 const xml=s=>E(s).replace(/&#39;/g,'&apos;');
 const tx=(s,bold=false,style='')=>`<w:p>${style?`<w:pPr><w:pStyle w:val="${style}"/></w:pPr>`:''}<w:r>${bold?'<w:rPr><w:b/></w:rPr>':''}<w:t xml:space="preserve">${xml(s)}</w:t></w:r></w:p>`;
 let paragraphs=tx('PREMIVUE | MARTYN\'S LAW READINESS & ASSURANCE',true)+tx(model.title,true,'Title')+tx(model.organisation+' — '+model.site)+tx('Assessment: '+model.date+'   Generated: '+model.created+'   '+model.version+'   Tier: '+model.scope);
 paragraphs+=tx('DRAFT — NOT APPROVED. This working policy is based on self-reported information. Verify site arrangements and obtain approval before use.',true);
 if(model.unconfirmed)paragraphs+=tx('Outstanding operational entries: '+model.unconfirmed+'. Complete these before review or approval.',true);
 for(const s of model.sections){paragraphs+=tx(s.title,true,'Heading1');for(const i of s.items){paragraphs+=tx(i.label,true);for(const line of i.text.split('\n'))paragraphs+=tx(line,i.unconfirmed);}}
 paragraphs+=tx('Premivue | Private working draft | Generated locally on device');
 const documentXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1100" w:right="1150" w:bottom="1000" w:left="1150"/></w:sectPr></w:body></w:document>`;
 const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="20"/></w:rPr><w:pPr><w:spacing w:after="75"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:before="80" w:after="320"/></w:pPr><w:rPr><w:b/><w:color w:val="153755"/><w:sz w:val="38"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:spacing w:before="230" w:after="105"/></w:pPr><w:rPr><w:b/><w:color w:val="153755"/><w:sz w:val="26"/></w:rPr></w:style></w:styles>`;
 const files={
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
 'word/document.xml':documentXml,'word/styles.xml':styles
 };
 const utf=new TextEncoder(),parts=[],central=[];let offset=0;
 const u16=n=>new Uint8Array([n&255,n>>>8&255]),u32=n=>new Uint8Array([n&255,n>>>8&255,n>>>16&255,n>>>24&255]);
 const append=(...chunks)=>{for(const ch of chunks){parts.push(ch);offset+=ch.length;}};
 const crc32=data=>{let crc=0xffffffff;for(let i=0;i<data.length;i++){crc^=data[i];for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;};
 for(const [name,body] of Object.entries(files)){
  const n=utf.encode(name),d=utf.encode(body),crc=crc32(d),start=offset;
  append(u32(0x04034b50),u16(20),u16(0x800),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(n.length),u16(0),n,d);
  central.push(...[u32(0x02014b50),u16(20),u16(20),u16(0x800),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(n.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(start),n]);
 }
 const centralStart=offset;append(...central);const centralLength=offset-centralStart,count=Object.keys(files).length;
 append(u32(0x06054b50),u16(0),u16(0),u16(count),u16(count),u32(centralLength),u32(centralStart),u16(0));
 return new Blob(parts,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function pdf(model){
 const Builder=root.ReadinessPdf?.PdfBuilder;
 if(!Builder)throw Error('Offline PDF engine unavailable');
 const p=new Builder();p.footerLabel='Premivue | DRAFT policy (not approved) | Generated on device';p.title('DRAFT - Public Protection Policy');
 p.lineText('Organisation: '+model.organisation+'  |  Premises: '+model.site,{size:9.6});
 p.lineText('Assessment '+model.date+'  |  Generated '+model.created+'  |  '+model.version+'  |  Tier: '+model.scope,{size:9});
 p.block('NOT APPROVED','Self-reported and site-specific arrangements must be reviewed and signed off before adoption. Unconfirmed operational details are highlighted. This is not a legal certificate or SIA submission.');
 for(const s of model.sections){p.gap(5);p.subtitle(s.title);for(const i of s.items){p.lineText(i.label,{size:9.3,bold:true,after:1});p.lineText(i.text,{size:9.1,after:6,leading:12.4});}}
 return new Blob([p.save()],{type:'application/pdf'});
}
const api={FIELDS,essential,missing,requiredIds,isEnhanced,build,html,docx,pdf,generate:(s,r,d)=>html(build(s,r,d))};
root.ReadinessPolicy=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
