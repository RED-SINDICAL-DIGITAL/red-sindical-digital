import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),worker=new URL('worker.js',root),zip=new URL('releases/uadav-api-staging-11768.zip',root),check=process.argv.includes('--check');
const source=await readFile(worker,'utf8');
if(!source.includes("const BUILD = '11768';")||!source.includes('/* BEGIN JOB BACKUP STAGING */'))throw Error('Wrong staging Worker for11768 package.');
const readme=`UADAV STREAM11768 - SOLO uadav-api-staging

Extraer worker.js. En Workers & Pages > uadav-api-staging > Edit code, reemplazar el codigo y Deploy.
Conservar DB/KV, Admin, BREVO_API_KEY, BREVO_QA_RECIPIENT, JOB_RECOVERY_ENCRYPTION_KEY, cron */15 * * * * y JOB_STAGING_CRON=bolsa-only.
No requiere claves, base, Worker, correo, Pages, SQL manual o cron nuevos. No modificar produccion o laboratorios.

Abrir https://uadav-api-staging.uadavstream.workers.dev/qa/bolsa-cierre
Entrar con Admin staging. Consultar y descargar el respaldo privado. Guardarlo y marcar la confirmacion.
Consultar despues de otro turno del cron de15min. Si vence Admin a10min, volver a entrar en la misma pestana: se conserva solo la comparacion segura en memoria.
Compartir solo Copiar resultado seguro. Nunca subir el respaldo completo, claves o enlaces privados a chat o GitHub.

La consulta no modifica ofertas, postulaciones o avisos. El backup usa una captura D1 coherente y excluye autenticacion temporal.
El cron existente limpia como maximo25 intenciones vencidas y25 intenciones terminales de mas de7dias, ademas de25 metadatos diagnosticos antiguos por turno. No envia correos.
La restauracion operativa y la recuperacion publica siguen deshabilitadas. No activar sus variables.
Guia: docs/BOLSA-11768-RESPALDO-Y-VENCIMIENTO.md
`;
const script=check?
 'import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;assert z.namelist()==["worker.js","LEEME-STAGING.txt"];assert z.read("worker.js")==open(sys.argv[2],"rb").read();assert z.read("LEEME-STAGING.txt").decode()==sys.argv[3]':
 'import sys,zipfile;z=zipfile.ZipFile(sys.argv[1],"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9);items=[("worker.js",open(sys.argv[2],"rb").read()),("LEEME-STAGING.txt",sys.argv[3].encode())];[(lambda i,d:(setattr(i,"compress_type",zipfile.ZIP_DEFLATED),z.writestr(i,d,compresslevel=9)))(zipfile.ZipInfo(n,(2026,10,27,7,0,0)),d) for n,d in items];z.close()';
execFileSync('python3',['-c',script,fileURLToPath(zip),fileURLToPath(worker),readme]);
console.log(check?'11768 ZIP identity and CRC verified.':'11768 staging ZIP prepared; no deployment.');
