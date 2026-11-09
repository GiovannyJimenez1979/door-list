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

Una sola ruta (`/`) muestra un evento fijo definido en `src/app/page.tsx`:
título, fecha, lugar y el botón “Registrame”, todavía sin acción.
Sin base de datos, servicios externos ni exportación estática a `out`.
