import { createClient } from "@supabase/supabase-js";
import type { DailyRegistration, RegistrationSeriesResponse } from "@/lib/models";
import { eventDay } from "@/lib/dates";

const pageSize = 1000;

function nextDay(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request, context: RouteContext<"/api/eventos/[id]/registros-diarios">) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return Response.json({ error: "Identificador de evento inválido." }, { status: 400 });
  }

  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ error: "No se pudo consultar la gráfica." }, { status: 503 });

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return Response.json({ error: "Debes iniciar sesión." }, { status: 401 });

    const eventQuery = supabase.from("events")
      .select("status,created_at,published_at")
      .eq("id", id)
      .eq("organizer_id", auth.user.id);
    let { data: event, error: eventError } = await eventQuery.maybeSingle();
    if (eventError?.code === "42703" || eventError?.code === "PGRST204") {
      const fallback = await supabase.from("events")
        .select("status,created_at")
        .eq("id", id)
        .eq("organizer_id", auth.user.id)
        .maybeSingle();
      event = fallback.data as typeof event;
      eventError = fallback.error;
    }
    if (eventError) throw eventError;
    if (!event) return Response.json({ error: "Evento no disponible." }, { status: 404 });

    const eventRow = event as { status: string; created_at: string; published_at?: string | null };
    const publishedAt = Object.hasOwn(eventRow, "published_at")
      ? eventRow.published_at ?? null
      : eventRow.status === "publicado" ? eventRow.created_at : null;
    if (!publishedAt) {
      return Response.json({ publishedAt: null, days: [] } satisfies RegistrationSeriesResponse);
    }

    const counts = new Map<string, number>();
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase.from("registrations")
        .select("id,created_at")
        .eq("event_id", id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      for (const registration of data ?? []) {
        const day = eventDay(registration.created_at);
        counts.set(day, (counts.get(day) ?? 0) + 1);
      }
      if ((data ?? []).length < pageSize) break;
    }

    const days: DailyRegistration[] = [];
    const today = eventDay(new Date().toISOString());
    for (let day = eventDay(publishedAt); day <= today; day = nextDay(day)) {
      days.push({ day, registrations: counts.get(day) ?? 0 });
    }
    const response: RegistrationSeriesResponse = {
      publishedAt,
      days,
    };
    return Response.json(response);
  } catch (error) {
    console.error("Could not load daily registrations", error);
    return Response.json({ error: "No se pudo consultar la gráfica." }, { status: 502 });
  }
}
