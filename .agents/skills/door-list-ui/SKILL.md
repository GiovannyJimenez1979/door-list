---
name: door-list-ui
description: Apply or review the Door List design system for requests about screens, tables, forms, responsive layout, and visible loading, empty, or error states. Skip migrations, API-only routes, emails, and data or type changes without visual impact.
---

# Door List UI

Use this skill when the request creates, changes, or reviews how a screen renders in Door List. It defines the visual contract; `AGENTS.md` defines repository structure, language, and framework rules. Preserve an existing feature's behavior unless the user requests a behavior change. Invoke it explicitly with `$door-list-ui` or let automatic selection apply it.

## Triggers / disparadores

Trigger examples: "Crea la pantalla de...", "Añade filtros a esta tabla", "Mejora el estado vacío", "Haz esta página responsive", "Refactoriza estos formularios", and "Revisa si esta pantalla respeta el diseño". A visual review triggers the skill even when no code edit is requested.

## Exclusions / exclusiones

Do not trigger it for Supabase migrations, API routes without UI, email-only changes, type or logic corrections without visual impact, or data queries that do not change how the screen renders. For mixed requests, apply it only to the visible UI portion.

## Invariants

- Keep visible copy in Spanish and code identifiers in English. Use the existing types in `src/lib/models.ts` and shared formatters in `src/lib/`.
- Follow `AGENTS.md`: consult the installed Next.js docs before framework code; prefer Server Components and add `"use client"` only for client capabilities.
- Preserve behavior unless the user requests a behavior change. Do not make existing visual inconsistencies into new rules.
- Use one visual system across routes. A requested redesign updates this file, its reference, and affected shared UI together.
- Every changed screen needs keyboard focus visibility, readable contrast, responsive layout, and the data states it can reach. Do not communicate state through color alone.
- Before editing or reviewing UI, read [references/design-system.md](references/design-system.md) for the expanded recipes.

## Palette, typography, spacing, radius, and shadow

| Role | Canonical value or class |
| --- | --- |
| Page background / main text | `#0a0a0a` / `#f5f5f5` from `src/app/globals.css` |
| Surface / field | `bg-neutral-900` / `bg-neutral-950` |
| Accent / filled hover | `lime-300` / `hover:bg-lime-200`; filled actions use `text-neutral-950` |
| Secondary / muted text | `text-neutral-300` / `text-neutral-400` |
| Card / row border | `border border-white/15` / `border-t border-white/10` |
| Error | `border-amber-400/40` and `text-amber-200` with an explicit message |
| Font | Arial, Helvetica, sans-serif from `src/app/globals.css` |
| Eyebrow | `text-xs font-bold uppercase tracking-[.2em] text-lime-300` |
| Page / section / card title | `text-4xl font-semibold tracking-tight` / `text-2xl font-semibold` / `text-xl font-semibold` |
| Metadata / key metric | `text-sm` / `text-3xl font-semibold` |
| Spacing | Tailwind 4 px grid; card `p-6`, interior `gap-4`, sibling cards `gap-5`, major sections `mt-10` |
| Radius | `rounded-2xl` for cards/tables; `rounded-lg` for fields/buttons |
| Shadow | No shadow on ordinary surfaces; use the specified border and surface contrast |

The public landing hero may use `sm:text-6xl`. Use lime for short emphasis and actions, not long paragraphs. See [references/design-system.md](references/design-system.md) for the full type and spacing recipes.

## Pages, cards, controls, forms, tables, and extraction

Page order: shell → header with brand/navigation → `<main>` → eyebrow → one `h1` plus description/actions → sections with `h2` → cards, forms, or tables. Name sections with `aria-labelledby`. Shell: `mx-auto min-h-svh max-w-6xl px-6 pb-16 sm:px-12`; header `py-8`; main `py-8`. Narrow forms use `max-w-md` or `max-w-3xl`. Use `Link` for navigation and `button` for actions.

Card: `rounded-2xl border border-white/15 bg-neutral-900 p-6`; title `text-xl font-semibold`; supporting text `mt-3 text-sm text-neutral-400`. Primary control: `rounded-lg bg-lime-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300`. Secondary control: `rounded-lg border border-white/25 px-4 py-2 text-sm hover:border-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300`.

Form: one `<form>` in a card, visible labels, `space-y-4`, actions at the end. Field: `mt-2 w-full rounded-lg border border-white/20 bg-neutral-950 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-lime-300`. Put validation near the field in Spanish; use HTML types and constraints when applicable. Truly disable busy controls and add `disabled:opacity-50`.

Table: `mt-5 overflow-x-auto rounded-2xl border border-white/15` around `w-full min-w-[640px] text-left text-sm`. Header `bg-neutral-900 text-neutral-400`, `<th scope="col">`, cells `px-5 py-4`, rows `border-t border-white/10`. On narrow screens, keep horizontal scroll. Do not render only the header for an empty table.

