// Run: node --test tests/artist-session-paths.test.cjs
// Reads the actual helper from gestionar-artista.html, not a duplicate implementation.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'gestionar-artista.html'), 'utf8');
const match = html.match(/function withArtistToken\(path,nextToken\)\{[^\n]+\}/);
assert.ok(match, 'artist retry URL helper exists');
const context = { URL, API_REMOTE: 'https://uadav-api.uadavstream.workers.dev/api/' };
vm.runInNewContext(match[0], context);

test('artist token refresh keeps API-relative path and updates token query', () => {
  assert.equal(context.withArtistToken('artista/access?token=OLD&tab=perfil', 'NEW'), 'artista/access?token=NEW&tab=perfil');
});

test('artist token refresh preserves non-token parameters', () => {
  assert.equal(context.withArtistToken('artist/plan?token=OLD&artist_id=123', 'NEW'), 'artist/plan?token=NEW&artist_id=123');
});

test('artist token refresh does not inject token into public paths', () => {
  assert.equal(context.withArtistToken('cct/categories', 'NEW'), 'cct/categories');
});

test('artist token refresh encodes special characters safely', () => {
  assert.equal(context.withArtistToken('artist/plan?token=OLD', 'A+B/C'), 'artist/plan?token=A%2BB%2FC');
});
