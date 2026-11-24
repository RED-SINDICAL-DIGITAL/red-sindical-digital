// Recreate the persisted relationships of registrations made before direct publication.
import assert from 'node:assert/strict';
export async function legacyDraft(db, call, request, credential) {
  const registration = await call('artista/claim', 'POST', request, '');
  assert.equal(registration.status, 200);
  assert.equal(registration.data.status, 'pending');
  const {id, artist_id} = registration.data;
  const identity = await call('account/identity', 'GET', null, credential);
  assert.equal(identity.status, 200);
  const account = identity.data.account_id;
  const now = Date.now(), date = new Date(now).toISOString();
  await db.batch([
    db.prepare('INSERT INTO audience_artist_claims(claim_id,account_id,artist_id,created_at,linked_at) VALUES(?,?,?,?,?)').bind(id,account,artist_id,now,now),
    db.prepare("INSERT INTO artist_owners(id,artist_id,claim_id,contact_email,role,status,verification_level,created_at,updated_at) VALUES(?,?,?,?,'owner','active','draft_creation',?,?)").bind('OWN-'+id,artist_id,id,request.email,date,date),
    db.prepare('INSERT INTO audience_artist_links(account_id,artist_id,claim_id,expires_at,created_at) VALUES(?,?,?,0,?)').bind(account,artist_id,id,now)
  ]);
  return registration;
}
