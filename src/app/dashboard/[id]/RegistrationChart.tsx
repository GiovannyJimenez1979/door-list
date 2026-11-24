"use client";

import { useEffect, useState } from "react";
import { formatCalendarDay, formatChartDay } from "@/lib/dates";
import type { RegistrationSeriesResponse } from "@/lib/models";
import { supabase } from "@/lib/supabase/client";

export default function RegistrationChart({ eventId }: { eventId: string }) {
  const [series, setSeries] = useState<RegistrationSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError(false);
      try {
        const { data: sessionData } = await supabase!.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Missing session");
        const response = await fetch(`/api/eventos/${encodeURIComponent(eventId)}/registros-diarios`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Could not fetch registration series");
        const result = await response.json() as RegistrationSeriesResponse;
        if (active) setSeries(result);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [eventId, retry]);

  const days = series?.days ?? [];
  const max = Math.max(1, ...days.map((entry) => entry.registrations));
  const width = Math.max(640, days.length * 36);
  const plotHeight = 180;
  const plotTop = 12;
  const baseline = plotTop + plotHeight;
  const step = width / Math.max(1, days.length);
  const labelEvery = Math.max(1, Math.ceil(96 / step));

  return <section className="mt-10" aria-labelledby="daily-registrations-title">
    <h2 id="daily-registrations-title" className="text-2xl font-semibold">Registros por día</h2>
    <p className="mt-3 text-sm text-neutral-400">Desde la publicación del evento · hora de Colombia</p>
    {loading ? <div role="status" aria-busy="true" className="mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6 text-neutral-400">{retry > 0 ? "Reintentando cargar los registros por día…" : "Cargando registros por día…"}</div>
      : error ? <div role="alert" className="mt-5 rounded-2xl border border-amber-400/40 bg-neutral-900 p-6">
        <p className="text-amber-200">No se pudo cargar la gráfica de registros.</p>
        <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-5 rounded-lg bg-lime-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">Reintentar</button>
      </div>
      : !series?.publishedAt ? <div className="mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6">
        <p className="font-semibold">Este evento aún no se ha publicado.</p>
        <p className="mt-3 text-sm text-neutral-400">La gráfica aparecerá cuando publiques el evento.</p>
      </div>
      : days.every((entry) => entry.registrations === 0) ? <div className="mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6">
        <p className="font-semibold">Todavía no hay registros para este evento.</p>
        <p className="mt-3 text-sm text-neutral-400">La gráfica mostrará los registros diarios cuando alguien reserve una entrada.</p>
      </div>
      : <div className="mt-5 rounded-2xl border border-white/15 bg-neutral-900 p-6">
        <div className="overflow-x-auto" role="region" aria-label="Gráfica de registros por día" tabIndex={0}>
          <svg viewBox={`0 0 ${width} 240`} width={width} height="240" role="img" aria-label="Barras de registros diarios desde la publicación del evento">
            <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="#737373" />
            {days.map((entry, index) => {
              const height = entry.registrations / max * plotHeight;
              const x = index * step + (step - 22) / 2;
              return <g key={entry.day}>
                <rect x={x} y={baseline - height} width="22" height={height} rx="3" fill="#bef264">
                  <title>{formatCalendarDay(entry.day)}: {entry.registrations} registros</title>
                </rect>
                {(index === 0 || index === days.length - 1 || (index % labelEvery === 0 && days.length - 1 - index >= labelEvery)) && <text x={index * step + step / 2} y="216" fill="#a3a3a3" textAnchor={index === 0 ? "start" : index === days.length - 1 ? "end" : "middle"} fontSize="12">{formatChartDay(entry.day)}</text>}
              </g>;
            })}
          </svg>
        </div>
        <table className="sr-only"><caption>Registros por día</caption><thead><tr><th scope="col">Día</th><th scope="col">Registros</th></tr></thead><tbody>{days.map((entry) => <tr key={entry.day}><td>{formatCalendarDay(entry.day)}</td><td>{entry.registrations}</td></tr>)}</tbody></table>
      </div>}
  </section>;
}
