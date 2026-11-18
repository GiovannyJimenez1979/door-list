"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Event = { id: string; title: string; description: string; starts_at: string; venue: string };

function eventDay(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  return ["year", "month", "day"].map((part) => parts.find((item) => item.type === part)?.value).join("-");
}

function registrationIsOpen(value: string) {
  return eventDay(value) >= eventDay(new Date().toISOString());
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [state, setState] = useState("loading");
  useEffect(() => {
    if (!supabase) return;
    supabase.from("events").select("id,title,description,starts_at,venue").in("status", ["published", "publicado"]).order("starts_at").then(({ data, error }) => {
      if (error) setState("error");
      else { setEvents((data ?? []).filter((event) => registrationIsOpen(event.starts_at))); setState("ready"); }
    });
  }, []);
  return <div className="mx-auto min-h-svh max-w-6xl px-6 pb-16 sm:px-12"><header className="flex items-center py-8 text-xl font-bold">door list<span className="text-lime-300">.</span><Link href="/organizador" className="ml-auto text-sm font-medium text-neutral-300 hover:text-lime-300">Panel del organizador</Link></header><main className="py-12"><p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">Door List / Eventos</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">Próximos eventos</h1><p className="mt-4 text-neutral-400">Encuentra tu evento y reserva tu entrada.</p>{!supabase ? <p className="mt-10">Configura Supabase para ver los eventos.</p> : state === "loading" ? <p className="mt-10" role="status">Cargando eventos…</p> : state === "error" ? <p className="mt-10" role="alert">No se pudieron cargar los eventos.</p> : events.length === 0 ? <p className="mt-10 rounded-2xl border border-white/15 p-6">No hay eventos disponibles para registro.</p> : <div className="mt-10 grid gap-5 md:grid-cols-2">{events.map((event) => <article key={event.id} className="flex flex-col rounded-2xl border border-white/15 bg-neutral-900 p-7"><p className="text-sm text-lime-300">{new Date(event.starts_at).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "long", timeStyle: "short" })}</p><h2 className="mt-3 text-2xl font-semibold">{event.title}</h2><p className="mt-2 text-neutral-400">{event.venue}</p><p className="mt-5 flex-1 text-sm text-neutral-300">{event.description}</p><Link href={`/eventos/${event.id}/registro`} className="mt-7 w-fit rounded-lg bg-lime-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-lime-200">Registrarme</Link></article>)}</div>}</main></div>;
}
