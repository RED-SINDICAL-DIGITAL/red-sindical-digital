# Aprobación real desde Admin móvil

2026-10-14; solo staging. El usuario ingresó a Admin desde su móvil (la PC sufría NXDOMAIN y el navegador remoto no completó el ingreso).

El usuario mostró el envío de PRUEBA VISUAL QA 2235, artist_id ART-81afcfbcafe6419a921b71c625f7ccac, draft_revision 2 y biografía BORRADOR PRIVADO QA · Guardado y reapertura 2256. Se indicó aprobar esa tarjeta; la captura posterior mostró Publicado.

Verificaciones independientes posteriores:
- GET público del artista devolvió HTTP 404 Perfil no disponible: no se hizo visible el perfil privado al aprobar su texto.
- Reapertura del editor en Chrome remoto, mediante la cuenta ficticia que lo creó: recuperó la biografía aprobada y mostró Borrador privado, sin espera de revisión.

Esto valida la aplicación observada del envío correcto y la separación de visibilidad pública. No demuestra recuperación ante interrupciones ni concurrencia completa.

Se creó después otro envío del mismo artista para probar rechazo: biografía PRUEBA DE RECHAZO · Este texto debe conservarse como borrador privado. El editor confirmó En revisión y que continúa privado. La revisión esperada es 3. El usuario debe actualizar el Admin móvil e identificar ese texto antes de rechazarlo. Rechazo y conservación remota del borrador todavía pendientes.

Mejoras UX detectadas: sustituir JSON técnico por ficha legible; traducir artist_profile/provider_not_configured; cambiar Publicado por Cambios aprobados al revisar perfil privado; ocultar enlaces públicos sin destino visible. No se cambiaron permisos ni configuración de IA.
