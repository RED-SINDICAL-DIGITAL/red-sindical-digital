#!/usr/bin/env node
/* Read-only structural UI audit. No network, credentials, writes or DOM execution. */
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const policy=require('../uadav-module-policy.js');
const pages=['app.html','index-v117.html','artistas.html','en-vivo.html','cartelera.html','bolsa-trabajo.html','usuario.html','biblioteca.html','para-artistas.html','admin.html'];
function analyze(page){
 const text=readFileSync(new URL('../'+page,import.meta.url),'utf8');
 const hrefs=[...text.matchAll(/\bhref="(\/[^"#?]+\.html)(?:[?#][^"]*)?"/g)].map(m=>m[1]);
 const navs=[...text.matchAll(/\bdata-(?:route|home-nav)="(\/[^"#?]+\.html)(?:[?#][^"]*)?"/g)].map(m=>m[1]);
 const repeated=[...new Set([...hrefs,...navs])].filter(h=>[...hrefs,...navs].filter(x=>x===h).length>1);
 const moduleTags=[...text.matchAll(/\bdata-module="([a-z_]+)"/g)].map(m=>m[1]);
 return {
  page, bytes:Buffer.byteLength(text), inline_style_blocks:(text.match(/<style(?:\s[^>]*)?>/g)||[]).length,
  inline_script_blocks:(text.match(/<script(?:\s[^>]*)?>/g)||[]).length,
  route_references:hrefs.length+navs.length,
  repeated_routes:repeated.sort(),
  module_tags:[...new Set(moduleTags)].sort(),
  unknown_module_tags:[...new Set(moduleTags.filter(m=>!(m in policy.defaults)))].sort()
 };
}
const report={
  rule:'menos pantallas, menos elementos innecesarios, más experiencia de aplicación y ninguna pérdida de funciones',
  source:'static GitHub snapshot; NOT proof of deployed bytes, user flows or Cloudflare environment',
  modules:{enabled_by_default:Object.keys(policy.defaults).filter(k=>policy.defaults[k]===true),disabled_by_default:Object.keys(policy.defaults).filter(k=>policy.defaults[k]===false)},
  pages:pages.map(analyze)
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
