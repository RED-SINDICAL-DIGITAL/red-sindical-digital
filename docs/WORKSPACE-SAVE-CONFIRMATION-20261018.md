# Mis herramientas: confirmar guardado — 18/10/2026

Se valida success=true, revisión exactamente siguiente y estado published booleano antes de limpiar los cambios locales. Se rechazan publicaciones declaradas exitosas sin publicación ni moderación pendiente y retiros que todavía informan publicado. Una respuesta incompleta no actualiza revisión ni habilita una publicación en espera; conserva los textos y pausa autosave para evitar sobrescritura o repetición automática.

La revisión pendiente tiene mensaje propio incluso si el servidor omite su texto. Se preservan conflictos 409 y la recarga explícita con advertencia de descarte.

Pruebas satisfactorias: script real de autosave con escritura simultánea, conflictos, cola de publicación, corte de red y respuestas incompletas/contradictorias; 15 pruebas de herramientas privadas y acceso; integración aislada Worker/SQLite de privacidad y publicación. No equivalen a prueba física entre dispositivos ni recuperación tras cerrar el navegador: los cambios no confirmados permanecen en la pantalla actual.

Worker, pagos y producción sin cambios. La sesión real del artista sigue como condición de cierre de demo.