Keep a component beside `src/app/<route>/` when one route uses it; move it to `src/components/` when two or more routes use it. Extract for a clear UI responsibility, not a fixed line count. Put data access, domain rules, and shared formatting in `src/lib/`.

## Loading, refresh, empty, error, and mutations

For initial load, keep shell, header, and title visible; show a matching data container with `role="status"`, `aria-busy="true"`, and specific Spanish copy. On refresh, retain existing data, mark the region busy, and disable only the initiating action. Avoid a full-page flash.

Choose one data branch in order: initial loading → error → empty → populated. Empty uses `mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6`, names the missing entity, and offers a useful action when available. Error uses `role="alert"`, `border-amber-400/40`, product-written copy, and «Reintentar» when possible. Never expose provider messages.

For a mutation, prevent double submit, disable its action, and change its label to «Guardando…» or a specific verb. Retain form input and prior data until success. On success, update the affected region and announce it with `role="status"`; on failure, show `role="alert"` without discarding input. See the reference for a complete empty/error/loading table recipe.

## Reproducible domain examples

Use distinct meanings: `Event` is an event, `TicketType` defines a ticket type and capacity, `Ticket` is an issued ticket, and `Registration` in `src/lib/models.ts` is the registration RPC receipt. The dashboard's render models are `DashboardEvent`, `TicketTypeOccupancy`, and `AttendeeRegistration`; never render the RPC `Registration` as an attendee row.

```tsx
// event: Event; ticketType: TicketType; registration: Registration
<section aria-labelledby="ticket-title" className="mt-10 rounded-2xl border border-white/15 bg-neutral-900 p-6">
  <h2 id="ticket-title" className="text-2xl font-semibold">{event.title}</h2>
  <p className="mt-3 text-sm text-neutral-400">{ticketType.name} · {ticketType.capacity} lugares</p>
  <p role="status" className="mt-5 text-neutral-300">Registro confirmado.</p>
  <Link href={`/tickets/${registration.ticket_code}`} className="mt-5 inline-flex rounded-lg bg-lime-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">
    Ver mi entrada
  </Link>
</section>
```

Render that confirmation only after the registration mutation succeeds. `registration.ticket_code` links to the issued `Ticket`; it does not represent an attendee list row.

```tsx
// event: DashboardEvent; ticketType: TicketTypeOccupancy
<article className="rounded-2xl border border-white/15 bg-neutral-900 p-6">
  <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">{event.status}</p>
  <h2 className="mt-3 text-xl font-semibold">{event.title}</h2>
  <p className="mt-3 text-sm text-neutral-400">Aforo: {event.capacity}</p>
  <p className="mt-5 text-3xl font-semibold text-lime-300">
    {ticketType.registered} <span className="text-sm font-normal text-neutral-400">de {ticketType.capacity} registros en {ticketType.name}</span>
  </p>
</article>
```

```tsx
// registrations: AttendeeRegistration[]; formatEventDate from src/lib/dates.ts
<section aria-labelledby="registrations-title" className="mt-10">
  <h2 id="registrations-title" className="text-2xl font-semibold">Asistentes registrados</h2>
  {registrations.length === 0 ? (
    <div className="mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6">
      <p className="font-semibold">Todavía no hay asistentes registrados.</p>
      <p className="mt-2 text-sm text-neutral-400">Aparecerán aquí cuando alguien reserve una entrada.</p>
    </div>
  ) : (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-white/15">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-neutral-900 text-neutral-400"><tr>
          <th scope="col" className="px-5 py-4 font-medium">Nombre</th>
          <th scope="col" className="px-5 py-4 font-medium">Correo</th>
          <th scope="col" className="px-5 py-4 font-medium">Registro</th>
        </tr></thead>
        <tbody>{registrations.map((registration) => (
          <tr key={registration.id} className="border-t border-white/10">
            <td className="px-5 py-4 text-neutral-300">{registration.attendeeName}</td>
            <td className="px-5 py-4 text-neutral-300">{registration.email}</td>
            <td className="px-5 py-4 text-neutral-400">{formatEventDate(registration.createdAt)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )}
</section>
```

Wrap the example's data region in the loading/error/empty/populated sequence above. Adapt data and Spanish copy, but preserve tokens, hierarchy, and semantics.

## Checklist

- Is this a visible UI task, and is the skill restricted to the UI portion of mixed work?
- Do palette, type, spacing, radius, shadow, and control classes match this file?
- Are the page hierarchy, form labels, focus, contrast, and navigation correct?
- Do narrow layouts and horizontal table scroll keep content usable?
- Have all reachable loading, refresh, empty, error, content, and mutation states been checked?
- Are domain types used with their distinct meanings, with Spanish UI copy and shared components in the right location?
