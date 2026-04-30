
-- Buat tabel app_settings untuk menyimpan password bendahara
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Public can insert settings" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update settings" ON public.app_settings FOR UPDATE USING (true) WITH CHECK (true);

INSERT INTO public.app_settings (key, value) VALUES ('bendahara_password', 'bendaharanawa2023')
ON CONFLICT (key) DO NOTHING;

-- Hapus policy lama yang berbasis role bendahara, ganti jadi public write (otorisasi via password klien)
DROP POLICY IF EXISTS "Bendahara can manage members" ON public.members;
DROP POLICY IF EXISTS "Bendahara can manage dues" ON public.monthly_dues;
DROP POLICY IF EXISTS "Bendahara can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Bendahara can manage transactions" ON public.transactions;

CREATE POLICY "Public can manage members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage dues" ON public.monthly_dues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
