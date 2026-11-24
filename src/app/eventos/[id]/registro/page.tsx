"use client";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatEventDate, registrationIsOpen } from "@/lib/dates";
import type { Event, Registration, RegistrationOption } from "@/lib/models";
import { registrationErrorMessage } from "@/lib/errors";
const field = "mt-2 w-full rounded-lg border border-white/20 bg-neutral-950 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-lime-300";
const primary = "inline-flex rounded-lg bg-lime-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:opacity-50";
const secondary = "inline-flex rounded-lg border border-white/25 px-4 py-2 text-sm hover:border-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300";
export default function RegistrationPage() { return <Suspense fallback={<RegistrationShell><h1 className="mt-3 text-4xl font-semibold tracking-tight">Evento y entradas</h1><div role="status" aria-busy="true" className="mt-10 rounded-2xl border border-white/15 bg-neutral-900 p-6 text-neutral-400">Cargando evento y entradas…</div></RegistrationShell>}><Registration /></Suspense>; }
function Registration() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Pick<Event, "id" | "title" | "description" | "starts_at" | "venue"> | null>(null); const [options, setOptions] = useState<RegistrationOption[]>([]); const [ticketId, setTicketId] = useState("");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [loading, setLoading] = useState(true); const [sending, setSending] = useState(false); const [error, setError] = useState(""); const [ticketCode, setTicketCode] = useState(""); const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle"); const [emailError, setEmailError] = useState("");
  const load = useCallback(async () => { if (!supabase) { setError("No se pudo cargar el evento. Inténtalo de nuevo más tarde."); setLoading(false); return; } const [result, choices] = await Promise.all([supabase.from("events").select("id,title,description,starts_at,venue").eq("id", id).eq("status", "publicado").maybeSingle(), supabase.rpc("registration_options", { p_event_id: id })]); if (result.error || choices.error) setError("No se pudo consultar el registro. Inténtalo de nuevo."); else { const available = result.data && registrationIsOpen(result.data.starts_at); setEvent(available ? result.data : null); setOptions(available ? (choices.data ?? []) as RegistrationOption[] : []); } setLoading(false); }, [id]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  async function submit(e: FormEvent) { e.preventDefault(); if (!supabase || !event || !ticketId || sending) return; setSending(true); setError(""); const { data, error: failure } = await supabase.rpc("create_registration", { p_event_id: event.id, p_ticket_type_id: ticketId, p_name: name.trim(), p_email: email.trim() }); if (failure) { setError(registrationErrorMessage(failure.message, failure.code)); await load(); setSending(false); return; } const code = (data as Registration[] | null)?.[0]?.ticket_code ?? ""; setTicketCode(code); setEmailStatus("sending"); setEmailError(""); try { const response = await fetch("/api/tickets/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketCode: code }) }); if (!response.ok) { setEmailStatus("error"); setEmailError("No se pudo enviar el correo. Conserva el enlace de tu entrada."); } else { setEmailStatus("sent"); } } catch { setEmailStatus("error"); setEmailError("No se pudo conectar con el servicio de correo."); } setSending(false); }
  const availableOptions = options.filter((option) => option.remaining > 0);
  return <RegistrationShell>
    {loading ? <>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Evento y entradas</h1>
      <div role="status" aria-busy="true" className="mt-10 rounded-2xl border border-white/15 bg-neutral-900 p-6 text-neutral-400">Cargando evento y entradas…</div>
    </> : error && !event ? <>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">No se pudo cargar el evento</h1>
      <div role="alert" className="mt-10 rounded-2xl border border-amber-400/40 bg-neutral-900 p-6">
        <p className="text-amber-200">{error}</p>
        <button type="button" className={`mt-5 ${primary}`} onClick={() => { setError(""); setLoading(true); void load(); }}>Reintentar</button>
      </div>
    </> : !event ? <>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Registro no disponible</h1>
      <div className="mt-10 rounded-2xl border border-white/15 bg-neutral-900 p-6">
        <p className="font-semibold">Este evento no está disponible para registro.</p>
        <p className="mt-3 text-sm text-neutral-400">Puede que aún no esté publicado o que su fecha haya pasado.</p>
        <Link href="/" className={`mt-5 ${secondary}`}>Explorar eventos</Link>
      </div>
    </> : <>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{event.title}</h1>
      <p className="mt-4 max-w-3xl text-neutral-300">{event.description}</p>
      <section aria-labelledby="event-details-title" className="mt-10">
        <h2 id="event-details-title" className="text-2xl font-semibold">Detalles del evento</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-neutral-900 p-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">Fecha y hora</p><p className="mt-3 text-xl font-semibold">{formatEventDate(event.starts_at)}</p></div>
          <div className="rounded-2xl border border-white/15 bg-neutral-900 p-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">Lugar</p><p className="mt-3 text-xl font-semibold">{event.venue}</p></div>
        </div>
      </section>
      <section aria-labelledby="registration-title" className="mt-10 max-w-3xl">
        <h2 id="registration-title" className="text-2xl font-semibold">{ticketCode ? "Tu entrada" : "Reserva tu entrada"}</h2>
        {ticketCode ? <div role="status" className="mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6">
          <p className="text-xl font-semibold">Registro confirmado</p>
          <p className="mt-3 text-neutral-300">Tu entrada fue creada correctamente.</p>
          <p className={`mt-3 text-sm ${emailStatus === "error" ? "text-amber-200" : "text-neutral-400"}`}>{emailStatus === "sending" ? "Enviando tu entrada por correo…" : emailStatus === "sent" ? "También enviamos la entrada a tu correo." : emailError || "Conserva el enlace para ver tu entrada."}</p>
          <Link href={`/tickets/${ticketCode}`} className={`mt-5 ${primary}`}>Ver mi entrada y QR</Link>
        </div> : availableOptions.length === 0 ? <div className="mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6">
          <p className="font-semibold">No hay entradas disponibles para este evento.</p>
          <p className="mt-3 text-sm text-neutral-400">Consulta otros eventos con registro abierto.</p>
          <Link href="/" className={`mt-5 ${secondary}`}>Explorar eventos</Link>
        </div> : <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-4 rounded-2xl border border-white/15 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-400">Elige una entrada y completa tus datos para confirmar tu registro.</p>
          <label className="block text-sm">Tipo de entrada<select className={field} required value={ticketId} onChange={(e) => setTicketId(e.target.value)}><option value="">Selecciona una entrada</option>{availableOptions.map((option) => <option key={option.ticket_type_id} value={option.ticket_type_id}>{option.name} · {option.remaining} disponibles</option>)}</select></label>
          <label className="block text-sm">Nombre<input className={field} required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block text-sm">Correo electrónico<input className={field} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {error && <p role="alert" className="rounded-lg border border-amber-400/40 p-3 text-amber-200">{error}</p>}
          <button disabled={sending || !ticketId} className={primary}>{sending ? "Confirmando…" : "Confirmar registro"}</button>
        </form>}
      </section>
    </>}
  </RegistrationShell>;
}

function RegistrationShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-svh max-w-6xl px-6 pb-16 sm:px-12">
    <SiteHeader section="events" />
    <main className="py-8">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">Door List / Evento</p>
      {children}
    </main>
  </div>;
}
