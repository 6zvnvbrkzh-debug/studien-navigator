-- Subscriptions table for Lovable's built-in Stripe payments
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Sync premium role from new subscriptions table (similar to existing sync_premium_role for subscribers)
CREATE OR REPLACE FUNCTION public.sync_premium_role_from_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('active', 'trialing')
     AND (NEW.current_period_end IS NULL OR NEW.current_period_end > now()) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'premium')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.status = 'canceled' AND NEW.current_period_end > now() THEN
    -- Still has access until period end
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'premium')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'premium';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_premium_on_subscription ON public.subscriptions;
CREATE TRIGGER sync_premium_on_subscription
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_premium_role_from_subscriptions();