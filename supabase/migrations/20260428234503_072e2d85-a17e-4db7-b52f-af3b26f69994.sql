CREATE TABLE public.ai_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_created_idx ON public.ai_usage (user_id, created_at DESC);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ai usage select"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service role manages ai usage"
  ON public.ai_usage FOR ALL
  USING (auth.role() = 'service_role');