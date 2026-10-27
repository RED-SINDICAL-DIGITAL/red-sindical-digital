import {readFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),main=new URL('worker.js',root),restore=new URL('releases/uadav-bolsa-account-restore-11769.js',root),zip=new URL('releases/uadav-bolsa-staging-11769.zip',root),check=process.argv.includes('--check');
if(!(await readFile(main,'utf8')).includes("const BUILD = '11769';"))throw Error('Expected staging11769 main Worker.');
if(!(await readFile(restore,'utf8')).includes('export default {fetch:uadavFullRestoreQA};'))throw Error('Expected isolated restore entrypoint.');
const readme=`UADAV STREAM11769 - SOLO STAGING. DOS ARCHIVOS, DOS WORKERS EXISTENTES.

1. worker.js -> uadav-api-staging. Conservar DB/KV, Admin, BREVO_API_KEY, BREVO_QA_RECIPIENT, JOB_RECOVERY_ENCRYPTION_KEY, cron */15 * * * * y JOB_STAGING_CRON=bolsa-only.
2. restore-qa-worker.js -> uadav-restore-qa. Conservar SU base aislada, QA_RESTORE_KEY y QA_RESTORE_ONLY=true. No poner ese archivo en la API principal.

Pages se publica desde audit/continuidad-demo-20261019. No modificar produccion, no mezclar ramas, no crear claves o bases y no aplicar SQL manual.

CORREO: https://uadav-stream-staging.pages.dev/configurar-correo.html
Entrar con Admin y Preparar. No envia correo y mantiene acceso general apagado.
Desde Mi Perfil, cuenta original, abrir Correo de mi cuenta y solicitar confirmacion al correo de prueba existente. Abrirlo en ese mismo dispositivo/cuenta y confirmar.
Pedir luego un enlace para entrar con ese mismo correo; puede abrirse en el celular para verificar biblioteca/trabajos/perfil. Son dos acciones nuevas: confirmar correo e ingresar, no repetir11767.
Volver a Configurar correo, consultar y copiar el resultado seguro. Habilitar acceso en staging solo queda disponible despues de ambas pruebas reales. No se activa al desplegar.
Los antiguos enlaces por clave de oferta siguen apagados; los trabajos guardados se recuperan entrando a la cuenta de Mi Perfil. No se adopta una oferta por coincidir su correo publico.

RESPALDO: despues de confirmar e ingresar por correo, volver a Configurar correo y Descargar respaldo actual. Guardarlo en privado. Es una captura nueva para probar los nuevos datos de cuenta; no repite la prueba de vencimiento11768.
Ensayo: https://uadav-restore-qa.uadavstream.workers.dev/
Usar la clave exclusiva QA existente, seleccionar ese respaldo nuevo11769 y confirmar el ensayo aislado. Un respaldo11768 tambien es aceptado como historico, pero no prueba la identidad de correo nueva. No subirlo a GitHub o al chat. Copiar solo resultado seguro; luego puede borrarse la copia aislada con su boton. Los datos anteriores del laboratorio se conservan.
El ensayo cubre Bolsa, cuentas/biblioteca/dispositivos, vinculos artisticos, avisos y las claves KV del respaldo; no afirma recuperacion de toda la plataforma o pagos. La restauracion operativa principal sigue apagada.

FUENTES: Admin > Fuentes. Agencia Beat usa su feed publico en Google y solo categorias de convocatorias/empleo. Cero candidatos no es un error. No convierte noticias generales en trabajos. Fuentes no aprobadas: HTML o CSV, siempre con revision previa de la ficha.

Guia y limites: docs/BOLSA-11769-ENTREGA-INTEGRADA.md
`;
const script=check?'import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;assert z.namelist()==["worker.js","restore-qa-worker.js","LEEME-STAGING.txt"];assert z.read("worker.js")==open(sys.argv[2],"rb").read();assert z.read("restore-qa-worker.js")==open(sys.argv[3],"rb").read();assert z.read("LEEME-STAGING.txt").decode()==sys.argv[4]':'import sys,zipfile;z=zipfile.ZipFile(sys.argv[1],"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9);items=[("worker.js",open(sys.argv[2],"rb").read()),("restore-qa-worker.js",open(sys.argv[3],"rb").read()),("LEEME-STAGING.txt",sys.argv[4].encode())];[(lambda i,d:(setattr(i,"compress_type",zipfile.ZIP_DEFLATED),z.writestr(i,d,compresslevel=9)))(zipfile.ZipInfo(n,(2026,10,27,18,0,0)),d) for n,d in items];z.close()';
execFileSync('python3',['-c',script,fileURLToPath(zip),fileURLToPath(main),fileURLToPath(restore),readme]);console.log(check?'11769 integrated ZIP contents and CRC verified.':'Prepared11769 integrated ZIP; no deployment.');
