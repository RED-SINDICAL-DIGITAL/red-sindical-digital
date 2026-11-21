# Publicación pendiente tras fallo de guardado

Si se pulsaba Publicar mientras estaba ocupado el guardado automático, pendingPublication guardaba la intención. El finally anterior lanzaba esa publicación incluso si el guardado previo fallaba por conflicto o transporte incierto.

Se agregó saveSucceeded. La intención en espera solo se ejecuta tras una respuesta exitosa del guardado; ante error se cancela esa intención, se conservan los cambios locales y se informa que hay que revisar y pulsar Publicar nuevamente. No se revierte una escritura que quizá alcanzó el servidor ni se reintenta automáticamente una publicación incierta.

Validación: tests/workspace-autosave.mjs pasa con los escenarios existentes de escritura durante guardado, conflicto y publicación tras éxito; el caso nuevo inyecta un fallo de red con publicación en espera y comprueba una sola llamada, cola vacía, guardado pausado y datos locales conservados. Siete pruebas de sesión de herramientas pasan. Prueba incorporada a CI. Falta prueba visual con PRO de staging activo y sesión vinculada. No cambia Worker ni producción.
