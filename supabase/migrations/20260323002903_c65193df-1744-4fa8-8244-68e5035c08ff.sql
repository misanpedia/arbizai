CREATE TABLE public.user_static_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  address text NOT NULL,
  network text NOT NULL DEFAULT 'BSC',
  currency text NOT NULL DEFAULT 'USDT',
  track_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, network, currency)
);

ALTER TABLE public.user_static_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own static addresses"
  ON public.user_static_addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage static addresses"
  ON public.user_static_addresses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));