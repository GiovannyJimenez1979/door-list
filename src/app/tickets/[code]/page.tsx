"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatEventDate } from "@/lib/dates";
import type { Ticket } from "@/lib/models";

const labels = { valid: "Válida", used: "Utilizada", revoked: "Revocada" };
export default function TicketPage() { return <Suspense fallback={<p className="p-8">Cargando entrada…</p>}><TicketContent /></Suspense>; }
function TicketContent() {
  const { code } = useParams<{ code: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { void Promise.resolve().then(() => { if (!supabase) { setError("Supabase no está configurado."); setLoading(false); return; } return supabase.rpc("ticket_by_code", { p_code: code }).then(({ data, error: failure }) => { const row = (data as Ticket[] | null)?.[0]; if (failure) setError("No se pudo consultar esta entrada."); else if (!row) setError("La entrada no existe o el código no es válido."); else setTicket(row); setLoading(false); }); }); }, [code]);
  return <div className="mx-auto min-h-svh max-w-3xl px-6 pb-16"><header className="py-8"><Link href="/" className="text-xl font-bold">door list<span className="text-lime-300">.</span></Link></header><main className="py-8"><Link href="/" className="text-sm text-neutral-400">← Ver eventos</Link>{loading ? <p className="mt-10" role="status">Cargando entrada…</p> : error ? <div className="mt-10 rounded-2xl border border-white/15 p-7"><h1 className="text-3xl font-semibold">Entrada no disponible</h1><p className="mt-3 text-amber-200">{error}</p></div> : ticket && <article className="mt-10 overflow-hidden rounded-3xl border border-white/15 bg-neutral-900"><div className="p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">Entrada digital</p><h1 className="mt-3 text-4xl font-semibold">{ticket.event_title}</h1><p className="mt-4 text-neutral-400">{formatEventDate(ticket.starts_at)} · {ticket.venue}</p><dl className="mt-8 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs uppercase text-neutral-500">Asistente</dt><dd className="mt-1">{ticket.attendee_name}</dd></div><div><dt className="text-xs uppercase text-neutral-500">Entrada</dt><dd className="mt-1">{ticket.ticket_name}</dd></div><div><dt className="text-xs uppercase text-neutral-500">Estado</dt><dd className={`mt-1 font-semibold ${ticket.status === "valid" ? "text-lime-300" : "text-amber-300"}`}>{labels[ticket.status]}</dd></div></dl></div><div className="border-t border-dashed border-white/20 bg-white/[.03] p-7 text-center sm:p-10"><img className="mx-auto h-56 w-56 rounded-xl bg-white p-3" alt={`Código QR de la entrada ${ticket.ticket_code}`} src={`https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(ticket.ticket_code)}`} /><p className="mt-5 text-xs uppercase tracking-widest text-neutral-500">Código de entrada</p><code className="mt-2 block break-all text-sm text-lime-300">{ticket.ticket_code}</code></div></article>}</main></div>;
}
