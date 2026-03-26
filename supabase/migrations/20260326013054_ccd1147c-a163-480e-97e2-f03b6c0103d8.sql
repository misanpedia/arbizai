-- Fix the one profile that has UUID instead of referral_code in referred_by
UPDATE public.profiles 
SET referred_by = '3400c45d' 
WHERE user_id = '57b19703-758e-43b5-86f8-a96752312445' 
AND referred_by = 'ee31f92b-df96-4d12-ac46-b281b8e9f54c';