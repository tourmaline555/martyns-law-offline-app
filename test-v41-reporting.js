/* v4.1 focused reporting regressions: history provenance, actionable guidance, concise PDF. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const Integrity=require('./integrity.js'),L=require('./logic.js');
globalThis.PremivueIntegrity=Integrity;
const PDF=require('./pdf.js');
const Q=require('./question-data.json');
const b=JSON.parse(fs.readFileSync('tests/fixtures/riverside-three.json','utf8'));
const may=b.records.find(x=>x.business.date==='2026-05-14');
const august=b.records.find(x=>x.business.date==='2026-08-14');
assert.equal(may.result.score,40);
assert.ok(Math.abs(august.result.score-59.63)<.02);
assert.ok(Math.abs(L.summarize(Q,august.business,august.answers,august.notes).score-august.result.score)<.001);
const q8=b.actions.find(x=>x.questionId==='Q8');
const state=Integrity.stateAt(q8,b.actionEvents,'2026-08-14');
assert.equal(state.status,'Open');
assert.equal(state.recorded,true);
assert.equal(state.at,'2026-05-14T15:00:00.000Z');
assert.equal(state.owner,'','Never inherit owner assigned in a later edit');
assert.equal(state.dueDate,'','Never inherit deadline set later');
const notThere=Integrity.stateAt({...q8,createdAt:'2026-11-01T11:00:00.000Z',updatedAt:'2026-11-12T11:00:00.000Z',completedAt:'2026-11-12T11:00:00.000Z'},[],'2026-08-14');
assert.equal(notThere.recorded,false);
assert.equal(notThere.status,'Not recorded');
const explicit={...q8,createdAt:'2026-06-01T12:00:00.000Z',status:'In progress',updatedAt:'2026-11-14T12:00:00.000Z',completedAt:''};
const evid=[{id:'created',actionId:q8.id,type:'created',at:'2026-06-01T12:00:00.000Z',detail:'Created'},{id:'update',actionId:q8.id,type:'updated',at:'2026-07-01T12:00:00.000Z',detail:'Tracked',after:{status:'In progress',owner:'Duty Manager',dueDate:'2026-08-01'}}];
const asOf=Integrity.stateAt(explicit,evid,'2026-08-14');
assert.equal(asOf.status,'In progress');
assert.equal(asOf.owner,'Duty Manager');
assert.equal(asOf.dueDate,'2026-08-01');
assert.equal(asOf.at,'2026-07-01T12:00:00.000Z');
assert.equal(Integrity.stateAt(explicit,[], '2026-08-14').recorded,false);
assert.equal(Integrity.stateAt({...explicit,updatedAt:'2026-08-01T11:00:00.000Z'},[], '2026-08-14').status,'In progress');

const input={business:august.business,answers:august.answers,notes:august.notes,_audit:{id:august.id,importValidation:'verified'}};
const options={historical:true,actionEvents:b.actionEvents,generatedAt:'2026-11-14T16:00:00.000Z',comparison:august.result.score-may.result.score};
function generate(detailed,filename){
 const bytes=PDF.generate(input,august.result,b.actions,{...options,detailed});
 const buf=Buffer.from(bytes);assert.ok(buf.length>14000);
 if(filename)fs.writeFileSync(filename,buf);
 const text=[...buf.toString('latin1').matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map(m=>m[1].replace(/\\([()\\])/g,'$1')).join('\n');
 return {buf,text};
}
const out=generate(true,process.env.PREMIVUE_FULL_SAMPLE||path.join(os.tmpdir(),'premivue41-full-test.pdf'));
const short=generate(false,process.env.PREMIVUE_MANAGEMENT_SAMPLE||path.join(os.tmpdir(),'premivue41-management-test.pdf'));
const s=out.text;
assert.match(s,/Action status is shown at the assessment date ONLY/);
assert.match(s,/Open \(raised 14 May 2026\)/);
assert.doesNotMatch(s,/Action status at assessment: Open \(dated action history\)/);
assert.match(s,/Confirm who activates lockdown/);
assert.match(s,/Record the weaknesses already identified/);
assert.match(s,/Confirm who can authorise escalation/);
assert.match(s,/Agree a consistent procedure-review schedule/);
assert.match(s,/Top priorities for management review/);
assert.match(s,/Q5\s+Procedures/);
assert.match(s,/Q8\s+Procedures/);
assert.match(s,/Q31\s+Documentation/);
assert.doesNotMatch(s,/Owner: Demo Premises Manager/); // assigned later, not in historical event log
assert.equal(s.split('Action status is shown at the assessment date ONLY').length-1,1);
assert.equal(short.text.split('Action status is shown at the assessment date ONLY').length-1,1);
// Use encoded report output to avoid silently changing the 38 question IDs, weights or scoring.
assert.equal(L.activeQuestions(Q,august.business).length,37);
assert.equal(L.METHODOLOGY,'premivue-2026-v40-complete-coverage');
assert.match(fs.readFileSync('index.html','utf8'),/v4\.1/);
assert.match(fs.readFileSync('sw.js','utf8'),/ml-check-v41/);
console.log('PASS v4.1: dated action provenance vs unknown, historical owner/deadline safety, precise recommendations, compact output, unchanged scoring and saved IDs.');
