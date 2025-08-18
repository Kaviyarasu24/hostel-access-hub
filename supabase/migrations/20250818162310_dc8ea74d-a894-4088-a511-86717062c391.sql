-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Wardens can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Wardens can view all student details" ON public.student_details;
DROP POLICY IF EXISTS "Wardens can view all requests" ON public.gatepass_requests;
DROP POLICY IF EXISTS "Wardens can update request status" ON public.gatepass_requests;

-- Create a security definer function to check if user is warden
CREATE OR REPLACE FUNCTION public.is_warden(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND profiles.role = 'warden'
  );
$$;

-- Recreate policies without recursion
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