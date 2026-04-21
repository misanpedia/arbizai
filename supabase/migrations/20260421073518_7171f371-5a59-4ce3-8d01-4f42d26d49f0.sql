
-- Add total_profit and max_roi columns to investments
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS total_profit numeric DEFAULT 0;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS max_roi numeric DEFAULT 0;

-- Update existing investments to set max_roi = amount * 3 (300%)
UPDATE public.investments SET max_roi = amount * 3 WHERE max_roi = 0 OR max_roi IS NULL;

-- Calculate total_profit for existing investments from profits table
UPDATE public.investments i SET total_profit = COALESCE(
  (SELECT SUM(p.amount) FROM public.profits p WHERE p.investment_id = i.id), 0
);
