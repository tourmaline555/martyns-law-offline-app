/* Test in Termux Node 22+: AES-GCM backup round trip and wrong-password failure */
const assert=require('node:assert/strict');const C=require('./secure.js');
(async()=>{assert.equal(C.available(),true);const item={format:'ml-readiness-archive-v3',records:[{business:{name:'Demo',site:'Test'}}],actions:[],actionEvents:[],draft:{}};
const secret='a very strong demo passphrase 389';
const encrypted=await C.encrypt(item,secret);assert.equal(encrypted.format,'premivue-encrypted-archive-v1');assert.ok(!JSON.stringify(encrypted).includes('Demo'));
const restored=await C.decrypt(encrypted,secret);assert.deepEqual(restored,item);await assert.rejects(C.decrypt(encrypted,'incorrect password'),/Incorrect password/);
console.log('PASS AES-GCM backup encryption: round-trip, confidentiality and rejection of incorrect password.');
})().catch(e=>{console.error(e);process.exitCode=1;});
