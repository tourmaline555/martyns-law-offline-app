/* v3.7 navigation, scope edit and concise PDF regression test; no browser/network required. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const L=require('./logic.js'),B=require('./basis.js'),Pdf=require('./pdf.js');
const root={};vm.runInNewContext(fs.readFileSync(__dirname+'/questions.js','utf8'),{window:root});
const Q=root.ASSESSMENT_QUESTIONS;
const b={...L.defaultState().business,name:'Example Nightclub',site:'Fictional Street',assessor:'Test assessor',date:'2026-11-14',activity:'entertainment',building:'no',excluded:'no',peak:'1000',peakMethod:'Entry count',events:'yes',eventLocation:'at_site',eventPeak:'1200',publicAccess:'yes',entryChecks:'no',eventExcluded:'no',accessGeneral:'yes',shared:'no',reviewDate:'2027-01-15'};
const answers=Object.fromEntries(L.activeQuestions(Q,b).map(q=>[q.id,'yes']));
Object.assign(answers,{Q7:'not_sure',Q8:'partly',Q13:'no',Q15:'partly',Q25:'partly',Q26:'no',Q31:'no',Q32:'no',Q33:'no',Q34:'no'});
const starting={...L.defaultState(),screen:'results',business:b,answers,notes:{Q8:'Testing needed'}};
const map=new Map([['martyns-law-readiness-v1',JSON.stringify(starting)]]),elements=new Map();
let content='';
const appElement={get innerHTML(){return content;},set innerHTML(x){content=x;elements.clear();}};
function get(id){if(id==='app')return appElement;if(!content.includes('id="'+id+'"'))return null;if(!elements.has(id))elements.set(id,{id,handlers:{},addEventListener(kind,fn){this.handlers[kind]=fn;},value:id==='building'?currentBusiness().building:'',classList:{toggle(){}},click(){this.handlers.click?.();}});return elements.get(id);}
function currentBusiness(){return JSON.parse(map.get('martyns-law-readiness-v1')).business;}
let fakeBusinessInput=null;
const doc={getElementById:get,querySelectorAll(selector){if(selector==='[data-field]'&&content.includes('id="building"')){fakeBusinessInput={dataset:{field:'building'},value:get('building').value,handlers:{},addEventListener(kind,fn){this.handlers[kind]=fn;}};return [fakeBusinessInput];}return [];}};
const ctx={window:{...root,ReadinessLogic:L,ReadinessBasis:B,scrollTo(){}},document:doc,localStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},navigator:{},alert:()=>{},confirm:()=>true,URL,Blob,File:globalThis.File,setTimeout,console};
let app=fs.readFileSync(__dirname+'/app.js','utf8');const compiled=app.replace(/\ninit\(\);\n\}\)\(\);\s*$/, '\nwindow.__test37={render,renderResults,renderSetup,getState:()=>state,setRecord:(record)=>{selectedRecord=record},correctScopeFromRecord};\n})();\n');assert.notEqual(app,compiled);
vm.runInNewContext(compiled,ctx,{filename:'app.js'});
ctx.window.__test37.render();
assert.match(content,/Correct scope answers/);
get('editScopeDirect').click();
assert.match(content,/Save scope changes & view results/);
assert.equal(get('building').value,'no');
fakeBusinessInput.value='yes';fakeBusinessInput.handlers.change();
get('setupForm').handlers.submit({preventDefault(){}});
const changed=ctx.window.__test37.getState();
assert.equal(changed.screen,'results');assert.equal(changed.business.building,'yes');assert.equal(changed.answers.Q8,'partly');assert.equal(changed.notes.Q8,'Testing needed');
assert.equal(L.computeScope(changed.business).premises,'Enhanced tier');
assert.match(content,/Enhanced tier/);
const r=L.summarize(Q,changed.business,changed.answers);
assert.equal(Math.round(r.score),78);assert.equal(r.rag,'Amber');
const report=Pdf.generate(changed,r);const full=Pdf.generate(changed,r,[],{detailed:true});
if(process.env.PREMIVUE_SAMPLE_DIR){const path=require('node:path');fs.writeFileSync(path.join(process.env.PREMIVUE_SAMPLE_DIR,'Premivue-v3.7-Sample-Management-Report.pdf'),report);fs.writeFileSync(path.join(process.env.PREMIVUE_SAMPLE_DIR,'Premivue-v3.7-Full-Assessment-Example.pdf'),full);}
const standard=Buffer.from(report).toString('latin1'), detail=Buffer.from(full).toString('latin1');
assert.equal((standard.match(/\/Type \/Page \/Parent/g)||[]).length,3);
assert.ok((detail.match(/\/Type \/Page \/Parent/g)||[]).length>3);
assert.match(standard,/Prioritised action plan/);
assert.doesNotMatch(standard,/Appendix - all question responses/);
assert.match(detail,/Appendix - all question responses/);
assert.match(detail,/Q42/);
const archived={business:b,answers,notes:{Q8:'Testing needed'},id:'original-123'};
ctx.window.__test37.setRecord(archived);ctx.window.__test37.correctScopeFromRecord();
assert.equal(ctx.window.__test37.getState().screen,'setup');
assert.equal(ctx.window.__test37.getState().answers.Q8,'partly');
assert.equal(archived.business.building,'no'); // Original snapshot untouched
console.log('PASS v3.7: edit scope No->Yes without losing answers; recompute enhanced tier; correct archived copy; 3-page summary and optional detailed appendix.');
