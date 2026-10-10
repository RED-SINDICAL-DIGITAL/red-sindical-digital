import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../uadav-update-v149.js', import.meta.url), 'utf8');

class Node {
  constructor(tag) { this.tagName = tag; this.children = []; this.listeners = {}; this.attributes = {}; this.style = {}; this.dataset = {}; }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  remove() { this.removed = true; }
  click() { this.listeners.click?.(); }
}

function runtime(serverBuild, storage) {
  const body = new Node('body'), head = new Node('head');
  const listeners = {};
  const document = {
    body, head, hidden: false,
    addEventListener(name, fn) { listeners[name] = fn; },
    createElement: tag => new Node(tag),
    getElementById: id => body.children.find(node => node.id === id) || null,
  };
  let reloads = 0;
  const window = { parent: null, addEventListener(name, fn) { listeners['window:' + name] = fn; } };
  window.parent = window;
  const context = vm.createContext({
    window, document, localStorage: storage,
    location: { reload() { reloads++; } },
    fetch: async () => ({ ok: true, json: async () => ({ build: serverBuild, message: 'Actualización lista' }) }),
    setInterval() {}, Date, Number, String,
  });
  vm.runInContext(source, context);
  return new Promise(resolve => setImmediate(() => resolve({ body, head, get reloads() { return reloads; } })));
}

const values = new Map();
const storage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key),
};

let page = await runtime(12057, storage);
assert.equal(page.body.children.filter(x => x.id === 'uadav-update-notice').length, 0, 'current build is quiet');

page = await runtime(12058, storage);
let notice = page.body.children.find(x => x.id === 'uadav-update-notice');
assert(notice, 'new build shows an update notice');
const later = notice.children[2].children.find(x => x.textContent === 'Más tarde');
later.click();
assert.equal(values.get('uadav_update_dismissed_build_v1'), '12058', 'dismissal is stored for the shown build');

page = await runtime(12058, storage);
assert.equal(page.body.children.filter(x => x.id === 'uadav-update-notice').length, 0, 'dismissal survives reload');

page = await runtime(12059, storage);
notice = page.body.children.find(x => x.id === 'uadav-update-notice');
assert(notice, 'a later build can still notify again');
notice.children[2].children.find(x => x.textContent === 'Actualizar').click();
assert.equal(page.reloads, 1, 'update button reloads the app');
assert.equal(values.has('uadav_update_dismissed_build_v1'), false, 'update action clears the deferral');

console.log('PASS: update notice remembers “Más tarde” per device and prompts again only for a later build');
