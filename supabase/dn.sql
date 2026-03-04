-- Hostel Access Hub - Fresh Database SQL
-- Copy and run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('student', 'warden');
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL UNIQUE,
  course TEXT NOT NULL,
  department TEXT NOT NULL,
  year_of_study INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  hostel_name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  blood_group TEXT,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gatepass_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_date_time TIMESTAMPTZ NOT NULL,
  to_date_time TIMESTAMPTZ NOT NULL,
  place TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  warden_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_warden(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = $1
      AND p.role = 'warden'
  );
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_student_details_user_id ON public.student_details(user_id);
CREATE INDEX IF NOT EXISTS idx_gatepass_requests_user_id ON public.gatepass_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gatepass_requests_status ON public.gatepass_requests(status);
CREATE INDEX IF NOT EXISTS idx_gatepass_requests_created_at ON public.gatepass_requests(created_at DESC);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_details_updated_at
BEFORE UPDATE ON public.student_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gatepass_requests_updated_at
BEFORE UPDATE ON public.gatepass_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gatepass_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Wardens can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_warden(auth.uid()));

CREATE POLICY "Students can view their own details"
ON public.student_details
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can update their own details"
ON public.student_details
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can insert their own details"
ON public.student_details
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Wardens can view all student details"
ON public.student_details
FOR SELECT
USING (public.is_warden(auth.uid()));

CREATE POLICY "Students can view their own requests"
ON public.gatepass_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can create their own requests"
ON public.gatepass_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own pending requests"
ON public.gatepass_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending' AND warden_remarks IS NULL);

CREATE POLICY "Wardens can view all requests"
ON public.gatepass_requests
FOR SELECT
USING (public.is_warden(auth.uid()));

CREATE POLICY "Wardens can update request status"
ON public.gatepass_requests
FOR UPDATE
USING (public.is_warden(auth.uid()))
WITH CHECK (public.is_warden(auth.uid()));

GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_warden(UUID) TO authenticated, service_role;
