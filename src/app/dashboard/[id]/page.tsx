import OrganizerDashboard from "@/components/OrganizerDashboard";
import { Suspense } from "react";

export default function DashboardEventPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p className="p-8" role="status">Abriendo evento…</p>}><DashboardEvent params={params} /></Suspense>;
}

async function DashboardEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizerDashboard eventId={id} />;
}
