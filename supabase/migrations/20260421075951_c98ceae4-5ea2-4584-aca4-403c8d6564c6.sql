ALTER TABLE public.investment_plans
ADD COLUMN IF NOT EXISTS roi_cap_multiplier numeric NOT NULL DEFAULT 3;

UPDATE public.investment_plans
SET roi_cap_multiplier = 3
WHERE roi_cap_multiplier IS NULL;