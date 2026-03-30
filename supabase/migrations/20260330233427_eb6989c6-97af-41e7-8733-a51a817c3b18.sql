-- Fix default rank from 'bronze' to NULL (unranked)
ALTER TABLE public.profiles ALTER COLUMN rank SET DEFAULT NULL;

-- Set all users who don't qualify for bronze back to unranked
-- Bronze requires: personal investment >= $100, 5 active referrals, $1000 team volume
UPDATE public.profiles p SET rank = NULL
WHERE p.rank = 'bronze' 
AND p.is_active = true
AND (
  -- Check personal investment < 100
  (SELECT COALESCE(SUM(i.amount), 0) FROM public.investments i WHERE i.user_id = p.user_id AND i.status = 'active') < 100
  OR
  -- Check direct referrals < 5
  (SELECT COUNT(*) FROM public.profiles p2 WHERE p2.referred_by = p.referral_code AND p2.is_active = true) < 5
  OR
  -- Check team volume < 1000
  (SELECT COALESCE(SUM(i2.amount), 0) FROM public.profiles p3 JOIN public.investments i2 ON i2.user_id = p3.user_id AND i2.status = 'active' WHERE p3.referred_by = p.referral_code) < 1000
);