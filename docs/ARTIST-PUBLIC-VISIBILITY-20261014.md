# Public artist visibility and catalog metadata — 2026-10-14

Reproduced: public/artista returned a hidden artist when afiliado_verificado=true. Affiliation no longer overrides explicit hiding. Central public visibility also excludes suspended/blocked/hidden/deleted states and is used by public projections; shorts avoid external fetching for hidden artists. Catalog, share and Press Kit visibility filters reuse that projection.

The legacy public GET /api/artistas previously returned entire visible records, including claim_email and claim_name. It now returns the public artist projection; authenticated Admin receives full records. Added public name alias, province/country and public PRO status/expiry to maintain common legacy presentation needs. Claim contacts are excluded. Consumer compatibility beyond these tested fields requires staging validation.

Found/fixed an undefined regionMode variable in the regional artist feed. Integration test confirms regional listing responds successfully and excludes hidden/suspended artists.

PASS actual Worker + SQLite visibility/privacy test; 38 node:test cases; claim lifecycle; FREE/PRO; Press Kit publication privacy; payment fulfillment and signed bank adapter. Syntax passed. No real production records inspected, no staging/production deployment. Broad nested-field/public contact policies and every discovery/live endpoint still need audit; this is not a declaration that all public responses are fully audited.
