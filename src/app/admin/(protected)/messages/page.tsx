import { query } from "@/lib/db";
import MessageList from "@/components/admin/MessageList";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { rows } = await query(`SELECT id, name, email, subject, order_ref, message, is_read, created_at FROM contact_messages ORDER BY is_read ASC, created_at DESC LIMIT 200`);
  const messages = rows.map((r) => ({
    id: Number(r.id),
    name: r.name as string,
    email: r.email as string,
    subject: r.subject as string,
    orderRef: (r.order_ref as string | null) ?? null,
    message: r.message as string,
    isRead: !!r.is_read,
    createdAt: new Date(r.created_at).toISOString(),
  }));
  return (
    <div className="ad-wrap">
      <h1 className="ad-h1 plain" style={{ marginTop: 34 }}>Messages ({messages.length})</h1>
      <MessageList initial={messages} />
    </div>
  );
}