/* Experimental per-event publication snapshot. Not a catalog or live state. */
export function publicationKey(id){if(typeof id!=='string'||!/^[-A-Za-z0-9_]{1,120}$/.test(id))throw Error('Invalid event identifier');return 'event-publication-snapshot:v1:'+id}
export async function savePublicationSnapshot(kv,event){const key=publicationKey(event?.id);if(!kv?.put)throw Error('Storage unavailable');await kv.put(key,JSON.stringify(event));return key}
