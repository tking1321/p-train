import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import Stripe from "npm:stripe@14"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-12-18.acacia",
    })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    const sig = req.headers.get("stripe-signature")!
    const body = await req.text()

    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 })
    }

    // Idempotency check
    const { data: existing } = await supabase
      .from("stripe_webhook_events")
      .select("id")
      .eq("id", event.id)
      .single()

    if (existing) {
      return new Response(JSON.stringify({ received: true, skipped: true }), { status: 200 })
    }

    await supabase.from("stripe_webhook_events").insert({
      id: event.id,
      event_type: event.type,
      payload: event,
      processed: false,
    })

    const obj = event.data.object as Record<string, unknown>

    switch (event.type) {
      case "account.updated": {
        const account = obj as Stripe.Account
        const { data: tp } = await supabase
          .from("trainer_profiles")
          .select("user_id")
          .eq("stripe_account_id", account.id)
          .single()

        if (tp) {
          const payoutEnabled = account.payouts_enabled && account.charges_enabled
          const status = payoutEnabled ? "verified" :
            account.requirements?.disabled_reason ? "restricted" : "pending"

          await supabase
            .from("trainer_profiles")
            .update({
              stripe_account_status: status,
              stripe_onboarding_completed: account.details_submitted,
              payout_enabled: payoutEnabled,
              account_capabilities: account.capabilities || {},
            })
            .eq("stripe_account_id", account.id)
        }
        break
      }

      case "payment_intent.succeeded": {
        const pi = obj as Stripe.PaymentIntent
        const meta = pi.metadata as Record<string, string>
        if (!meta?.booking_id) break

        const platformFee = pi.application_fee_amount || Math.round(pi.amount * 0.15)
        const trainerNet = pi.amount - platformFee

        await supabase
          .from("bookings")
          .update({
            payment_status: "paid",
            status: "confirmed",
            stripe_payment_intent_id: pi.id,
          })
          .eq("id", meta.booking_id)

        const { data: booking } = await supabase
          .from("bookings")
          .select("trainer_id")
          .eq("id", meta.booking_id)
          .single()

        if (booking) {
          await supabase.from("earnings_ledger").insert({
            trainer_id: booking.trainer_id,
            booking_id: meta.booking_id,
            gross_amount: pi.amount,
            platform_fee_amount: platformFee,
            net_amount: trainerNet,
            currency: pi.currency,
            payout_status: "pending",
          })
        }
        break
      }

      case "payment_intent.payment_failed": {
        const pi = obj as Stripe.PaymentIntent
        const meta = pi.metadata as Record<string, string>
        if (meta?.booking_id) {
          await supabase
            .from("bookings")
            .update({ payment_status: "failed" })
            .eq("id", meta.booking_id)
        }
        break
      }

      case "checkout.session.completed": {
        const session = obj as Stripe.Checkout.Session
        const meta = session.metadata as Record<string, string>
        if (meta?.booking_id) {
          await supabase
            .from("bookings")
            .update({
              stripe_checkout_session_id: session.id,
              payment_status: session.payment_status === "paid" ? "paid" : "pending",
              status: session.payment_status === "paid" ? "confirmed" : "pending",
            })
            .eq("id", meta.booking_id)
        }
        break
      }

      case "payout.paid": {
        const payout = obj as Stripe.Payout
        if (payout.destination) {
          await supabase
            .from("earnings_ledger")
            .update({ payout_status: "paid", stripe_payout_id: payout.id })
            .eq("stripe_payout_id", payout.id)
        }
        break
      }

      case "payout.failed": {
        const payout = obj as Stripe.Payout
        await supabase
          .from("earnings_ledger")
          .update({ payout_status: "failed" })
          .eq("stripe_payout_id", payout.id)
        break
      }

      case "charge.refunded": {
        const charge = obj as Stripe.Charge
        if (charge.payment_intent) {
          await supabase
            .from("bookings")
            .update({ payment_status: "refunded", status: "cancelled" })
            .eq("stripe_payment_intent_id", charge.payment_intent as string)
        }
        break
      }

      case "charge.dispute.created": {
        const dispute = obj as Stripe.Dispute
        await supabase
          .from("bookings")
          .update({ payment_status: "disputed" })
          .eq("stripe_payment_intent_id", dispute.payment_intent as string)
        break
      }

      case "charge.dispute.closed": {
        const dispute = obj as Stripe.Dispute
        const finalStatus = dispute.status === "won" ? "paid" : "refunded"
        await supabase
          .from("bookings")
          .update({ payment_status: finalStatus })
          .eq("stripe_payment_intent_id", dispute.payment_intent as string)
        break
      }
    }

    // Mark event as processed
    await supabase
      .from("stripe_webhook_events")
      .update({ processed: true })
      .eq("id", event.id)

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
