#!/usr/bin/env node
// Audit-only diagnostic: intentionally exits nonzero if the recovery contract is mismatched.
// Run separately: node scripts/audit-account-recovery-contract.mjs
import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../qa/admin-v2/worker.js',import.meta.url),'utf8');
const sync=readFileSync(new URL('../uadav-account-sync.js',import.meta.url),'utf8');
const profile=readFileSync(new URL('../usuario.html',import.meta.url),'utf8');
const checks=[
  ['Alta de cuenta disponible',worker.includes("if(path==='/api/account')")],
  ['Recuperación mediante clave privada',worker.includes("if(path==='/api/account/recovery')")],
  ['Cliente solicita rotación atómica',sync.includes("'account/recovery/atomic'")],
  ['Servidor implementa la ruta atómica',worker.includes("path==='/api/account/recovery/atomic'")],
  ['Cliente exige versión de recuperación',sync.includes('identity.recovery_version')],
  ['Servidor expone versión de recuperación',worker.includes('recovery_version')],
  ['Texto de acceso sin verificación de correo ficticia',profile.includes('activá tu acceso privado.')]
];
for(const [label,ok] of checks)console.log((ok?'OK  ':'FALTA  ')+label);
const contract=checks.filter(([label])=>label.includes('Servidor implementa')||label.includes('Servidor expone'));
if(contract.some(([,ok])=>!ok)){
  console.error('CONTRATO NO COMPATIBLE: no probar rotación de claves reales ni desplegar sin auditar todos los Workers/despliegues.');
  process.exitCode=1;
}
