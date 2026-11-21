import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../admin.html',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('function adminProExpiryDate('),source.indexOf('window.editArtist=i=>'));
assert(helpers.includes('function adminProExpirySave'));
const c={};vm.createContext(c);vm.runInContext(helpers,c);
test('local end-of-day date round trips without adding a day',()=>{
 const iso=new Date('2026-10-17T23:59:59').toISOString();
 assert.equal(c.adminProExpiryDate(iso),'2026-10-17');
 assert.equal(c.adminProExpirySave('2026-10-17',iso),iso);
});
test('saving unchanged date preserves exact expiry instant',()=>{
 const iso=new Date('2026-10-17T11:15:37').toISOString();
 assert.equal(c.adminProExpirySave('2026-10-17',iso),iso);
});
test('changing expiry uses selected local day and clearing removes expiry',()=>{
 const iso=c.adminProExpirySave('2026-10-19','2026-10-18T00:00:00Z');
 assert.equal(c.adminProExpiryDate(iso),'2026-10-19');
 assert.equal(new Date(iso).getHours(),23);
 assert.equal(c.adminProExpirySave('',iso),null);
});
test('empty and malformed stored dates do not break editor',()=>{
 assert.equal(c.adminProExpiryDate(null),'');assert.equal(c.adminProExpiryDate('invalid'),'');
 assert.equal(c.adminProExpiryDate('2026-10-17'),'2026-10-17');
 assert.throws(()=>c.adminProExpirySave('invalid',null),/inválida/);
});
