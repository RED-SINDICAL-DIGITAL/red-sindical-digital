# Artist workspace identity isolation — 2026-10-14

Found in mi-espacio-artista.html: a 401 retry used generic restore(), potentially selecting another artist from the same account if the remembered artist changed. The retried response also lacked an account-change check. Before correction three of four initial behavioral tests failed.

Correction pins renewal to the workspace state's artist_id (or explicitly requested artist_id during initial load), calls session(id) instead of selecting another artist and checks account identity before requests, after the health prerequisite, after renewal and after response parsing. Unexpected response artist_id is denied. Without an artist identity the expired workspace fails closed and asks to reopen from My Profile. Forbidden access is not renewed. Existing revision/conflict and FREE/PRO handling retained.

Validation: five tests using the actual workspace call function PASS; four artist tool requester tests PASS; actual Worker + SQLite FREE/PRO lifecycle PASS; workspace inline syntax PASS. No live artist contents read/written, no visual editor interaction claimed. CI updated; current run not checked. Separate managing-page session branch remains unintegrated. No staging or production deployment.
