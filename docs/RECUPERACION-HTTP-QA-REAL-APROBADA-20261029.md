# Validación real de recuperación HTTP QA — 29/10/2026

Worker staging 11770 con QA HTTP activa, recuperación general de ofertas reales deshabilitada. Versión desplegada correspondiente a e7195cca822342546783b0606f23a069660f5631.

Nueva prueba iniciada desde /qa/recuperacion-oferta después de corregir el bloqueo de una prueba histórica. Consentimiento explícito, oferta ficticia cerrada, una reserva de envío al correo QA configurado. No se repitió el envío.

El operador aportó dos capturas: «Acceso recuperado / La clave anterior dejó de funcionar» y «Oferta guardada en Mi Perfil». El agente consultó el resultado privado sin reenviar y observó result=complete, sandbox=false, provider_accepted=true, real_email_received=true, recovery_enabled=false, http_qa_flow=true. Checks: enlace recibido y confirmado; clave anterior revocada; acceso privado con nueva clave; oferta ficticia conservada sin publicación, todos aprobados.

http_qa_flow=true procede de la marca registrada por la solicitud HTTP de ESTA prueba; no se reutiliza la aprobación histórica. El guardado en Mi Perfil se acredita mediante la captura del operador, no mediante lectura de su cuenta o claves por el agente.

Conclusión acotada: integración HTTP validada de extremo a extremo con correo real para la oferta ficticia QA. No habilita ni certifica recuperación general de ofertas antiguas reales. La prueba permanece cerrada y conservada como evidencia; no borrar el acceso guardado por el operador. No se registran enlaces, tokens, claves o datos de postulantes en este documento. Producción sin cambios.
