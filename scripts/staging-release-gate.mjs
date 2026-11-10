// Fail-closed release readiness gate. Does not contact external services or access secrets.
// Consumes metadata only, NEVER backup rows, tokens, passwords or private user data.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const SHA=/^[a-f0-9]{40}$/i,HEX=/^[a-f0-9]{64}$/i;
const requiredChecks=['Platform integration checks','Bolsa UI staging checks','Staging integration preservation checks','Staging integration offline visual QA','Published staging preview acceptance'];
export function decideRelease(input){
 const missing=[];
 if(!input||typeof input!=='object'||Array.isArray(input))return {ready:false,missing:['Valid release evidence required']};
 if(!SHA.test(input.candidate_sha||''))missing.push('Candidate SHA is missing or invalid');
 for(const name of requiredChecks){
  const run=input.ci?.[name];
  if(!run||run.commit_sha!==input.candidate_sha||run.conclusion!=='success')missing.push('CI not approved for candidate: '+name);
 }
 const b=input.backup||{};
 if(b.environment!=='staging')missing.push('Backup environment not independently confirmed as staging');
 if(b.verified!==true)missing.push('Backup integrity verification not approved');
 if(!HEX.test(b.sha256||''))missing.push('Backup SHA-256 not recorded');
 if(b.kv_exported!==true||b.d1_exported!==true)missing.push('KV and D1 backup exports both required');
 if(b.restore_plan_approved!==true)missing.push('Rollback/restore plan has not been accepted');
 if(input.qa?.admin_authenticated!==true)missing.push('Real staging Admin QA not accepted');
 if(input.qa?.radio_operator_authenticated!==true)missing.push('Real staging radio operator QA not accepted');
 if(input.qa?.profile_authenticated!==true)missing.push('Real staging profile QA not accepted');
 if(input.qa?.responsible_approval!==true)missing.push('Explicit staging release approval missing');
 return {ready:missing.length===0,missing};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv[2]){console.error('Usage: node scripts/staging-release-gate.mjs /private/path/evidence.json');process.exitCode=2}
 else try{
  const document=JSON.parse(await readFile(process.argv[2],'utf8'));
  const decision=decideRelease(document);
  // Show reason names only; never print evidence object or filesystem paths.
  console.log(JSON.stringify(decision,null,2));
  if(!decision.ready)process.exitCode=1;
 }catch{console.error('Cannot validate release evidence. No changes made.');process.exitCode=2}
}
