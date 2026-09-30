import { config } from "@/lib/config";
import { cancelBySession, markPaidBySession } from "@/lib/orders";
import { verifyStripeSignature } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe → us. Signature-verified; the ONLY thing that marks an order as paid.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), config.stripeWebhookSecret)) {
    return new Response("invalid signature", { status: 400 });
  }
  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const s = event.data?.object ?? {};
  const publicId = typeof s.client_reference_id === "string" ? s.client_reference_id : null;

  try {
    if (publicId && (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && s.payment_status === "paid") {
      const ok = await markPaidBySession({
        publicId,
        sessionId: String(s.id),
        amountTotal: Number(s.amount_total),
        currency: String(s.currency ?? ""),
        paymentIntent: typeof s.payment_intent === "string" ? s.payment_intent : null,
      });
      if (!ok) console.warn(`[stripe] order ${publicId} not marked paid (already paid, unknown, or amount mismatch)`);
    } else if (publicId && (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed")) {
      await cancelBySession(publicId);
    }
  } catch (e) {
    console.error("[stripe] webhook processing failed:", e instanceof Error ? e.message : e);
    return new Response("error", { status: 500 }); // Stripe will retry
  }
  return Response.json({ received: true });
}
