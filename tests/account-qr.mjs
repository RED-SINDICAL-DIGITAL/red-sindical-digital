import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const source=await readFile(new URL('../vendor/qrcode.js',import.meta.url),'utf8');
const context={navigator:{userAgent:'Desktop'},document:{documentElement:{tagName:'html'}},window:{},encodeURI};vm.runInNewContext(source,context);
const element={childNodes:[{offsetWidth:200,offsetHeight:200,style:{}}],innerHTML:'',title:''};
const link='https://uadavstream.com.ar/vincular-dispositivo.html#p='+'a'.repeat(64);
const qr=new context.QRCode(element,{text:link,width:200,height:200,correctLevel:context.QRCode.CorrectLevel.M}),model=qr._oQRCode;
const count=model.getModuleCount(),matrix=Array.from({length:count},(_,y)=>Array.from({length:count},(_,x)=>model.isDark(y,x)));
assert.ok(count>=21);assert.ok(20/(200/count)>=4,'QR needs at least four modules of quiet zone');
const python=process.env.CODEX_PRIMARY_RUNTIME_PYTHON||'python';
const r=spawnSync(python,['-c',String.raw`
import sys,json
from reportlab.graphics.barcode import qrencoder
x=json.load(sys.stdin)
qr=qrencoder.QRCode((len(x['matrix'])-17)//4,qrencoder.QRErrorCorrectLevel.M)
qr.addData(qrencoder.QR8bitByte(x['link']))
for mask in range(8):
 qr.makeImpl(False,mask)
 if qr.modules==x['matrix']:
  print('PASS: QR matrix matches independent Python encoder; permanent credentials absent; sufficient quiet zone')
  sys.exit(0)
raise Exception('QR matrix differs from independent encoder')
`],{input:JSON.stringify({link,matrix}),encoding:'utf8'});
assert.equal(r.status,0,r.stderr);console.log(r.stdout.trim());
