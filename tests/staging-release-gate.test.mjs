import test from 'node:test';
import assert from 'node:assert/strict';
import {decideRelease} from '../scripts/staging-release-gate.mjs';
const sha='a'.repeat(40),sha256='b'.repeat(64);
const names=['Platform integration checks','Bolsa UI staging checks','Staging integration preservation checks','Staging integration offline visual QA','Published staging preview acceptance'];
function evidence(){return {candidate_sha:sha,ci:Object.fromEntries(names.map(n=>[n,{commit_sha:sha,conclusion:'success'}])),backup:{environment:'staging',verified:true,sha256,kv_exported:true,d1_exported:true,restore_plan_approved:true,restore_rehearsal_verified:true,restore_rehearsal_sha256:sha256},qa:{admin_authenticated:true,radio_operator_authenticated:true,profile_authenticated:true,responsible_approval:true}}}
test('all independently proven gates permit staging readiness',()=>assert.equal(decideRelease(evidence()).ready,true));
test('CI alone is never enough',()=>{let x=evidence();x.backup.verified=false;x.qa.admin_authenticated=false;const res=decideRelease(x);assert.equal(res.ready,false);assert.ok(res.missing.length>=2)});
test('production backup cannot qualify',()=>{let x=evidence();x.backup.environment='production';assert.equal(decideRelease(x).ready,false)});
test('different commit CI fails closed',()=>{let x=evidence();x.ci[names[0]].commit_sha='c'.repeat(40);assert.equal(decideRelease(x).ready,false)});
test('missing signoff blocks the release',()=>{let x=evidence();x.qa.responsible_approval=false;assert.equal(decideRelease(x).ready,false)});
test('all backup components and rollback plan are required',()=>{for(const k of ['sha256','kv_exported','d1_exported','restore_plan_approved','restore_rehearsal_verified','restore_rehearsal_sha256']){let x=evidence();delete x.backup[k];assert.equal(decideRelease(x).ready,false)}});
test('invalid and absent metadata are denied without exposure',()=>{assert.equal(decideRelease(null).ready,false);assert.equal(decideRelease({}).ready,false)});

test('an approved plan does not prove a completed recovery rehearsal',()=>{
 const data=evidence();data.backup.restore_rehearsal_verified=false;
 assert.equal(decideRelease(data).ready,false);
});
test('a rehearsal with another backup cannot qualify',()=>{
 const data=evidence();data.backup.restore_rehearsal_sha256='c'.repeat(64);
 assert.equal(decideRelease(data).ready,false);
});
