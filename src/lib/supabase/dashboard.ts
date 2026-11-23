import type { AttendeeRegistration, DashboardData, DashboardEvent, Event } from "@/lib/models";
import { supabase } from "./client";

type RegistrationRow = {
  id: string;
  attendee_name: string;
  email: string;
  ticket_type_id: string;
  created_at: string;
};

const pageSize = 1000;

function toDashboardEvent(event: Pick<Event, "id" | "title" | "starts_at" | "venue" | "status" | "capacity">): DashboardEvent {
  return {
    id: event.id,
    title: event.title,
    startsAt: event.starts_at,
    venue: event.venue,
    status: event.status,
    capacity: event.capacity,
  };
}

export async function loadDashboard(userId: string, eventId?: string): Promise<DashboardData> {
  if (!supabase) throw new Error("Supabase unavailable");

  if (!eventId) {
    const { data, error } = await supabase.from("events")
      .select("id,title,starts_at,venue,status,capacity")
      .eq("organizer_id", userId)
      .order("starts_at", { ascending: false });
    if (error) throw error;
    return { events: (data ?? []).map(toDashboardEvent), event: null, ticketTypes: [], registrations: [] };
  }

  const { data: event, error: eventError } = await supabase.from("events")
    .select("id,title,starts_at,venue,status,capacity")
    .eq("id", eventId)
    .eq("organizer_id", userId)
    .maybeSingle();
  if (eventError) throw eventError;
  if (!event) return { events: [], event: null, ticketTypes: [], registrations: [] };

  const { data: ticketTypes, error: ticketError } = await supabase.from("ticket_types")
    .select("id,name,capacity")
    .eq("event_id", eventId)
    .order("name");
  if (ticketError) throw ticketError;

  const registrations: AttendeeRegistration[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("registrations")
      .select("id,attendee_name,email,ticket_type_id,created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as RegistrationRow[];
    registrations.push(...rows.map((row) => ({
      id: row.id,
      attendeeName: row.attendee_name,
      email: row.email,
      ticketTypeId: row.ticket_type_id,
      createdAt: row.created_at,
    })));
    if (rows.length < pageSize) break;
  }

  const counts = new Map<string, number>();
  for (const registration of registrations) {
    counts.set(registration.ticketTypeId, (counts.get(registration.ticketTypeId) ?? 0) + 1);
  }

  return {
    events: [],
    event: toDashboardEvent(event),
    ticketTypes: (ticketTypes ?? []).map((ticketType) => ({
      id: ticketType.id,
      name: ticketType.name,
      capacity: ticketType.capacity,
      registered: counts.get(ticketType.id) ?? 0,
    })),
    registrations,
  };
}
