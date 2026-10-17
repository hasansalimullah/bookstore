export const CONTACT_SUBJECTS = ["General question", "Order & shipping", "Book recommendation", "Returns & refunds", "Other"] as const;

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  orderRef: string | null;
  message: string;
}

export function validateContact(raw: unknown): { ok: true; value: ContactInput } | { ok: false; errors: Record<string, string> } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (k: string, max: number) => (typeof r[k] === "string" ? (r[k] as string).trim().slice(0, max) : "");
  const name = str("name", 120);
  const email = str("email", 200);
  const subject = str("subject", 80) || "General question";
  const orderRef = str("orderRef", 60);
  const message = str("message", 5000);
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Please enter a valid email";
  if (!(CONTACT_SUBJECTS as readonly string[]).includes(subject)) errors.subject = "Please choose a subject";
  if (message.length < 10) errors.message = "Please write at least 10 characters";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name, email, subject, orderRef: orderRef || null, message } };
}