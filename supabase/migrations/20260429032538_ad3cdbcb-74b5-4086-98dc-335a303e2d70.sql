
-- Roles
CREATE TYPE public.app_role AS ENUM ('bendahara', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Bendahara can manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'bendahara'))
  WITH CHECK (public.has_role(auth.uid(), 'bendahara'));

-- Members (peserta)
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  block TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Bendahara can manage members" ON public.members FOR ALL
  USING (public.has_role(auth.uid(), 'bendahara'))
  WITH CHECK (public.has_role(auth.uid(), 'bendahara'));

-- Monthly dues (nominal iuran tiap bulan)
CREATE TABLE public.monthly_dues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period DATE NOT NULL UNIQUE, -- gunakan tanggal 1 tiap bulan
  amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_dues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view dues" ON public.monthly_dues FOR SELECT USING (true);
CREATE POLICY "Bendahara can manage dues" ON public.monthly_dues FOR ALL
  USING (public.has_role(auth.uid(), 'bendahara'))
  WITH CHECK (public.has_role(auth.uid(), 'bendahara'));

-- Payments (pembayaran peserta per bulan)
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  period DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, period)
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Bendahara can manage payments" ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'bendahara'))
  WITH CHECK (public.has_role(auth.uid(), 'bendahara'));

-- Transactions (pemasukan & pengeluaran kas)
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Bendahara can manage transactions" ON public.transactions FOR ALL
  USING (public.has_role(auth.uid(), 'bendahara'))
  WITH CHECK (public.has_role(auth.uid(), 'bendahara'));

-- Auto-assign 'bendahara' role to first user signup, 'user' to others
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'bendahara');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_dues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
