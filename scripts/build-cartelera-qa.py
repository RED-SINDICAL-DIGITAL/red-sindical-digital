from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parent.parent
core=(root/'worker.js').read_text()
assert "const BUILD = '11770';" in core
sha=hashlib.sha256(core.encode()).hexdigest()
assert core.encode()==(root/'releases/worker-UADAVSTREAM-V11.7-11770.js').read_bytes()
names=set(re.findall(r'CREATE\s+(?:VIRTUAL\s+TABLE|TABLE|(?:UNIQUE\s+)?INDEX)\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_][A-Za-z0-9_]*)',core,re.I))
names={n for n in names if n.upper() not in {'IF','NOT','EXISTS','TABLE','INDEX'}}
restore=(root/'scripts/cartelera-restore.mjs').read_text()
names.update(re.findall(r'CREATE\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*)',restore,re.I))
checksum=(root/'scripts/job-backup-digest.mjs').read_text().replace('export async function','async function')
restore='\n'.join(l for l in restore.splitlines() if not l.startswith('import ')).replace('export {snapshot,restoreDisposable};','return {snapshot,restoreDisposable};')
prefix=core.replace('export default uadavStagingWorker;','')
constants='\nconst CQA_CORE_SHA='+json.dumps(sha)+';\nconst CQA_SQL_NAMES='+json.dumps(sorted(names,key=lambda s:(-len(s),s)))+';\nconst CQA_HTML='+json.dumps((root/'scripts/cartelera-qa-page.html').read_text(),ensure_ascii=False)+';\n'
code=prefix+constants+'const cqaRestore=(()=>{\n'+checksum+'\n'+restore+'\n})();\n'+(root/'scripts/cartelera-qa-runtime.js').read_text()
out=root/'releases/uadav-cartelera-qa-11770.js';out.write_text(code)
manifest={'version':'11770-cartelera-qa-1','purpose':'UADAV_CARTELERA_DISPOSABLE_11770','core_sha256':sha,'file_sha256':hashlib.sha256(code.encode()).hexdigest(),'host':'uadav-cartelera-qa-11770.uadavstream.workers.dev','deployed':False,'d1_remote_verified':False,'real_email_received':False,'operational_routes_exposed':False}
(root/'releases/11770-cartelera-qa-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'file':out.name,'core_sha256':sha,'file_sha256':manifest['file_sha256']}))
