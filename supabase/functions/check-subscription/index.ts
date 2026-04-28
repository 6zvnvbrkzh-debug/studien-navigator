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
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user?.email) throw new Error("Unauthorized");
    const user = userData.user;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let subscribed = false;
    let subscriptionEnd: string | null = null;
    let customerId: string | null = null;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      if (subs.data.length > 0) {
        subscribed = true;
        subscriptionEnd = new Date(subs.data[0].current_period_end * 1000).toISOString();
      }
    }

    await adminClient.from("subscribers").upsert({
      user_id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      subscribed,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    await adminClient.from("profiles").update({
      premium_until: subscriptionEnd,
    }).eq("user_id", user.id);

    return new Response(JSON.stringify({ subscribed, subscription_end: subscriptionEnd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});