-- Drop all policies that depend on the function, then recreate with CASCADE
DROP POLICY IF EXISTS "Wardens can view all profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Wardens can view all student details" ON public.student_details CASCADE;
DROP POLICY IF EXISTS "Wardens can view all requests" ON public.gatepass_requests CASCADE;
DROP POLICY IF EXISTS "Wardens can update request status" ON public.gatepass_requests CASCADE;

-- Now drop and recreate the function with proper search path
DROP FUNCTION IF EXISTS public.is_warden(UUID) CASCADE;

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

-- Recreate all the policies
CREATE POLICY "Wardens can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_warden(auth.uid()));

CREATE POLICY "Wardens can view all student details"
ON public.student_details
FOR SELECT
USING (public.is_warden(auth.uid()));

CREATE POLICY "Wardens can view all requests"
ON public.gatepass_requests
FOR SELECT
USING (public.is_warden(auth.uid()));

CREATE POLICY "Wardens can update request status"
ON public.gatepass_requests
FOR UPDATE
USING (public.is_warden(auth.uid()));