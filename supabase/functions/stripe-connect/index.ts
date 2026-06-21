import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import Stripe from "npm:stripe@14"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-12-18.acacia",
    })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: trainerProfile, error: tpError } = await supabase
      .from("trainer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (tpError || !trainerProfile) {
      return new Response(JSON.stringify({ error: "Trainer profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    const url = new URL(req.url)
    const action = url.searchParams.get("action") || "create_account"

    if (action === "create_account") {
      // Create Stripe Connect account if not exists
      let stripeAccountId = trainerProfile.stripe_account_id

      if (!stripeAccountId) {
        const accountType = trainerProfile.trainer_type === "business" ? "company" : "individual"
        const account = await stripe.accounts.create({
          type: "express",
          country: userProfile?.location_country || "US",
          email: userProfile?.email || user.email,
          business_type: accountType,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            name: trainerProfile.business_name || userProfile?.name,
            mcc: "7299",
          },
          metadata: {
            user_id: user.id,
            platform: "ptrain",
          },
        })

        stripeAccountId = account.id

        await supabase
          .from("trainer_profiles")
          .update({
            stripe_account_id: stripeAccountId,
            stripe_account_status: "pending",
          })
          .eq("user_id", user.id)
      }

      // Create onboarding link
      const origin = req.headers.get("origin") || "https://ptrain.app"
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${origin}/trainer/onboarding?step=3&refresh=true`,
        return_url: `${origin}/trainer/onboarding?step=3&stripe_return=true`,
        type: "account_onboarding",
      })

      return new Response(JSON.stringify({
        url: accountLink.url,
        stripe_account_id: stripeAccountId,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "get_status") {
      if (!trainerProfile.stripe_account_id) {
        return new Response(JSON.stringify({ status: "not_started", payout_enabled: false }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const account = await stripe.accounts.retrieve(trainerProfile.stripe_account_id)
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
        .eq("user_id", user.id)

      return new Response(JSON.stringify({ status, payout_enabled: payoutEnabled, details_submitted: account.details_submitted }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "create_dashboard_link") {
      if (!trainerProfile.stripe_account_id) {
        return new Response(JSON.stringify({ error: "No Stripe account" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      const link = await stripe.accounts.createLoginLink(trainerProfile.stripe_account_id)
      return new Response(JSON.stringify({ url: link.url }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "create_checkout") {
      const body = await req.json()
      const { booking_id, listing_id, trainer_id, amount_cents, listing_title } = body

      const { data: trainerPayoutProfile } = await supabase
        .from("trainer_profiles")
        .select("stripe_account_id, payout_enabled")
        .eq("user_id", trainer_id)
        .single()

      if (!trainerPayoutProfile?.stripe_account_id) {
        return new Response(JSON.stringify({ error: "Trainer Stripe account not set up" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const platformFee = Math.round(amount_cents * 0.15)
      const origin = req.headers.get("origin") || "https://ptrain.app"

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: listing_title || "Training Session" },
            unit_amount: amount_cents,
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${origin}/dashboard?booking=${booking_id}&success=true`,
        cancel_url: `${origin}/book/${trainer_id}/${listing_id}?cancelled=true`,
        payment_intent_data: {
          application_fee_amount: platformFee,
          transfer_data: { destination: trainerPayoutProfile.stripe_account_id },
          metadata: { booking_id, listing_id, trainer_id, client_id: user.id },
        },
        metadata: { booking_id, listing_id },
      })

      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("stripe-connect error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
