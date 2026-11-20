# Auditoría de convenciones

Actualizada el 20 de noviembre de 2026. `AGENTS.md` establece las convenciones del repositorio.

| Hallazgo original | Estado actual |
| --- | --- |
| La portada consultaba `published`, que no es un estado válido de `events`. | Resuelto: consulta `publicado`. |
| Los estados de `tickets` mezclaban `valid`, `use it` y `revoke`. | Resuelto en el código y en la migración `20261120000000_normalize_ticket_statuses.sql`: `valid`, `used`, `revoked`. La aplicación remota de la migración está por verificar. |
| `/eventos/[id]/registro` solo reexportaba otra página. | Resuelto: contiene el registro; `/eventos/[id]` redirige a esa ruta. |
| El panel se implementaba fuera de `organizador/`. | Resuelto: `organizador/Organizer.tsx` está junto a su ruta. |
| El panel mostraba mensajes crudos de Supabase. | Resuelto: muestra mensajes propios. |
| La portada usaba un mensaje genérico para fallos de carga. | Se conserva: es un mensaje propio de la UI y no expone datos del proveedor. |
| El correo devolvía `404` tanto para una entrada ausente como para una consulta fallida. | Resuelto: `404` para ausencia y `502` para fallo del servicio de datos. |
| El panel anunciaba éxitos y errores con `role="status"`. | Resuelto: los errores usan `role="alert"` y los éxitos `role="status"`. |
| Un éxito de guardado podía sobrescribir el error de recarga. | Resuelto: el éxito solo se muestra si la recarga termina bien. |

## Pendiente de verificación externa

El repositorio contiene cinco migraciones. No se ha comprobado desde este entorno el historial de migraciones del proyecto Supabase enlazado ni se ha aplicado la migración nueva al proyecto remoto. Antes de desplegar el código que muestra los nuevos estados, aplica `20261120000000_normalize_ticket_statuses.sql` y verifica que las cinco migraciones figuren como aplicadas.
