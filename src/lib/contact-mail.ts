import type { ContactInput } from "./contact";

// Sends you an email for each message if RESEND_API_KEY and CONTACT_TO_EMAIL are set (resend.com).
// Messages are ALWAYS saved in the database first.
export async function notifyContact(m: ContactInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev",
        to: [to],
        reply_to: m.email,
        subject: `[Contact] ${m.subject} — ${m.name}`,
        text: `From: ${m.name} <${m.email}>\nSubject: ${m.subject}\nOrder: ${m.orderRef ?? "-"}\n\n${m.message}`,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    /* ignore: the message is already stored */
  }
}