export type Event = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  starts_at: string;
  venue: string;
  status: "borrador" | "publicado";
  capacity: number;
  ticket_types: TicketType[];
};

export type TicketType = {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
};

export type Ticket = {
  ticket_code: string;
  status: "valid" | "used" | "revoked";
  attendee_name: string;
  email: string;
  event_title: string;
  event_description: string;
  starts_at: string;
  venue: string;
  ticket_name: string;
};

export type Registration = {
  registration_id: string;
  ticket_code: string;
};

export type RegistrationOption = {
  ticket_type_id: string;
  name: string;
  remaining: number;
};

export type DashboardEvent = {
  id: string;
  title: string;
  startsAt: string;
  venue: string;
  status: Event["status"];
  capacity: number;
};

export type TicketTypeOccupancy = {
  id: string;
  name: string;
  capacity: number;
  registered: number;
};

export type AttendeeRegistration = {
  id: string;
  attendeeName: string;
  email: string;
  ticketTypeId: string;
  createdAt: string;
};

export type DashboardData = {
  events: DashboardEvent[];
  event: DashboardEvent | null;
  ticketTypes: TicketTypeOccupancy[];
  registrations: AttendeeRegistration[];
};
