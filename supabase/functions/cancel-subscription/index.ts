import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const { environment } = await req.json().catch(() => ({ environment: "sandbox" }));
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Unauthorized");
    const user = userData.user;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("stripe_subscription_id, cancel_at_period_end, current_period_end")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) throw new Error("No active subscription");

    if (sub.cancel_at_period_end) {
      const cancelAt = sub.current_period_end ? Math.floor(new Date(sub.current_period_end as string).getTime() / 1000) : null;
      return new Response(
        JSON.stringify({ alreadyCanceled: true, cancel_at: cancelAt }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const stripe = createStripeClient(environment as StripeEnv);
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const item = updated.items?.data?.[0];
    const periodEnd = item?.current_period_end ?? (updated as any).current_period_end;
    const endIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

    await adminClient
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        current_period_end: endIso,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);

    return new Response(
      JSON.stringify({ canceled: true, cancel_at: periodEnd }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("cancel-subscription error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
