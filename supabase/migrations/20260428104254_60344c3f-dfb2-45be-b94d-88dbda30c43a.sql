
-- Update timestamp helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  hochschule TEXT,
  semester INT,
  bafoeg_status TEXT DEFAULT 'unbekannt',
  language TEXT DEFAULT 'de',
  monthly_budget NUMERIC(10,2) DEFAULT 0,
  savings_goal NUMERIC(10,2) DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  premium_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category TEXT NOT NULL,
  note TEXT,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own tx insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tx update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own tx delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_tx_user_date ON public.transactions(user_id, occurred_on DESC);

-- BAFOEG CHECKLIST
CREATE TABLE public.bafoeg_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_key)
);
ALTER TABLE public.bafoeg_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own check select" ON public.bafoeg_checklist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own check insert" ON public.bafoeg_checklist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own check update" ON public.bafoeg_checklist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own check delete" ON public.bafoeg_checklist FOR DELETE USING (auth.uid() = user_id);

-- BAFOEG DEADLINES
CREATE TABLE public.bafoeg_deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bafoeg_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dl select" ON public.bafoeg_deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own dl insert" ON public.bafoeg_deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own dl update" ON public.bafoeg_deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own dl delete" ON public.bafoeg_deadlines FOR DELETE USING (auth.uid() = user_id);

-- JOBS (public read)
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  city TEXT NOT NULL,
  hourly_wage NUMERIC(6,2),
  remote BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  apply_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs read all" ON public.jobs FOR SELECT TO authenticated USING (true);

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own app select" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own app insert" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own app update" ON public.applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own app delete" ON public.applications FOR DELETE USING (auth.uid() = user_id);

-- SUBSCRIBERS
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sub select" ON public.subscribers FOR SELECT USING (auth.uid() = user_id);
-- inserts/updates done by edge functions with service role

-- SEED JOBS
INSERT INTO public.jobs (title, company, city, hourly_wage, remote, description, apply_url) VALUES
('Werkstudent Software Engineering', 'TechBerlin GmbH', 'Berlin', 18.50, true, 'Mitarbeit in unserem Frontend-Team mit React und TypeScript. Flexible Zeiten, perfekt fürs Studium.', 'https://example.com'),
('Werkstudent Marketing', 'MunichMedia AG', 'München', 16.00, false, 'Unterstütze unser Social-Media-Team. Erfahrung mit Instagram & TikTok von Vorteil.', 'https://example.com'),
('Werkstudent Data Analytics', 'DataHaus', 'Hamburg', 19.00, true, 'Datenanalyse mit SQL und Python. Ideal für Studierende der Informatik oder Mathematik.', 'https://example.com'),
('Werkstudent Vertrieb', 'SalesPro Köln', 'Köln', 15.50, false, 'Telefonische Akquise und Kundenbetreuung. Kommunikationsstark und motiviert.', 'https://example.com'),
('Werkstudent UX Design', 'DesignLab', 'Berlin', 17.00, true, 'Mitarbeit an Designsystemen, Prototyping in Figma. Portfolio erforderlich.', 'https://example.com'),
('Werkstudent HR', 'PeopleFirst GmbH', 'Frankfurt', 15.00, false, 'Unterstützung des Recruiting-Teams. Erste Praxis im HR-Bereich.', 'https://example.com'),
('Werkstudent Finance', 'FinTech Stuttgart', 'Stuttgart', 17.50, false, 'Mitarbeit im Controlling. BWL- oder VWL-Studium erforderlich.', 'https://example.com'),
('Werkstudent Content Creation', 'CreatorHub', 'Leipzig', 14.50, true, 'Erstelle Blog-Artikel und Newsletter-Content. Sehr flexible Arbeitszeiten.', 'https://example.com'),
('Werkstudent IT-Support', 'CloudServe', 'Düsseldorf', 16.50, false, '1st-Level-Support für interne Tools. Ideal für IT-affine Studierende.', 'https://example.com'),
('Werkstudent Backend Dev', 'APInauts', 'Berlin', 20.00, true, 'Node.js & Postgres Backend-Entwicklung. Mind. 16h/Woche.', 'https://example.com'),
('Werkstudent Customer Success', 'SaaSify', 'München', 16.00, true, 'Onboarding neuer Kunden, E-Mail-Support. Englisch fließend.', 'https://example.com'),
('Werkstudent Product Management', 'ProductCo', 'Hamburg', 18.00, false, 'Unterstützung des PM-Teams bei Roadmap und User Research.', 'https://example.com');
