const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const source=readFileSync(join(__dirname,'..','consultar-publicidad.js'),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function harness(){
  const calls=[],pending=[],inputs={name:'Operador QA',email:'qa@example.invalid',province:'Santa Fe',objective:'Prueba sin activar campaña'};
  const consent={checked:true,disabled:false},submit={disabled:true,textContent:'Enviar consulta'};
  const formElements=[consent,submit];formElements.consent=consent;const form={elements:formElements,onsubmit:null};
  const availability={textContent:''},status={textContent:''};
  const nodes={commercialForm:form,send:submit,result:status,availability};
  let seq=0;
  const context={
    window:{PLATFORM_API_BASE:'https://staging.invalid/api/',UADAVSecurity:{token:async()=> 'qa-turnstile'}},
    document:{getElementById:id=>nodes[id]},
    FormData:class{constructor(){ } [Symbol.iterator](){return Object.entries(inputs)[Symbol.iterator]()}},
    Object,JSON,Error,AbortController,setTimeout,clearTimeout,
    crypto:{randomUUID:()=> 'qa-'+(++seq)},
    fetch:(url,options)=>{const call={url:String(url),options};calls.push(call);if(call.url.endsWith('/capabilities'))return Promise.resolve({ok:true,json:async()=>({enabled:true})});return new Promise((resolve,reject)=>pending.push({resolve,reject,call}))}
  };
  vm.runInNewContext(source,context);
  const send=()=>form.onsubmit({preventDefault(){}});
  const resolveWrite=(i,id)=>pending[i].resolve({ok:true,json:async()=>({success:true,id})});
  return{calls,pending,inputs,status,submit,consent,availability,formElements,send,resolveWrite};
}

test('commercial form gates submission on server capabilities',async()=>{
 const x=harness();await tick();assert.equal(x.submit.disabled,false);assert.match(x.availability.textContent,/administración de Santa Fe/);
});

test('one pending inquiry cannot be submitted twice and success locks form',async()=>{
 const x=harness();await tick();
 const first=x.send();await tick();const second=x.send();await tick();
 assert.equal(x.pending.length,1);
 const body=JSON.parse(x.pending[0].call.options.body);
 assert.equal(body.request_id,'qa-1');assert.equal(body.consent,true);
 assert.equal(body.turnstile_token,'qa-turnstile');
 x.resolveWrite(0,'PUB-qa-1');await first;await second;
 assert.match(x.status.textContent,/Consulta guardada/);
 await x.send();assert.equal(x.pending.length,1);
});

test('uncertain response keeps same idempotency key on explicit retry',async()=>{
 const x=harness();await tick();
 const first=x.send();await tick();x.pending[0].reject(Error('Fallo de red'));await first;
 assert.match(x.status.textContent,/Fallo de red/);
 const second=x.send();await tick();
 assert.equal(JSON.parse(x.pending[1].call.options.body).request_id,'qa-1');
 x.resolveWrite(1,'PUB-qa-1');await second;
 assert.match(x.status.textContent,/Consulta guardada/);
});

test('editing the proposal after failure generates a new reference',async()=>{
 const x=harness();await tick();
 const first=x.send();await tick();x.pending[0].reject(Error('Desconectado'));await first;
 x.inputs.objective='Otra propuesta QA';
 const second=x.send();await tick();
 assert.equal(JSON.parse(x.pending[1].call.options.body).request_id,'qa-2');
 x.resolveWrite(1,'PUB-qa-2');await second;
});

test('incorrect receipt does not display success or permanently lock input',async()=>{
 const x=harness();await tick();const first=x.send();await tick();
 x.resolveWrite(0,'PUB-otro');await first;
 assert.match(x.status.textContent,/No pudimos confirmar/);
 assert.equal(x.submit.disabled,false);
});
