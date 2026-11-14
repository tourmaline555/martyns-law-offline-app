/* Red-team regression suite for v3.9. Run: node test-v39.js */
'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs'),L=require('./logic.js'),A=require('./audit.js'),B=require('./basis.js'),PDF=require('./pdf.js');
const Q=require('./question-data.json');
const base={...L.defaultState().business,name:'Example Retail',site:'Unit 4, Example Road',activity:'shops',building:'yes',excluded:'no',peak:'300',peakMethod:'observed busy-hour headcount',events:'no',shared:'no',date:'2026-11-14',reviewDate:'2027-01-14'};
const active=L.activeQuestions(Q,base);const yes=Object.fromEntries(active.map(q=>[q.id,'yes']));
assert.equal(active.length,33);
// 1. A six-yes/32-N-A game must NEVER count as completed or Green.
const naAnswers=Object.fromEntries(active.map(q=>[q.id,q.critical==='Y'?'yes':'na']));
let out=L.summarize(Q,base,naAnswers);
assert.equal(out.provisional,true);assert.notEqual(out.rag,'Green');assert.ok(out.invalidNa.length>15);assert.ok(out.unanswered>15);
assert.equal(out.score,null);assert.equal(out.rag,'Unrated');assert.equal(out.rawScore,100); // A nominal 100% is not displayed with inadequate coverage.
// 2. N/A is narrowly controlled, with a documented rationale.
let amended={...yes,Q22:'na'};
out=L.summarize(Q,base,amended);assert.equal(out.provisional,true);
out=L.summarize(Q,base,amended,{Q22:'No visitors are admitted to this staff-only unit.'});
assert.equal(out.na,1);assert.equal(out.unanswered,0);assert.equal(out.rag,'Green');assert.equal(out.coverage,100);
assert.equal(L.NA_ALLOWED.has('Q8'),false);
// 3. Q35 is advisory even in enhanced-tier premises: do not confuse named lead with section 10 designation.
for(const peak of ['300','900']){
 const b={...base,peak};const answers={...yes,Q35:'no'};
 const r=L.summarize(Q,b,answers);
 assert.equal(r.critical.length,0);assert.equal(r.rag,'Green');
 assert.equal(r.actions.find(a=>a.q.id==='Q35').priority,'High');
 assert.equal(B.classify('Q35',r.scope,b).kind,'advisory');
}
// 4. Not sure means unverified, NOT a finding that something has been proved absent.
out=L.summarize(Q,base,{...yes,Q13:'not_sure'});
const action=out.actions.find(a=>a.q.id==='Q13');
assert.match(action.finding,/Not verified:/);assert.match(action.action,/VERIFY FIRST:/);
assert.equal(out.score<100,true);
// 5. Separate/mixed location event questions cannot inflate the current premises score.
for(const loc of ['separate','both','unknown']){
 const b={...base,events:'yes',eventLocation:loc,eventPeak:'900',publicAccess:'yes',entryChecks:'yes',eventExcluded:'no'};
 assert.equal(L.activeQuestions(Q,b).filter(q=>q.section==='Events').length,0,loc);
}
const same={...base,events:'yes',eventLocation:'at_site'};
assert.equal(L.activeQuestions(Q,same).filter(q=>q.section==='Events').length,4);
// 6. Preserve stable site key despite renamed premises.
const identity={...base,siteId:'f00d-1234',siteKeyId:'site:f00d-1234'};
assert.equal(A.siteKey(identity),A.siteKey({...identity,name:'Rebranded premises',site:'New address'}));
const legacy={...base,siteKeyId:'original name|former street',siteId:'legacy'};
assert.equal(A.siteKey(legacy),'original name|former street');
// 7. The trend carries the scoring version and scored question-set needed to assess comparability.
const r=L.summarize(Q,base,yes),st={business:base,answers:yes,notes:{}};
const snapshot=A.snapshot(st,r);assert.equal(snapshot.scoringVersion,L.METHODOLOGY);
assert.equal(A.trend([snapshot])[0].scoredIds,r.scoredQuestionIds.join(','));
// 8. Generation of a clean management PDF continues to work.
const pdf=PDF.generate(st,r,[],{});assert.ok(pdf.length>9000);assert.equal(Buffer.from(pdf.slice(0,8)).toString('latin1'),'%PDF-1.4');
// 9. Cached asset list includes new crypto code, and all versions are bumped.
const sw=fs.readFileSync('./sw.js','utf8'),html=fs.readFileSync('./index.html','utf8');
assert.match(sw,/secure\.js/);assert.match(sw,/v41/);assert.match(html,/secure\.js/);assert.match(html,/v4\.1/);
console.log('PASS v3.9: N/A protection, Q35 alignment, Not sure findings, event routing, stable sites, scoring provenance, PDF, offline assets.');
