# Door List design system

This file provides expanded recipes for the rules in `../SKILL.md`. If a recipe here conflicts with the skill, follow `SKILL.md`. Existing pages are evidence of the product's dark, lime-accented style, but their inconsistencies do not override the skill.

## Foundations

| Role | Exact value or Tailwind utility | Use |
| --- | --- | --- |
| Page background | `#0a0a0a` (`:root` in `src/app/globals.css`) | Whole app |
| Main text | `#f5f5f5` (`:root`) | Headings and primary content |
| Surface | `bg-neutral-900` | Cards, forms, table heading |
| Field background | `bg-neutral-950` | Inputs, selects, textareas |
| Accent | `text-lime-300`, `bg-lime-300`, `border-lime-300` | Primary actions, active state, small labels, metrics |
| Accent hover | `hover:bg-lime-200` | Filled action |
| Muted text | `text-neutral-400` | Descriptions, labels, metadata |
| Secondary text | `text-neutral-300` | Table cells and secondary links |
| Card border | `border border-white/15` | Default surface boundary |
| Row border | `border-t border-white/10` | Table rows |
| Warning or error | `border-amber-400/40`, `text-amber-200` | Failure states and inline errors |

Keep Arial, Helvetica, sans-serif from `src/app/globals.css`. Use one font family. Use lime for emphasis, not for long paragraphs. Filled lime actions use `text-neutral-950`.

## Type and spacing

| Element | Canonical classes |
| --- | --- |
| Eyebrow/breadcrumb label | `text-xs font-bold uppercase tracking-[.2em] text-lime-300` |
| Page title | `text-4xl font-semibold tracking-tight` (public landing hero may use `sm:text-6xl`) |
| Section title | `text-2xl font-semibold` |
| Card title | `text-xl font-semibold` |
| Body | default text size, `text-neutral-400` when supporting |
| Metadata/table | `text-sm` |
| Key metric | `text-3xl font-semibold` |

Use the 4 px Tailwind spacing grid. Within a card: `p-6` and `gap-4` or `space-y-4`. Between sibling cards: `gap-5`. Between major sections: `mt-10`. Under a title: `mt-3` or `mt-4`; under a section heading: `mt-5`. Page shell: `mx-auto min-h-svh max-w-6xl px-6 pb-16 sm:px-12`; header: `py-8`; main: `py-8` (landing page may use `py-12`). Narrow content such as a form uses `max-w-3xl` or `max-w-md` inside the shell.

Corners: `rounded-2xl` for cards and table containers; `rounded-lg` for buttons, fields, and compact controls. Avoid arbitrary radii and spacing values for ordinary UI.

## Component anatomy

Screen order: page shell → header with Door List brand and relevant navigation → main → eyebrow → one `h1` plus supporting text/actions → sections with `h2` → cards, forms, or tables. Each section has an accessible name via its heading. Keep actions beside the heading when they affect the whole section; put row actions inside the corresponding row/card.

Use semantic `<main>`, `<section>`, `<article>`, `<form>`, and `<table>` where appropriate. Use `Link` for navigation and `button` for actions. Reuse shared UI from `src/components/`; keep one-route composition beside its route. Follow the existing Server Component default from `AGENTS.md`; add client state only for interaction.

Canonical surface and action classes:

```tsx
<section aria-labelledby="section-title" className="mt-10">
  <h2 id="section-title" className="text-2xl font-semibold">Tipos de entrada</h2>
  <div className="mt-5 grid gap-5 md:grid-cols-2">
    <article className="rounded-2xl border border-white/15 bg-neutral-900 p-6">
      <h3 className="text-xl font-semibold">General</h3>
      <p className="mt-3 text-sm text-neutral-400">24 de 50 registrados</p>
    </article>
  </div>
</section>

<Link href="/dashboard" className="inline-flex rounded-lg bg-lime-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">
  Ver registros
</Link>
```

Secondary action: `rounded-lg border border-white/25 px-4 py-2 text-sm hover:border-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300`. Fields: `mt-2 w-full rounded-lg border border-white/20 bg-neutral-950 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-lime-300`. Pair every field with a visible label; show validation near the field in Spanish. Disabled controls use `disabled:opacity-50` and must be truly disabled.

## Data tables and states

For a table with rows, use a responsive scroll container, explicit column headers, and the same cell padding in header and body:

```tsx
<div className="mt-5 overflow-x-auto rounded-2xl border border-white/15">
  <table className="w-full min-w-[640px] text-left text-sm">
    <thead className="bg-neutral-900 text-neutral-400">
      <tr><th scope="col" className="px-5 py-4 font-medium">Nombre</th></tr>
    </thead>
    <tbody>
      <tr className="border-t border-white/10">
        <td className="px-5 py-4 text-neutral-300">Ana Pérez</td>
      </tr>
    </tbody>
  </table>
</div>
```

Choose exactly one branch for the data region: loading → error → empty → populated. Keep the title and section context visible in every branch. Empty and error use the same card footprint as content (`mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6`). Empty copy names the missing entity and offers one useful next action when available. Error copy is product-written, never a raw provider message, and offers retry when possible. Loading uses `role="status"`, short Spanish copy specific to the data, and a matching container; add `aria-busy="true"` to the data region. Error uses `role="alert"`. Do not use color alone to distinguish status.

```tsx
<section aria-labelledby="attendees-title" className="mt-10">
  <h2 id="attendees-title" className="text-2xl font-semibold">Asistentes registrados</h2>
  {loading ? (
    <div role="status" aria-busy="true" className="mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6 text-neutral-400">Cargando asistentes…</div>
  ) : error ? (
    <div role="alert" className="mt-5 rounded-2xl border border-amber-400/40 bg-neutral-900 p-6">
      <p>No se pudieron cargar los asistentes.</p>
      <button type="button" onClick={retry} className="mt-5 rounded-lg bg-lime-300 px-4 py-2 font-semibold text-neutral-950 hover:bg-lime-200">Reintentar</button>
    </div>
  ) : attendees.length === 0 ? (
    <div className="mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6">
      <p className="font-semibold">Todavía no hay asistentes registrados.</p>
      <p className="mt-2 text-sm text-neutral-400">Los registros aparecerán aquí cuando alguien reserve una entrada.</p>
    </div>
  ) : (
    <AttendeesTable attendees={attendees} />
  )}
</section>
```

`AttendeesTable` is illustrative: create it only if separation improves the route or it is shared. For loading of a whole page, keep the page shell, header, eyebrow, and title visible. A success state should confirm the completed action in Spanish with `role="status"` and a useful next step.

## Review before finishing a UI change

- Compare new UI with the foundation table and recipes; remove one-off color, spacing, and typography choices.
- Check narrow viewport, horizontal table scroll, and focus visibility.
- Verify loading, empty, error, and populated states that the feature can reach; check success for mutations.
- Keep visible copy in Spanish and code identifiers in English, per `AGENTS.md`.
