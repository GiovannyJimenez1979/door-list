import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p className="p-8">Abriendo registro…</p>}><RegistrationRedirect params={params} /></Suspense>;
}

async function RegistrationRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return redirect(`/eventos/${encodeURIComponent(id)}/registro`);
}
