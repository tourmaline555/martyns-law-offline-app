/* Password-encrypted offline backups. Does not encrypt records held in this browser. */
(function(root){
'use strict';
const ITER=310000;
const te=new TextEncoder(), td=new TextDecoder();
function available(){return !!(root.crypto&&root.crypto.subtle&&root.crypto.getRandomValues);}
function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(s);}
function from64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
async function derive(password,salt,usage){const k=await crypto.subtle.importKey('raw',te.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITER,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,usage);}
async function encrypt(obj,password){
 if(!available())throw Error('Encrypted backups require HTTPS or localhost and a modern browser.');
 if(typeof password!=='string'||password.length<12)throw Error('Use a backup password with at least 12 characters.');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await derive(password,salt,['encrypt']);
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,te.encode(JSON.stringify(obj)));
 return {format:'premivue-encrypted-archive-v1',algorithm:'AES-256-GCM',keyDerivation:'PBKDF2-SHA-256',iterations:ITER,salt:base64(salt),iv:base64(iv),data:base64(new Uint8Array(cipher))};
}
async function decrypt(obj,password){
 if(!available())throw Error('Encrypted imports require HTTPS or localhost and a modern browser.');
 if(obj?.format!=='premivue-encrypted-archive-v1'||obj.algorithm!=='AES-256-GCM'||obj.iterations!==ITER)throw Error('Unsupported encrypted backup format.');
 const salt=from64(obj.salt),iv=from64(obj.iv);if(salt.length!==16||iv.length!==12)throw Error('Invalid encrypted backup headers.');
 const key=await derive(password,salt,['decrypt']);
 let plaintext;try{plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,from64(obj.data));}catch(_){throw Error('Incorrect password or altered backup file.');}
 return JSON.parse(td.decode(plaintext));
}
// Uses password-type browser controls, not a visible prompt or a persistent stored secret.
function askPassword(confirm=false){return new Promise(resolve=>{
 const layer=document.createElement('div');layer.className='secure-overlay';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');
 const box=document.createElement('form');box.className='secure-dialog';
 const heading=document.createElement('h2');heading.textContent=confirm?'Protect your backup':'Unlock encrypted backup';box.appendChild(heading);
 const description=document.createElement('p');description.textContent=confirm?'Choose a strong password (12+ characters). The file cannot be recovered if you forget it. Store the password separately.':'Enter the password you used to protect this backup.';box.appendChild(description);
 function passwordField(labelText){const l=document.createElement('label');l.className='field';l.textContent=labelText;const i=document.createElement('input');i.type='password';i.autocomplete='off';i.required=true;i.minLength=confirm?12:1;l.appendChild(i);box.appendChild(l);return i;}
 const one=passwordField('Backup password');const two=confirm?passwordField('Confirm password'):null;
 const error=document.createElement('p');error.className='small';error.setAttribute('role','alert');box.appendChild(error);
 const buttons=document.createElement('div');buttons.className='button-row';const cancel=document.createElement('button');cancel.type='button';cancel.className='button secondary';cancel.textContent='Cancel';const submit=document.createElement('button');submit.type='submit';submit.className='button';submit.textContent=confirm?'Encrypt and download':'Unlock backup';buttons.append(cancel,submit);box.append(buttons);layer.append(box);document.body.append(layer);one.focus();
 function done(value){one.value='';if(two)two.value='';layer.remove();resolve(value);}
 cancel.addEventListener('click',()=>done(null));
 box.addEventListener('submit',e=>{e.preventDefault();if(confirm&&(one.value.length<12||one.value!==two.value)){error.textContent=one.value.length<12?'Password must contain at least 12 characters.':'Passwords do not match.';return;}done(one.value);});
 });}
root.PremivueSecure={available,encrypt,decrypt,askPassword};
if(typeof module!=='undefined'&&module.exports)module.exports={available,encrypt,decrypt};
})(typeof window!=='undefined'?window:globalThis);
