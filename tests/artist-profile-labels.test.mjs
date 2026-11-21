import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../gestionar-artista.html',import.meta.url),'utf8');
const form=html.slice(html.indexOf('<form id="profileForm">'),html.indexOf('</form>',html.indexOf('<form id="profileForm">')));
test('all basic profile input and textarea labels target their exact controls',()=>{
 const fields=[...form.matchAll(/<label for="([^"]+)">([^<]+)<\/label><(input|textarea) id="([^"]+)" name="([^"]+)"/g)];
 assert.equal(fields.length,12);
 const ids=fields.map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const m of fields){assert.equal(m[1],m[4]);assert.equal(m[1],'artist-'+m[5]);assert(m[2].trim());}
});
test('specialty retains free text and optional YouTube has no required constraint',()=>{
 assert.match(form,/<input id="artist-rubro" name="rubro" list="artistActivities"/);
 const youtube=form.match(/<input id="artist-canal"[^>]+>/)[0];assert(!youtube.includes('required'));
});
