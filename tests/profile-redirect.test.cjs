const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync('mi-perfil.html','utf8');const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
test('profile entry preserves link parameters and the destination section',()=>{let destination;vm.runInNewContext(script,{location:{search:'?from=trabajo',hash:'#mis-trabajos',replace:value=>destination=value}});assert.equal(destination,'/usuario.html?from=trabajo#mis-trabajos')});
test('plain profile links still open the account page',()=>{let destination;vm.runInNewContext(script,{location:{search:'',hash:'',replace:value=>destination=value}});assert.equal(destination,'/usuario.html')});
