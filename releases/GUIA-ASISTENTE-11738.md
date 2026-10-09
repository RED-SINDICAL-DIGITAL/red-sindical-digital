# Mi asistente · Artista PRO · Worker 11738

Herramientas: presentación, promoción y respuesta a consultas. Devuelve texto editable y copiable; no modifica perfil, press kit ni mensajes. No guarda el texto o resultado en D1. Sí registra el intento con id de artista, día UTC y proveedor para controlar el uso.

Desplegar releases/worker-UADAVSTREAM-V11.7-11738.js manteniendo KV, D1 y secretos. Incluye las funciones de 11737 y anteriores.

Admin → Monetización → Asistente Artista PRO → Configurar asistente y límites. Apagado por defecto. Proveedor Gemini o Groq; requiere la clave correspondiente ya configurada en el Worker. Se reutilizan GEMINI_MODEL y GROQ_MODEL si existen. Las claves nunca llegan al navegador.

Configuración inicial sugerida: 10 intentos por artista/día y 100 para la plataforma/día. Son topes de solicitudes, no una garantía de costo cero. Los intentos fallidos consumen cupo. Día medido en UTC. El nivel y presupuesto del proveedor se administran en su cuenta.

Mi espacio de artista → Mi asistente. Antes de generar, el artista autoriza enviar el texto que escribe, nombre artístico, especialidad y ciudad al proveedor visible. No se adjuntan clientes, presupuestos, agenda ni contacto privado automáticamente. Si Administración cambia el proveedor, se exige reabrir y revisar la autorización.

D1 crea artist_ai_usage y su índice al generar; se incluye en el respaldo. La reserva de cupo es una única sentencia condicional. La tabla no contiene prompts ni respuestas. No implementa moderación de toda la plataforma.

Pruebas automatizadas con proveedor simulado: acceso, PRO, desactivación, consentimiento, proveedor acordado, acciones permitidas, privacidad del contexto, topes y redacción de errores. Pendiente prueba real con el modelo/clave del despliegue y revisión de sus condiciones de datos.
