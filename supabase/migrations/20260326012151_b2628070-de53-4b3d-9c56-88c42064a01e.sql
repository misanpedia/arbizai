-- Fix handle_new_user to properly set referred_by from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  ref_code TEXT;
  upline_exists BOOLEAN;
BEGIN
  ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF ref_code IS NOT NULL AND ref_code != '' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE referral_code = ref_code
    ) INTO upline_exists;
    
    IF NOT upline_exists THEN
      ref_code := NULL;
    END IF;
  ELSE
    ref_code := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, email, full_name, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    substr(md5(random()::text), 1, 8),
    ref_code
  );
  
  INSERT INTO public.wallets (user_id, currency) VALUES (NEW.id, 'USDT');
  RETURN NEW;
END;
$$;

-- Fix get_downline_with_stats to support 20 levels with stats
CREATE OR REPLACE FUNCTION public.get_downline_with_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  my_referral_code TEXT;
BEGIN
  SELECT referral_code INTO my_referral_code 
  FROM public.profiles WHERE user_id = p_user_id;
  
  IF my_referral_code IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  WITH RECURSIVE downline AS (
    SELECT 
      p.id as profile_id, p.user_id, p.full_name, p.rank, p.is_active, p.created_at,
      1 as level, p.referral_code, p.referred_by
    FROM public.profiles p
    WHERE p.referred_by = my_referral_code
    UNION ALL
    SELECT
      p.id, p.user_id, p.full_name, p.rank, p.is_active, p.created_at,
      d.level + 1, p.referral_code, p.referred_by
    FROM public.profiles p
    INNER JOIN downline d ON p.referred_by = d.referral_code
    WHERE d.level < 20
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'profile_id', dl.profile_id,
      'full_name', dl.full_name,
      'rank', COALESCE(dl.rank, 'bronze'),
      'is_active', COALESCE(dl.is_active, true),
      'created_at', dl.created_at,
      'level', dl.level,
      'referral_code', dl.referral_code,
      'referred_by', dl.referred_by,
      'total_deposit', COALESCE(inv_stats.total_deposit, 0),
      'active_bots', COALESCE(inv_stats.active_bots, 0)
    )
  ) INTO result
  FROM downline dl
  LEFT JOIN LATERAL (
    SELECT 
      COALESCE(SUM(i.amount), 0) as total_deposit,
      COUNT(*)::int as active_bots
    FROM public.investments i
    WHERE i.user_id = dl.user_id AND i.status = 'active'
  ) inv_stats ON true;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;