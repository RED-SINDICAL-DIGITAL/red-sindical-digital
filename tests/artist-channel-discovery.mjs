import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const original=globalThis.fetch, id='UCabcdefghijklmnopqrstuv';
async function scenario({key=true,enabled=true,official=true,invidious=false}={}){
 const DB=sqliteD1(),kv=new Map([['youtube_api_enabled',JSON.stringify(enabled)]]),calls=[];
 const env={DB,UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)},...(key?{YOUTUBE_API_KEY:'isolated-dummy-secret'}:{})};
 globalThis.fetch=async input=>{
  const u=new URL(String(input));calls.push(u.hostname);
  if(u.hostname==='www.googleapis.com'){
   if(!official)return new Response('{}',{status:403});
   return Response.json({items:u.pathname.endsWith('/search')?[{id:{channelId:id},snippet:{title:'QA Official'}}]:[{id,snippet:{title:'QA Official',description:'Public channel biography',thumbnails:{high:{url:'https://example.org/photo.jpg'}}},statistics:{subscriberCount:'42'}}]});
  }
  if(invidious)return Response.json(u.pathname.includes('/channels/')?{authorId:id,author:'QA Invidious',description:'Public bio'}:[{authorId:id,author:'QA Invidious'}]);
  return new Response('{}',{status:503});
 };
 try{
  const response=await worker.fetch(new Request('https://isolated.example/api/public/discover-artist?q=QAChannel'),env,{});
  return {status:response.status,data:await response.json(),calls};
 }finally{DB.close()}
}
try{
 const success=await scenario();assert.equal(success.status,200);const p=success.data.data||success.data.artist||success.data;
 assert.equal(p.canal,id);assert.equal(p.nombre,'QA Official');assert.equal(p.bio,'Public channel biography');assert.equal(p.afiliado_verificado,false);assert.notEqual(p.pro_active,true);
 assert.equal(JSON.stringify(success.data).includes('isolated-dummy-secret'),false);
 for(const options of [{key:false},{enabled:false},{official:false}]){const r=await scenario(options);assert.equal(r.status,404);if(options.key===false||options.enabled===false)assert.equal(r.calls.includes('www.googleapis.com'),false)}
 const primary=await scenario({invidious:true});assert.equal(primary.status,200);assert.equal(primary.calls.includes('www.googleapis.com'),false);
 const html=await readFile(new URL('../artista.html',import.meta.url),'utf8');
 assert.ok(html.includes('if(recent?.discovered&&channelReference(recent))'));
 console.log('PASS: official discovery fallback, metadata, no identity/PRO grant, key/flag/error gates, Invidious quota preservation and empty-cache retry guard.');
}finally{globalThis.fetch=original}
