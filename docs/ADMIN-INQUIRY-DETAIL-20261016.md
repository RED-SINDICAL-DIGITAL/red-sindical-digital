# Inquiry detail clarity — 2026-10-16 UTC

Actual staging detail showed saved synthetic contact/event/body and disclaimer, but exposed raw pendiente, offered Reabrir on an already open inquiry, and named window close Cerrar edición.

Changed detail heading to Consulta de contratación with full reference preserved in body. States display Spanish labels. Open inquiries offer Marcar como cerrada; closed ones offer Reabrir consulta. Volver a consultas closes only the window. Generic modal close aria-label now Cerrar ventana. State confirmation explicitly says no message is sent. Underlying state values/endpoints unchanged; production untouched.

Deployed syntax/browser/state persistence verification pending at initial checkpoint. No external messages or real client data used.

## Completed live verification

Focused Node check of actual detail renderer passed open/closed labels and conditional action selection. Deployed browser showed Nueva, Marcar como cerrada, Volver a consultas and Cerrar ventana. Used existing synthetic inquiry CON-0fe1652283a3a3f956ec9b876559acdb0d16b77b552f29bb25a30bb36ece4852 to test Admin PATCH against real staging API: state Cerrada appeared after refreshed requests view; reopening detail offered only Reabrir consulta. Reopened and observed Nueva after refresh, exactly one inquiry retained. Final screenshot captured; no messages sent. Synthetic artist visibility untouched/hidden. Private artist inbox still not verified in the current browser session.
