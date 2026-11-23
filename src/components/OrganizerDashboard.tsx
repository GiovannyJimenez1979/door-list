"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatEventDate } from "@/lib/dates";
import type { DashboardData } from "@/lib/models";
import { supabase } from "@/lib/supabase/client";
import { loadDashboard } from "@/lib/supabase/dashboard";

const emptyData: DashboardData = { events: [], event: null, ticketTypes: [], registrations: [] };

export default function OrganizerDashboard({ eventId }: { eventId?: string }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const client = supabase;
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null);
      setAuthReady(true);
      if (!session) setData(emptyData);
    });
    void client.auth.getUser().then(({ data: result }) => {
      if (!active) return;
      setUser(result.user ? { id: result.user.id, email: result.user.email ?? "" } : null);
      setAuthReady(true);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError(false);
      try {
        const result = await loadDashboard(userId, eventId);
        if (active) setData(result);
      } catch {
        if (active) { setData(emptyData); setError(true); }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [userId, eventId, reload]);

  const occupied = data.registrations.length;
  const ticketNames = new Map(data.ticketTypes.map((ticketType) => [ticketType.id, ticketType.name]));

  return <div className="mx-auto min-h-svh max-w-6xl px-6 pb-16 sm:px-12">
    <header className="flex flex-wrap items-center justify-between gap-4 py-8">
      <Link href="/" className="text-xl font-bold">door list<span className="text-lime-300">.</span></Link>
      {user && <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
        <span>{user.email}</span>
        <button type="button" className="rounded-lg border border-white/25 px-4 py-2 hover:border-lime-300" onClick={() => { void supabase?.auth.signOut(); }}>Cerrar sesión</button>
      </div>}
    </header>
    <main className="py-8">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">Door List / Organizador</p>
      {eventId && <Link href="/dashboard" className="mt-5 inline-block text-sm text-neutral-300 hover:text-lime-300">← Todos mis eventos</Link>}
      {!supabase ? <p role="alert" className="mt-8 rounded-xl border border-amber-400/40 p-5">Configura Supabase para usar el panel.</p>
        : !authReady ? <p role="status" className="mt-8">Comprobando sesión…</p>
        : !user ? <div className="mt-8 rounded-2xl border border-white/15 bg-neutral-900 p-7">
          <h1 className="text-3xl font-semibold">Accede como organizador</h1>
          <p className="mt-3 text-neutral-400">Inicia sesión para consultar tus eventos y registros.</p>
          <Link href="/organizador" className="mt-6 inline-block rounded-lg bg-lime-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-lime-200">Iniciar sesión</Link>
        </div>
        : loading ? <p role="status" className="mt-8">Cargando panel…</p>
        : error ? <div role="alert" className="mt-8 rounded-2xl border border-amber-400/40 p-6">
          <p>No se pudo cargar el panel. Inténtalo de nuevo.</p>
          <button type="button" className="mt-5 rounded-lg bg-lime-300 px-4 py-2 font-semibold text-neutral-950" onClick={() => setReload((value) => value + 1)}>Reintentar</button>
        </div>
        : eventId ? data.event ? <>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">{data.event.title}</h1>
          <p className="mt-3 text-neutral-400">{formatEventDate(data.event.startsAt)} · {data.event.venue}</p>
          <div className="mt-8 rounded-2xl border border-white/15 bg-neutral-900 p-6">
            <p className="text-sm text-neutral-400">Registros totales</p>
            <p className="mt-2 text-3xl font-semibold">{occupied} <span className="text-lg font-normal text-neutral-400">de {data.event.capacity} lugares</span></p>
          </div>
          <section className="mt-10" aria-labelledby="ticket-types-title">
            <h2 id="ticket-types-title" className="text-2xl font-semibold">Tipos de entrada</h2>
            {data.ticketTypes.length === 0 ? <p className="mt-5 text-neutral-400">Este evento aún no tiene tipos de entrada.</p>
              : <div className="mt-5 grid gap-4 sm:grid-cols-2">{data.ticketTypes.map((ticketType) => <article key={ticketType.id} className="rounded-2xl border border-white/15 bg-neutral-900 p-5">
                <h3 className="text-lg font-semibold">{ticketType.name}</h3>
                <p className="mt-2 text-2xl font-semibold text-lime-300">{ticketType.registered} <span className="text-base font-normal text-neutral-400">de {ticketType.capacity} registrados</span></p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-700"><div className="h-full rounded-full bg-lime-300" style={{ width: `${Math.min(100, ticketType.registered / ticketType.capacity * 100)}%` }} /></div>
              </article>)}</div>}
          </section>
          <section className="mt-10" aria-labelledby="attendees-title">
            <h2 id="attendees-title" className="text-2xl font-semibold">Asistentes registrados</h2>
            {data.registrations.length === 0 ? <p className="mt-5 rounded-2xl border border-white/15 p-6 text-neutral-400">Todavía no hay asistentes registrados.</p>
              : <div className="mt-5 overflow-x-auto rounded-2xl border border-white/15"><table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-neutral-900 text-neutral-400"><tr><th scope="col" className="px-5 py-4 font-medium">Nombre</th><th scope="col" className="px-5 py-4 font-medium">Correo</th><th scope="col" className="px-5 py-4 font-medium">Entrada</th><th scope="col" className="px-5 py-4 font-medium">Registro</th></tr></thead>
                <tbody>{data.registrations.map((registration) => <tr key={registration.id} className="border-t border-white/10"><td className="px-5 py-4 font-medium">{registration.attendeeName}</td><td className="px-5 py-4 text-neutral-300">{registration.email}</td><td className="px-5 py-4 text-neutral-300">{ticketNames.get(registration.ticketTypeId) ?? "Entrada eliminada"}</td><td className="px-5 py-4 text-neutral-400">{formatEventDate(registration.createdAt)}</td></tr>)}</tbody>
              </table></div>}
          </section>
        </> : <div className="mt-8 rounded-2xl border border-white/15 p-6"><h1 className="text-3xl font-semibold">Evento no disponible</h1><p className="mt-3 text-neutral-400">No encontramos este evento entre tus eventos.</p></div>
        : <>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-4xl font-semibold tracking-tight">Tus eventos</h1><p className="mt-3 text-neutral-400">Consulta el aforo y los asistentes de cada evento.</p></div><Link href="/organizador" className="rounded-lg border border-white/25 px-4 py-2 text-sm hover:border-lime-300">Gestionar eventos</Link></div>
          {data.events.length === 0 ? <p className="mt-10 rounded-2xl border border-white/15 p-6 text-neutral-400">Aún no tienes eventos. Crea el primero desde Gestión de eventos.</p>
            : <div className="mt-10 grid gap-5 md:grid-cols-2">{data.events.map((event) => <article key={event.id} className="flex flex-col rounded-2xl border border-white/15 bg-neutral-900 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-lime-300">{event.status}</p>
              <h2 className="mt-2 text-2xl font-semibold">{event.title}</h2>
              <p className="mt-3 text-sm text-neutral-400">{formatEventDate(event.startsAt)} · {event.venue}</p>
              <p className="mt-2 text-sm text-neutral-400">Aforo: {event.capacity}</p>
              <Link href={`/dashboard/${event.id}`} className="mt-6 w-fit rounded-lg bg-lime-300 px-4 py-2 font-semibold text-neutral-950 hover:bg-lime-200">Ver registros</Link>
            </article>)}</div>}
        </>}
    </main>
  </div>;
}
