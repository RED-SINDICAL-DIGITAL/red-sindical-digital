import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../artistas.html', import.meta.url), 'utf8');
assert.match(html, /\.categories\{[^}]*overflow-x:auto/);
assert.match(html, /\.categories>\.chip\{flex:0 0 auto|\.categories \.chip\{flex:0 0 auto/);
assert.match(html, /\.categories[^}]*white-space:nowrap!important/);
assert.match(html, /\.grid\{grid-template-columns:repeat\(2,1fr\)/);
console.log('PASS: artist category chips keep readable widths and scroll horizontally on mobile');
