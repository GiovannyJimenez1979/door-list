## Contexto

Asume que la versión instalada de Next.js puede diferir de lo que conoces y consulta su documentación oficial en `node_modules/next/dist/docs/` antes de escribir código de framework.
Usa Server Components por defecto y añade `"use client"` solo cuando el componente necesite una capacidad exclusiva del cliente.

## Estructura

Ubica las rutas en `app/`, la UI compartida en `components/`, la lógica y las utilidades compartidas en `lib/`, los clientes de Supabase en `lib/supabase/` y los cambios de esquema en `supabase/migrations/`.
Ubica junto a su ruta los componentes usados por una sola ruta y mueve a `components/` los usados por dos o más rutas.

## Vocabulario

Usa `Event`, `TicketType`, `Ticket` y `Registration` con significados consistentes y distintos en todo el repositorio.
Nombra las tablas según su entidad, en plural y `snake_case`: `events`, `ticket_types`, `tickets`, `registrations`.

## Idioma

Escribe el código, los identificadores y los tipos en inglés, y el texto visible de la interfaz en español.
Nombra las rutas públicas en español y los componentes que las sirven en inglés.

## Casing

Limita `snake_case` a la capa de persistencia y usa `camelCase` en los contratos de solicitud y respuesta de la API.

## Fuente única de verdad

Define en `lib/` los tipos compartidos entre API, correo y UI y los helpers compartidos de fecha y formato; reutilízalos sin redefinir tipos por archivo ni copiar helpers entre pantallas.

## Errores

Devuelve todos los errores de la API como JSON con la forma `{ error: string }` y usa el código HTTP correspondiente para los errores de negocio, nunca `200`.
Comprueba `response.ok` antes de interpretar el cuerpo de una respuesta en el cliente y muestra en la UI mensajes de error propios en lugar de mensajes crudos del proveedor.

## Base de datos

Registra cada migración en un archivo versionado dentro de `supabase/migrations/` y evita ejecutar SQL de esquema fuera de una migración versionada.
Habilita RLS en toda tabla expuesta.

## Sistema de diseño

Antes de crear, modificar o revisar UI visible, lee y aplica `.agents/skills/door-list-ui/SKILL.md`. Esto incluye pantallas, filtros de tabla, formularios, diseño responsive y estados de carga, vacío y error. No se aplica a migraciones, rutas API sin UI, emails ni cambios de datos, tipos o lógica sin impacto visual.
