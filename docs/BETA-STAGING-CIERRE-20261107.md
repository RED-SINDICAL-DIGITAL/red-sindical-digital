# UADAV Stream · puerta de salida de beta · staging · 2026-11-07

## Alcance y límites
- Entorno de pruebas: https://uadav-stream-staging.pages.dev/
- API: https://uadav-api-staging.uadavstream.workers.dev/api/
- Producción y base de datos de producción fuera de alcance. Nunca pegar secretos, claves privadas, códigos de recuperación ni correos completos en reportes públicos.
- El CI verde demuestra contratos y simulaciones; no reemplaza una prueba funcional con Worker, D1, Brevo y dispositivo real.
- No borrar registros hasta tener respaldo comprobado. Ocultar registros QA mediante Admin y conservar historial cuando corresponda.

## 0. Confirmar versión publicada (solo lectura)
Abrir `https://uadav-stream-staging.pages.dev/staging-build.json` y comprobar:
1. `environment: staging`.
2. `api` termina en `uadav-api-staging.uadavstream.workers.dev/api/`.
3. `sourceCommit` corresponde al commit de staging que se acaba de integrar o a su despliegue efectivo.
Si no coinciden, **detener pruebas de escritura** y revisar el despliegue Pages. No asumir que la página correcta implica el commit correcto.

## 1. Sanidad y acceso Admin (solo lectura)
1. Consultar `/api/health` del Worker de staging; verificar KV y D1 verdaderos y build correcto.
2. Abrir Admin de **staging**, entrar con clave **solo de staging** y verificar los apartados Bolsa, Cartelera, Mi Perfil/correo, auditoría y publicidad.
3. Comprobar listados, estados, filtros, recibos, respaldos y la vista previa de restauración. No restaurar, migrar, borrar ni habilitar campañas durante el diagnóstico.
4. Revisar la bandeja de consultas comerciales; no mostrar datos privados en capturas públicas.

## 2. Bolsa (una única oferta QA)
1. Publicar una oferta ficticia rotulada `PRUEBA STAGING · NO CONTRATAR`; usar contacto de QA y consentimiento.
2. Comprobar exactamente una ficha en listado. Guardar referencia y clave **en privado**.
3. En una sesión distinta, hacer una postulación QA con consentimiento; comprobar visibilidad y estado desde el titular y desde Admin.
4. Ocultar o dar de baja el registro desde Admin, sin purgar su historial ni las postulaciones. Repetir consulta y verificar que la ficha no se anuncie como activa.

## 3. Cartelera (un evento QA sin cobro)
1. Publicar `PRUEBA STAGING · EVENTO FICTICIO` sin opción paga ni avisos por correo.
2. Verificar publicación inmediata, ID y ficha pública, una sola vez; conservar referencia privada.
3. Probar una solicitud de destaque **sin completar pago real**; verificar que no se active antes de aprobación.
4. Ocultar el evento QA desde Admin, sin borrar el historial; revisar su visibilidad pública.

## 4. Mi Perfil y correo (dos dispositivos reales)
1. Con una cuenta QA propia y correo verificado, completar recuperación por código en el segundo dispositivo.
2. Agregar un favorito de prueba en A, sincronizar y verificarlo en B; después comprobar el cambio inverso.
3. Confirmar que cerrar sesión o revocar un dispositivo no borra involuntariamente la biblioteca del otro.
4. No capturar ni compartir enlaces de acceso, códigos, tokens o mensajes de Brevo completos.

## 5. Comercial y geolocalización (sin cobro real)
1. Admin: verificar que se pueda revisar una consulta comercial de Santa Fe sin activarla automáticamente.
2. Crear o identificar una campaña **QA** autorizada y acotada a Santa Fe, con vigencia breve; nunca cobrar ni usar una campaña ajena para la prueba.
3. Desde una sesión con región Santa Fe, comprobar que se vea en la ubicación contratada. Desde Córdoba, comprobar que **no** se vea.
4. Confirmar, en paralelo, que la campaña nacional (si existe una QA habilitada) se vea en ambas regiones y que el límite visual por espacios se respete.
5. Vencer/desactivar la campaña QA y comprobar que deje de aparecer, conservando sus movimientos para auditoría.
**Nota:** los tests del frontend no demuestran por sí solos que la segmentación territorial del Worker esté configurada correctamente.

## Puerta de promoción
Beta aprobable solo con las seis secciones verificadas, respaldo D1/KV consistente, correo real recibido, registros ficticios ocultos y sin errores de consola críticos en móvil y escritorio. Registrar fecha, build, responsable y comprobación PASS/FAIL de cada caso, sin datos personales. Frente a falla, corregir **solo staging** y repetir las pruebas afectadas. No promover a producción hasta validación expresa.
