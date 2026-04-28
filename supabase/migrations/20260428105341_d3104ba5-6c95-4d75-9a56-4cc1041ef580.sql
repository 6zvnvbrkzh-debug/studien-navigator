-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'premium', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update handle_new_user to also assign default 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Sync premium role from subscribers table
CREATE OR REPLACE FUNCTION public.sync_premium_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subscribed = true AND (NEW.subscription_end IS NULL OR NEW.subscription_end > now()) THEN
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

DROP TRIGGER IF EXISTS sync_premium_role_trigger ON public.subscribers;
CREATE TRIGGER sync_premium_role_trigger
AFTER INSERT OR UPDATE ON public.subscribers
FOR EACH ROW EXECUTE FUNCTION public.sync_premium_role();

-- 7. Backfill: assign 'user' role to all existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Backfill: assign 'premium' role to currently subscribed users
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'premium'::app_role FROM public.subscribers
WHERE subscribed = true AND (subscription_end IS NULL OR subscription_end > now())
ON CONFLICT (user_id, role) DO NOTHING;