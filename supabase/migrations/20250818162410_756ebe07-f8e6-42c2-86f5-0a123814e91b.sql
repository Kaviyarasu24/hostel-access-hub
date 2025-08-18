-- Fix the security definer function with proper search path
DROP FUNCTION IF EXISTS public.is_warden(UUID);

CREATE OR REPLACE FUNCTION public.is_warden(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND profiles.role = 'warden'
  );
$$;