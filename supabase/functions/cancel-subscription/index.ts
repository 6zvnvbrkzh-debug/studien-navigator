import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user?.email) throw new Error("Unauthorized");
    const user = userData.user;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) throw new Error("No Stripe customer found");
    const customerId = customers.data[0].id;

    // Find an active or trialing subscription
    let subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    if (subs.data.length === 0) {
      subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
    }
    if (subs.data.length === 0) throw new Error("No active subscription");

    const sub = subs.data[0];
    if (sub.cancel_at_period_end) {
      return new Response(
        JSON.stringify({
          alreadyCanceled: true,
          cancel_at: sub.current_period_end,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const updated = await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: true,
    });

    return new Response(
      JSON.stringify({ canceled: true, cancel_at: updated.current_period_end }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});