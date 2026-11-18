# Door List

Esqueleto de una plataforma de tickets para eventos con Next.js App Router,
TypeScript y Tailwind CSS 4.

## Desarrollo

```sh
npm install
npm run dev
```

Abre http://localhost:3000. En PowerShell, si la política de scripts bloquea
`npm.ps1`, usa `npm.cmd run dev`.

## Compilación

```sh
npm run build
npm start
```

La ruta `/` muestra eventos publicados con fecha de hoy o posterior. Cada evento
tiene una página pública `/eventos/[id]` para registrarse sin iniciar sesión,
con nombre, email y tipo de entrada. El registro reserva un cupo y se cierra
después del día del evento, calculado en `America/Bogota`.
Al confirmar, se crea una entrada con código aleatorio y estado `valid`. La
entrada se consulta en `/tickets/[codigo]` y muestra sus datos, estado y QR.
En `/organizador` se puede crear una cuenta o iniciar sesión con Supabase Auth y
gestionar los eventos y sus tipos de entrada. La fecha se introduce en la zona
horaria local del navegador. Los datos están protegidos por las políticas RLS.

Crea `.env.local` en la raíz con los valores públicos del proyecto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-publica
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=entradas@tu-dominio-verificado.com
```

Después de confirmar un registro, el servidor consulta la entrada y envía un
correo con el evento, fecha, lugar y el QR incrustado. `RESEND_API_KEY` nunca se
expone al navegador; el remitente debe estar verificado en Resend. Durante las
pruebas, `onboarding@resend.dev` solo permite enviar al email propietario de la
cuenta Resend. Para enviar a asistentes, verifica un dominio y usa un remitente
de ese dominio.

Habilita el acceso con correo y contraseña en Supabase Auth y aplica las cuatro
migraciones en orden. Si está activada la confirmación de correo, el usuario debe
confirmar su cuenta antes de iniciar sesión. Nunca uses la clave `service_role`
en estas variables. Los cambios que excedan el aforo total se rechazan; reduce
primero los aforos asignados si quieres reducir el límite del evento.
El modelo de Supabase, su migración y las pruebas de acceso están documentados
en [supabase/README.md](supabase/README.md). No hay exportación estática a `out`.
