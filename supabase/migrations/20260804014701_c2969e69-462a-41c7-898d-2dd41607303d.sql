CREATE TABLE public.payment_gateway_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  api_key text,
  ipn_secret text,
  is_enabled boolean NOT NULL DEFAULT false,
  min_amount numeric NOT NULL DEFAULT 10,
  pay_currency text NOT NULL DEFAULT 'usdtbsc',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateway_config TO authenticated;
GRANT ALL ON public.payment_gateway_config TO service_role;

ALTER TABLE public.payment_gateway_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment gateway config"
ON public.payment_gateway_config FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payment_gateway_config_updated_at
BEFORE UPDATE ON public.payment_gateway_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_gateway_config (provider) VALUES ('nowpayments') ON CONFLICT DO NOTHING;