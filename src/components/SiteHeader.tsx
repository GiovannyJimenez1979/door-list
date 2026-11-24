"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

type Section = "events" | "organizer" | "dashboard";

const links: { href: string; label: string; description: string; section: Section }[] = [
  { href: "/", label: "Eventos", description: "Explora los próximos eventos", section: "events" },
  { href: "/organizador", label: "Gestionar eventos", description: "Crea eventos y tipos de entrada", section: "organizer" },
  { href: "/dashboard", label: "Panel de registros", description: "Consulta aforo y asistentes", section: "dashboard" },
];

export default function SiteHeader({ section, children }: { section: Section; children?: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return <header className="flex flex-wrap items-center justify-between gap-4 py-8">
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label="Abrir menú de navegación"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center gap-3 rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-neutral-300 hover:border-lime-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
      >
        <span className="flex h-4 w-5 flex-col justify-between" aria-hidden="true"><span className="h-0.5 w-full bg-current" /><span className="h-0.5 w-full bg-current" /><span className="h-0.5 w-full bg-current" /></span>
        Menú
      </button>
      <Link href="/" className="text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">
        door list<span className="text-lime-300">.</span>
      </Link>
    </div>
    {children && <div className="ml-auto flex flex-wrap items-center gap-4">{children}</div>}
    <dialog
      ref={dialogRef}
      aria-labelledby="site-menu-title"
      onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}
      className="fixed inset-y-0 left-0 right-auto m-0 h-dvh w-full max-w-sm border-r border-white/15 bg-neutral-900 p-0 text-[#f5f5f5] backdrop:bg-black/75"
    >
      <div className="flex h-full flex-col px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">Door List</p>
            <h2 id="site-menu-title" className="mt-3 text-2xl font-semibold">Navegación</h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg border border-white/25 px-3 py-2 text-sm hover:border-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
          >Cerrar</button>
        </div>
        <nav aria-label="Navegación principal" className="mt-10 space-y-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-neutral-400">Explorar</p>
            <div className="mt-4 space-y-2"><MenuLink {...links[0]} active={section === "events"} onNavigate={() => dialogRef.current?.close()} /></div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-neutral-400">Organizar</p>
            <div className="mt-4 space-y-2">{links.slice(1).map((link) => <MenuLink key={link.href} {...link} active={section === link.section} onNavigate={() => dialogRef.current?.close()} />)}</div>
          </div>
        </nav>
        <p className="mt-auto border-t border-white/10 pt-6 text-sm text-neutral-400">Todo lo que necesitas para organizar y asistir a tus eventos.</p>
      </div>
    </dialog>
  </header>;
}

function MenuLink({ href, label, description, active, onNavigate }: { href: string; label: string; description: string; active: boolean; onNavigate: () => void }) {
  return <Link
    href={href}
    onClick={onNavigate}
    className={`block rounded-lg border px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 ${active ? "border-lime-300 bg-lime-300/10" : "border-white/15 hover:border-lime-300"}`}
  >
    <span className={`block font-semibold ${active ? "text-lime-300" : "text-white"}`}>{label}{active && <span className="ml-2 text-xs font-normal text-neutral-300">· Sección actual</span>}</span>
    <span className="mt-1 block text-sm text-neutral-400">{description}</span>
  </Link>;
}
