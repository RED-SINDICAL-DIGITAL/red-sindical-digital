// UADAV STREAM — retire the legacy offline worker without interrupting open work.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>{
  // No fetch handler remains, so retained caches cannot be served by this worker.
  // Do not purge origin-wide caches or reload tabs with unsaved forms/playback.
  event.waitUntil(self.registration.unregister());
});
