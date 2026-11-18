import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Ticket = { ticket_code: string; attendee_name: string; email: string; event_title: string; starts_at: string; venue: string };

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!apiKey || !from || !supabaseUrl || !supabaseKey) return NextResponse.json({ error: "El servicio de correo no está configurado." }, { status: 503 });
  let ticketCode = "";
  try { const body = await request.json() as { ticketCode?: unknown }; ticketCode = typeof body.ticketCode === "string" ? body.ticketCode.trim() : ""; } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!ticketCode || ticketCode.length > 200) return NextResponse.json({ error: "Código de entrada inválido." }, { status: 400 });
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("ticket_by_code", { p_code: ticketCode });
  const ticket = (data as Ticket[] | null)?.[0];
  if (error || !ticket) return NextResponse.json({ error: "No se encontró la entrada para enviar." }, { status: 404 });
  let qrResponse: Response;
  try { qrResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(ticket.ticket_code)}`); } catch { return NextResponse.json({ error: "No se pudo conectar con el generador de códigos QR." }, { status: 502 }); }
  if (!qrResponse.ok) return NextResponse.json({ error: "No se pudo generar el código QR." }, { status: 502 });
  const qrBase64 = Buffer.from(await qrResponse.arrayBuffer()).toString("base64");
  const date = new Date(ticket.starts_at).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "long", timeStyle: "short" });
  const eventTitle = escapeHtml(ticket.event_title); const attendeeName = escapeHtml(ticket.attendee_name); const venue = escapeHtml(ticket.venue); const code = escapeHtml(ticket.ticket_code);
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f5f5f5;color:#171717;font-family:Arial,sans-serif"><main style="max-width:560px;margin:0 auto;padding:32px 20px"><section style="background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:32px"><p style="color:#65a30d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Door List · Entrada digital</p><h1 style="font-size:28px;margin:16px 0 8px">${eventTitle}</h1><p style="margin:0 0 24px;color:#525252">Hola ${attendeeName}, tu registro está confirmado.</p><dl style="line-height:1.7"><dt style="color:#737373;font-size:12px;text-transform:uppercase">Fecha</dt><dd style="margin:0 0 12px">${escapeHtml(date)}</dd><dt style="color:#737373;font-size:12px;text-transform:uppercase">Lugar</dt><dd style="margin:0">${venue}</dd></dl><div style="margin-top:28px;padding-top:24px;border-top:1px dashed #d4d4d4;text-align:center"><img src="cid:ticket-qr" width="280" height="280" alt="Código QR de la entrada" style="display:block;margin:0 auto;width:280px;height:280px"/><p style="color:#737373;font-size:12px;letter-spacing:1px;text-transform:uppercase">Código de entrada</p><code style="color:#65a30d;word-break:break-all">${code}</code></div></section></main></body></html>`;
  const resend = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [ticket.email], subject: `Tu entrada para ${ticket.event_title}`, html, attachments: [{ filename: "entrada-qr.png", content: qrBase64, content_id: "ticket-qr" }] }) });
  if (!resend.ok) {
    const responseBody = await resend.json().catch(() => null) as { message?: string } | null;
    console.error("Resend rechazó el correo", { status: resend.status, message: responseBody?.message });
    const message = resend.status === 403
      ? "Resend rechazó el envío. Con onboarding@resend.dev solo puedes enviar al email propietario de la cuenta; para otros destinatarios verifica un dominio y usa ese remitente."
      : "Resend no pudo enviar el correo. Verifica la API key, el remitente y el destinatario.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  return NextResponse.json({ sent: true });
}
