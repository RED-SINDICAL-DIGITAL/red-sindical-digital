import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const html=await readFile(new URL('./staging-signals-diagnostic.html',import.meta.url),'utf8');
const script=/<script>([\s\S]*?)<\/script>/.exec(html)[1];
assert(!html.includes('localStorage'));assert(!html.includes('sessionStorage'));
const DB=sqliteD1(),values=new Map();const env={DB,ADMIN_KEY:'synthetic-admin-only',UADAV_DB:{get:async k=>values.get(k)||null,put:async(k,v)=>values.set(k,v)}};
const nodes={secret:{value:env.ADMIN_KEY,focus(){}},run:{disabled:false},status:{textContent:''},results:{items:[],replaceChildren(){this.items=[]},append(node){this.items.push(node.textContent)}}};
const context={document:{getElementById:id=>nodes[id],createElement:()=>({textContent:''})},URL,AbortController,setTimeout,clearTimeout,crypto:webcrypto,fetch:async(url,opt)=>worker.fetch(new Request(url,opt),env,{})};
try{
 vm.runInNewContext(script,context);await nodes.run.onclick();
 assert.match(nodes.status.textContent,/Comprobaciones completadas/,nodes.status.textContent+'\n'+nodes.results.items.join('\n'));
 assert.equal(nodes.secret.value,'');assert.equal(nodes.run.disabled,false);
 assert.equal(JSON.parse(values.get('radios')).length,1);assert.equal(JSON.parse(values.get('senales_oficiales')).length,1);
 assert.equal(values.has('signal_onboarding_config'),false,'no public enrollment switch was changed');
 console.log('PASS: diagnostic page executes complete synthetic radio/TV migration, approval and publication with actual Worker + SQLite; concurrent TV attempts, duplicate protection and secret clearing verified');
}finally{DB.close()}
