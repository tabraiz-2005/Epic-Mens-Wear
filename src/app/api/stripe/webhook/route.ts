import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export const runtime = "nodejs";

function getObjectId(
    value: string | { id: string } | null
): string | null {
    if (!value) return null;
    return typeof value === "string" ? value : value.id;
}

async function confirmPayment(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.order_id;

    if (!orderId) {
        throw new Error("Stripe session is missing order_id metadata.");
    }

    const paymentIntentId = getObjectId(session.payment_intent);
    const customerId = getObjectId(session.customer);

    const { error } = await getSupabaseAdmin().rpc("confirm_order_payment", {
        p_order_id: orderId,
        p_checkout_session_id: session.id,
        p_payment_intent_id: paymentIntentId,
        p_stripe_customer_id: customerId,
    });

    if (error) {
        throw error;
    }
}

async function releaseInventory(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.order_id;

    if (!orderId) {
        throw new Error("Stripe session is missing order_id metadata.");
    }

    const { error } = await getSupabaseAdmin().rpc(
        "release_order_inventory",
        {
            p_order_id: orderId,
        }
    );

    if (error) {
        throw error;
    }
}

export async function POST(request: NextRequest) {
    const webhookSecret = env.stripeWebhookSecret;
    const signature = request.headers.get("stripe-signature");

    if (!webhookSecret || !signature) {
        return NextResponse.json(
            { error: "Webhook configuration is missing." },
            { status: 400 }
        );
    }

    const payload = await request.text();

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(
            payload,
            signature,
            webhookSecret
        );
    } catch {
        return NextResponse.json(
            { error: "Invalid webhook signature." },
            { status: 400 }
        );
    }

    const object = event.data.object as { id?: string };

    const { error: claimError } = await getSupabaseAdmin()
        .from("stripe_webhook_events")
        .insert({
            stripe_event_id: event.id,
            event_type: event.type,
            object_id: object.id ?? null,
            livemode: event.livemode,
            processing_status: "processing",
        });

    if (claimError?.code === "23505") {
        const { data: existing, error: existingError } =
            await getSupabaseAdmin()
                .from("stripe_webhook_events")
                .select("processing_status, received_at")
                .eq("stripe_event_id", event.id)
                .single();

        if (existingError) {
            return NextResponse.json(
                { error: "Unable to check webhook status." },
                { status: 500 }
            );
        }

        if (existing.processing_status === "completed") {
            return NextResponse.json({ received: true });
        }

        const receivedAt = new Date(existing.received_at).getTime();
        const isRecentlyProcessing =
            existing.processing_status === "processing" &&
            Date.now() - receivedAt < 5 * 60 * 1000;

        if (isRecentlyProcessing) {
            return NextResponse.json({ received: true });
        }

        const { error: retryError } = await getSupabaseAdmin()
            .from("stripe_webhook_events")
            .update({
                processing_status: "processing",
                error_message: null,
                received_at: new Date().toISOString(),
            })
            .eq("stripe_event_id", event.id);

        if (retryError) {
            return NextResponse.json(
                { error: "Unable to retry webhook." },
                { status: 500 }
            );
        }
    } else if (claimError) {
        return NextResponse.json(
            { error: "Unable to register webhook." },
            { status: 500 }
        );
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;

                if (
                    session.payment_status === "paid" ||
                    session.payment_status === "no_payment_required"
                ) {
                    await confirmPayment(session);
                }

                break;
            }

            case "checkout.session.async_payment_succeeded": {
                await confirmPayment(event.data.object);
                break;
            }

            case "checkout.session.expired":
            case "checkout.session.async_payment_failed": {
                await releaseInventory(event.data.object);
                break;
            }

            default:
                break;
        }

        const { error: completionError } = await getSupabaseAdmin()
            .from("stripe_webhook_events")
            .update({
                processing_status: "completed",
                processed_at: new Date().toISOString(),
                error_message: null,
            })
            .eq("stripe_event_id", event.id);

        if (completionError) {
            throw completionError;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message.slice(0, 500)
                : "Unknown webhook processing error";

        await getSupabaseAdmin()
            .from("stripe_webhook_events")
            .update({
                processing_status: "failed",
                processed_at: new Date().toISOString(),
                error_message: message,
            })
            .eq("stripe_event_id", event.id);

        console.error("Stripe webhook processing failed:", error);

        return NextResponse.json(
            { error: "Webhook processing failed." },
            { status: 500 }
        );
    }
}
