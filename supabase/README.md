# Modelo de datos de Door List

Aplicar las migraciones en este orden: `20261109000000_create_events_and_ticket_types.sql`,
`20261112000000_event_capacity.sql`, `20261116000000_public_registrations.sql`,
`20261117000000_add_tickets_to_existing_registrations.sql` y
`20261120000000_normalize_ticket_statuses.sql` y
`20261123000000_organizer_registration_access.sql` y
`20261123000001_reconcile_registration_schema.sql`.

La última migración concede lectura de `registrations` solo a usuarios autenticados
y su política RLS limita las filas a eventos cuyo `organizer_id` coincide con el
usuario actual. `/dashboard` usa esa lectura para mostrar aforo y asistentes.
La prueba `tests/organizer_dashboard_access.sql` comprueba acceso del dueño y
denegación para otros organizadores y visitantes.
La migración de reconciliación alinea bases creadas antes de usar el historial
de la CLI: normaliza el nombre del índice único de email y evita borrar registros
al eliminar un tipo de entrada. En bases nuevas no necesita modificar nada.

La migración de registros crea `registration_options` y `create_registration`.
Ambas se pueden llamar con la clave pública sin sesión. La tabla de registros no
concede lectura ni escritura directa a visitantes; la función de creación
comprueba publicación, fecha y cupos dentro de una transacción. Solo se admite
un email por evento. La migración de tickets evoluciona el registro para crear
un código aleatorio y estado `valid`; `ticket_by_code` expone únicamente los
datos asociados a un código.

La migración de estados transforma los valores existentes `use it` y `revoke` en
`used` y `revoked`. Los estados vigentes son `valid`, `used` y `revoked`.
Aplica esta migración antes de desplegar la interfaz que muestra esos estados.

Aplicar también `migrations/20261112000000_event_capacity.sql` después de la
migración inicial. Agrega el aforo obligatorio del evento y rechaza cambios que
hagan que la suma de los tipos exceda ese límite, incluso al reducir el aforo
del evento. Para eventos existentes asigna inicialmente el mayor entre 1 y la
suma de los tipos; revisa y ajusta esos límites. Las pruebas de acceso requieren
ambas migraciones aplicadas.

La migración `migrations/20261109000000_create_events_and_ticket_types.sql`
crea el modelo aprobado en el esquema `public`. Requiere Supabase Auth
(`auth.users`, `auth.uid()`) y los roles estándar de Supabase.

## Aplicar la migración

En un proyecto Supabase nuevo, ejecutar el archivo completo en el SQL Editor.
Como alternativa, con `psql` instalado y la conexión de Postgres en la variable
de entorno `DATABASE_URL`, ejecutar desde la raíz del repositorio:

```powershell
psql "$env:DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/20261109000000_create_events_and_ticket_types.sql
```

Aplicar una sola vez. La migración es transaccional: si falla, no deja el modelo
parcialmente creado. También puede incorporarse al flujo de migraciones de la
CLI de Supabase cuando se configure. No requiere dependencias de JavaScript.

## Tablas y relaciones

| Tabla | Campos |
| --- | --- |
| `events` | `id uuid`, `organizer_id uuid`, `title text`, `description text`, `starts_at timestamptz`, `venue text`, `status text`, `created_at timestamptz` |
| `ticket_types` | `id uuid`, `event_id uuid`, `name text`, `capacity integer`, `created_at timestamptz` |

Todos los campos son obligatorios. Los UUID y `created_at` se generan
automáticamente. `organizer_id` toma por defecto el usuario actual. El estado
inicial es `borrador`; el único otro estado permitido es `publicado`.
Los textos de contenido rechazan valores vacíos o compuestos solo por espacios,
tabulaciones o saltos de línea. El aforo debe ser un entero mayor que cero.

Un usuario de Supabase Auth puede organizar varios eventos. Cada evento admite
varios tipos de entrada, o ninguno mientras se configura; publicar no exige tipos.
Eliminar un evento elimina sus tipos mediante `ON DELETE CASCADE`. Eliminar un
usuario con eventos queda restringido. Ambas claves foráneas tienen índices.

## Acceso

RLS está habilitado en ambas tablas, con permisos explícitos por operación:

| Rol | Lectura | Escritura |
| --- | --- | --- |
| `anon` | Eventos publicados y sus tipos | Ninguna |
| `authenticated` | Publicados y sus propios borradores, con sus tipos | Crear, modificar y eliminar únicamente sus eventos y tipos |

La propiedad se comprueba con `auth.uid()`. No se puede crear un evento a nombre
de otro usuario, transferirlo a otro organizador ni mover tipos a eventos ajenos.
Los tipos heredan los permisos del evento y no duplican el organizador.
Las modificaciones validan tanto la fila existente como el resultado.

La aplicación usa la clave pública y la sesión del usuario. `service_role`
conserva acceso administrativo y omite RLS; su clave solo debe utilizarse en
el servidor.

## Fechas y aforo

Enviar `starts_at` como ISO 8601 con zona o desplazamiento explícito, por ejemplo
`2026-12-12T19:00:00-05:00`. Postgres conserva el instante, no el nombre de la zona
original. Convertirlo a la zona de presentación al mostrarlo.

`capacity` define el máximo del evento o de cada tipo; todavía no hay compras, reservas,
ocupación, control de sobreventas ni precios.

## Pruebas

En una base Supabase de desarrollo desechable, después de aplicar la migración:

```powershell
psql "$env:DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/tests/events_access.sql
```

Ejecutar como `postgres` para crear usuarios de prueba y simular los roles
`anon` y `authenticated`. Las funciones auxiliares usan los permisos del llamador.
El archivo verifica restricciones, valores por defecto, zonas horarias,
lectura pública, publicación y vuelta a borrador, aislamiento entre organizadores,
transferencias prohibidas y borrado en cascada. Todos sus datos y funciones se
crean dentro de una transacción que se revierte. Un fallo detiene la ejecución
y produce un código de salida no cero.

La validación inicial se ejecutó en PostgreSQL 16 aislado, con una tabla mínima
`auth.users`, la función `auth.uid()` basada en el identificador de sesión y los
roles de Supabase simulados. Falta ejecutar estas mismas pruebas en el proyecto
Supabase de destino; no se ha aplicado la migración a una base remota.
