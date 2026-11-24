"use client";

import { type Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { localDate } from "@/lib/dates";
import type { Event } from "@/lib/models";

type EventForm = { title: string; description: string; starts_at: string; venue: string; status: string; capacity: string };
const emptyEvent: EventForm = { title: "", description: "", starts_at: "", venue: "", status: "borrador", capacity: "" };
const input = "mt-2 w-full rounded-lg border border-white/20 bg-neutral-950 px-3 py-2 text-white focus:outline-2 focus:outline-lime-300";
const button = "rounded-lg bg-lime-300 px-4 py-2 font-semibold text-neutral-950 hover:bg-lime-200 disabled:opacity-50";
const secondary = "rounded-lg border border-white/25 px-4 py-2 text-sm hover:border-lime-300";

export default function Organizer() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState<EventForm>(emptyEvent);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketName, setTicketName] = useState("");
  const [ticketCapacity, setTicketCapacity] = useState("");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");
  const [busy, setBusy] = useState(false);
  const [ticketPanelRequest, setTicketPanelRequest] = useState(0);
  const ticketSectionRef = useRef<HTMLElement>(null);

  const showError = useCallback((text: string) => { setMessageKind("error"); setMessage(text); }, []);
  function showSuccess(text: string) { setMessageKind("success"); setMessage(text); }

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    client.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = client.auth.onAuthStateChange((_event, next) => { setSession(next); if (!next) { setEvents([]); setSelected(null); setEditing(null); setForm(emptyEvent); } setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  const load = useCallback(async (userId: string) => {
    if (!supabase) return false;
    const { data, error } = await supabase.from("events").select("*, ticket_types(*)").eq("organizer_id", userId).order("starts_at");
    if (error) { showError("No se pudieron cargar los eventos."); return false; }
    setEvents((data ?? []) as Event[]);
    return true;
  }, [showError]);
  useEffect(() => { if (session) { const id = session.user.id; void Promise.resolve().then(() => load(id)); } }, [session, load]);
  useEffect(() => {
    if (selected) {
      ticketSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      ticketSectionRef.current?.focus({ preventScroll: true });
    }
  }, [selected, ticketPanelRequest]);
  const active = events.find((event) => event.id === selected);
  const allocated = active?.ticket_types.reduce((sum, ticket) => sum + ticket.capacity, 0) ?? 0;

  async function auth(e: FormEvent, signup: boolean) {
    e.preventDefault(); if (!supabase) return; setBusy(true); setMessage("");
    const { data, error } = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (error) showError("No se pudo acceder a la cuenta. Revisa los datos e inténtalo de nuevo.");
    else if (signup && !data.session) showSuccess("Revisa tu correo para confirmar la cuenta antes de iniciar sesión.");
    setBusy(false);
  }
  async function saveEvent(e: FormEvent) {
    e.preventDefault(); if (!supabase || !session) return; setBusy(true); setMessage("");
    const payload = { ...form, title: form.title.trim(), description: form.description.trim(), venue: form.venue.trim(), capacity: Number(form.capacity), starts_at: new Date(form.starts_at).toISOString() };
    const result = editing ? await supabase.from("events").update(payload).eq("id", editing).select("id").single() : await supabase.from("events").insert({ ...payload, organizer_id: session.user.id }).select("id").single();
    if (result.error) showError("No se pudo guardar el evento."); else { setForm(emptyEvent); setEditing(null); setSelected(result.data.id); if (await load(session.user.id)) showSuccess("Evento guardado."); } setBusy(false);
  }
  async function saveTicket(e: FormEvent) {
    e.preventDefault(); if (!supabase || !session || !active) return;
    const amount = Number(ticketCapacity); const previous = active.ticket_types.find((t) => t.id === ticketId)?.capacity ?? 0;
    if (allocated - previous + amount > active.capacity) { showError("La suma de los aforos supera el límite del evento."); return; }
    setBusy(true); setMessage("");
    const payload = { name: ticketName.trim(), capacity: amount, event_id: active.id };
    const result = ticketId ? await supabase.from("ticket_types").update(payload).eq("id", ticketId).select("id").single() : await supabase.from("ticket_types").insert(payload).select("id").single();
    if (result.error) showError("No se pudo guardar el tipo de entrada."); else { setTicketId(null); setTicketName(""); setTicketCapacity(""); if (await load(session.user.id)) showSuccess("Tipo de entrada guardado."); } setBusy(false);
  }
  async function remove(table: "events" | "ticket_types", id: string) {
    if (!supabase || !session || !window.confirm(table === "events" ? "¿Eliminar este evento y todos sus tipos de entrada?" : "¿Eliminar este tipo de entrada?")) return;
    setBusy(true); const { error } = await supabase.from(table).delete().eq("id", id).select("id").single();
    if (error) showError("No se pudo eliminar el elemento."); else { if (table === "events") { setSelected(null); setEditing(null); setForm(emptyEvent); } else { setTicketId(null); setTicketName(""); setTicketCapacity(""); } if (await load(session.user.id)) showSuccess("Eliminado correctamente."); } setBusy(false);
  }

  return <div className="mx-auto min-h-screen max-w-6xl px-6 pb-16">
    <header className="flex flex-wrap items-center justify-between gap-4 py-8"><Link href="/" className="text-xl font-bold">door list<span className="text-lime-300">.</span></Link>{session && <div className="flex items-center gap-4 text-sm text-neutral-400"><span>{session.user.email}</span><button className={secondary} onClick={() => { void supabase?.auth.signOut(); }}>Cerrar sesión</button></div>}</header>
    <main><p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">Door List / Organizador</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Gestiona tus eventos</h1>{session && <Link href="/dashboard" className="mt-5 inline-block rounded-lg border border-white/25 px-4 py-2 text-sm hover:border-lime-300">Ver panel de registros →</Link>}
    {!supabase ? <p className="mt-8 rounded-xl border border-amber-400/40 p-5">Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY para usar el panel.</p> : !ready ? <p className="mt-8">Cargando sesión…</p> : !session ? <form onSubmit={(e) => void auth(e, false)} className="mt-10 max-w-md space-y-4 rounded-2xl border border-white/15 bg-neutral-900 p-6"><h2 className="text-xl font-semibold">Accede a tu cuenta</h2><label className="block text-sm">Correo<input className={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="block text-sm">Contraseña<input className={input} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label><div className="flex flex-wrap gap-3"><button className={button} disabled={busy}>Iniciar sesión</button><button type="button" className={secondary} disabled={busy} onClick={(e) => { const formElement = e.currentTarget.form; if (formElement?.reportValidity()) void auth(e, true); }}>Crear cuenta</button></div></form> : <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
      <section className="space-y-5"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">Tus eventos</h2><button className={secondary} onClick={() => { setEditing(null); setForm(emptyEvent); }}>+ Nuevo evento</button></div>{events.length === 0 && <p className="rounded-xl border border-white/15 p-5 text-neutral-400">Aún no tienes eventos. Crea el primero.</p>}{events.map((event) => <article key={event.id} className={`rounded-2xl border bg-neutral-900 p-5 ${selected === event.id ? "border-lime-300" : "border-white/15"}`}><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-lime-300">{event.status}</p><h3 className="mt-1 text-xl font-semibold">{event.title}</h3><p className="mt-2 text-sm text-neutral-400">{new Date(event.starts_at).toLocaleString("es-CO")} · {event.venue}</p><p className="mt-1 text-sm text-neutral-400">Aforo: {event.capacity}</p></div><div className="flex flex-wrap items-start gap-2"><button className={secondary} aria-controls="ticket-types" onClick={() => { setSelected(event.id); setTicketId(null); setTicketName(""); setTicketCapacity(""); setTicketPanelRequest((request) => request + 1); }}>Entradas</button><button className={secondary} onClick={() => { setEditing(event.id); setForm({ title: event.title, description: event.description, starts_at: localDate(event.starts_at), venue: event.venue, status: event.status, capacity: String(event.capacity) }); }}>Editar</button><button className={secondary} disabled={busy} onClick={() => void remove("events", event.id)}>Eliminar</button></div></div></article>)}</section>
      <div className="space-y-8"><form onSubmit={(e) => void saveEvent(e)} className="space-y-4 rounded-2xl border border-white/15 bg-neutral-900 p-6"><h2 className="text-2xl font-semibold">{editing ? "Editar evento" : "Nuevo evento"}</h2><label className="block text-sm">Nombre<input className={input} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label className="block text-sm">Descripción<textarea className={input} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Fecha y hora local<input className={input} type="datetime-local" required value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label><label className="block text-sm">Aforo total<input className={input} type="number" min="1" step="1" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label></div><label className="block text-sm">Lugar<input className={input} required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></label><label className="block text-sm">Estado<select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="borrador">Borrador</option><option value="publicado">Publicado</option></select></label><div className="flex gap-3"><button className={button} disabled={busy}>Guardar evento</button>{editing && <button type="button" className={secondary} onClick={() => { setEditing(null); setForm(emptyEvent); }}>Cancelar edición</button>}</div></form>
      {active && <section id="ticket-types" ref={ticketSectionRef} tabIndex={-1} className="rounded-2xl border border-white/15 bg-neutral-900 p-6"><h2 className="text-2xl font-semibold">Tipos de entrada</h2><p className="mt-2 text-sm text-neutral-400">{active.title} · {allocated} de {active.capacity} lugares asignados</p><div className="mt-5 space-y-3">{active.ticket_types.length === 0 && <p className="text-sm text-neutral-400">Todavía no hay tipos de entrada.</p>}{active.ticket_types.map((ticket) => <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><span>{ticket.name} <span className="text-neutral-400">· {ticket.capacity} lugares</span></span><div className="flex gap-2"><button className={secondary} onClick={() => { setTicketId(ticket.id); setTicketName(ticket.name); setTicketCapacity(String(ticket.capacity)); }}>Editar</button><button className={secondary} disabled={busy} onClick={() => void remove("ticket_types", ticket.id)}>Eliminar</button></div></div>)}</div><form onSubmit={(e) => void saveTicket(e)} className="mt-6 space-y-4"><h3 className="font-semibold">{ticketId ? "Editar tipo" : "Añadir tipo"}</h3><label className="block text-sm">Nombre<input className={input} required value={ticketName} onChange={(e) => setTicketName(e.target.value)} /></label><label className="block text-sm">Aforo<input className={input} type="number" min="1" step="1" required value={ticketCapacity} onChange={(e) => setTicketCapacity(e.target.value)} /></label><div className="flex gap-3"><button className={button} disabled={busy}>Guardar tipo</button>{ticketId && <button type="button" className={secondary} onClick={() => { setTicketId(null); setTicketName(""); setTicketCapacity(""); }}>Cancelar</button>}</div></form></section>}</div></div>}
    {message && <p role={messageKind === "error" ? "alert" : "status"} className="mt-6 rounded-xl border border-white/20 p-4">{message}</p>}</main></div>;
}
