import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../admin.html', import.meta.url), 'utf8');
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) new vm.Script(match[1]);
}
assert.match(html, /VIEWS\.imports=async\(\)=>/, 'Admin navigation must have a working import/export view');
for (const id of ['exportEntity','exportFormat','importEntity','importVisible','importOrigin','importFile','importPreview','importCommit']) {
  assert.match(html, new RegExp(`['"]${id}['"]|id="${id}"`), `Import/export view needs ${id}`);
}
assert.match(html, /else if\(type==='sections'\)data=await api\('secciones'\)/);
assert.match(html, /else if\(type==='seasons'\)data=await api\('media\/seasons'\)/);
assert.match(html, /else if\(type==='episodes'\)data=await api\('media\/episodes'\)/);
assert.match(html, /exportCurrent=async type=>\{try\{const data=spreadsheetRows\(await fetchExportRows\(type\)\)/, 'CSV and Excel must share the same data sources');
assert.match(html, /No se guarda hasta que confirmes|Nada se guarda hasta que confirmes/);
assert.match(html, /¿Procesar \$\{S\.importRows\.length\} registros/);
assert.match(html, /Para JSON elegí el tipo de datos o agregá/ , 'Unknown JSON entity must not default to artists');
assert.match(html, /if\(typeof value==='string'&&\/\^\\s\*\[=\+@-\]\//, 'Spreadsheet exports should neutralize formula-leading cells');
assert.match(html, /function toCSV\(list\)\{if\(!list\.length\)return'';const keys=Array\.from\(new Set\(list\.flatMap\(x=>Object\.keys\(x\)\)\)\)/, 'CSV should retain nested fields after serialization');
const lines = html.split('\n');
const exact = prefix => { const line = lines.find(x => x.startsWith(prefix)); assert.ok(line, prefix); return line; };
const calls = [];
const context = {window:{},api:async path=>{calls.push(path);return [{id:'1',nombre:'=HYPERLINK("https://bad")',redes:{ig:'https://example.test'}}]},arr:x=>Array.isArray(x)?x:[]};
vm.createContext(context);
vm.runInContext([exact('async function fetchExportRows'),exact('function spreadsheetRows')].join('\n'),context);
const artists = await vm.runInContext("fetchExportRows('artists')",context);
const safe = vm.runInContext('spreadsheetRows(rows)',vm.createContext({...context,rows:artists}));
assert.equal(calls[0],'artistas');
assert.equal(safe[0].nombre,`'=HYPERLINK("https://bad")`);
assert.equal(safe[0].redes,'{"ig":"https://example.test"}');
await vm.runInContext("fetchExportRows('episodes')",context);
assert.equal(calls.at(-1),'media/episodes');
console.log('PASS: Admin import/export route, supported export sources, explicit JSON typing, confirmation gate and spreadsheet-safe CSV/Excel');
