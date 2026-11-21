# Revisión de contenido y acceso de artistas — 14/10/2026

## Evidencia real en staging

El usuario rechazó el envío de contenido de PRUEBA VISUAL QA 2235 desde Admin móvil. Se reabrió el editor desde la cuenta de prueba: el acceso continuó operativo, el estado mostró «Necesita cambios» y la biografía «PRUEBA DE RECHAZO · Este texto debe conservarse como borrador privado.» se conservó. Esto verifica el rechazo de contenido; no es una prueba de rechazo de titularidad.

## Cambios de interfaz

- Pendientes distingue «Acceso a perfiles de artista» de «Moderación»; acciones «Revisar acceso», «Rechazar acceso», «Revisar contenido», «Rechazar contenido».
- Moderación muestra nombre, versión y presentación cuando están disponibles. JSON e identificadores quedan en detalles técnicos plegados.
- Una carga JSON inválida de un elemento no cancela el resto de la bandeja.
- Aprobar cambios de perfil no se describe como publicación: se conserva la visibilidad existente.
- El editor no ofrece el enlace público para perfiles privados y explica borrador, revisión y rechazo.

## Validación

Prueba local con DOM simulado: nombre, texto, detalles plegados, aislamiento de JSON inválido y contrato POST de rechazo correctos. Sintaxis de ambos scripts Admin y script inline del editor correcta. 16 pruebas de acceso, renovación y sesión del artista correctas. GitHub Actions del commit 0ecaccbe56eaa7a7abc815a08258c305133247f9: Signal onboarding y Job status satisfactorios. Manifest remoto de Pages confirmó ese commit desplegado para Admin. El cambio posterior del editor 59ad4b2f4f1b54fce0debc4ef5f490a504eba4cd todavía requiere verificación desplegada.

## Límites y siguiente paso

No se dispone de sesión Admin autenticada en el navegador del agente; falta inspección visual autenticada del nuevo Admin en móvil y PC. No se modificó producción, main ni Worker. Falta revisar Mi perfil, herramientas PRO y circuitos de pago; no se declara la plataforma terminada. La aprobación entre D1 y KV aún requiere pruebas adicionales de concurrencia y recuperación.
