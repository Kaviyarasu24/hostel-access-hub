-- Create gatepass requests table
CREATE TABLE public.gatepass_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  to_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  place TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  warden_remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gatepass_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for gatepass requests
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
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Wardens can view all requests" 
ON public.gatepass_requests 
FOR SELECT 
USING (auth.uid() IN ( SELECT profiles.user_id FROM profiles WHERE profiles.role = 'warden'::user_role));

CREATE POLICY "Wardens can update request status" 
ON public.gatepass_requests 
FOR UPDATE 
USING (auth.uid() IN ( SELECT profiles.user_id FROM profiles WHERE profiles.role = 'warden'::user_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gatepass_requests_updated_at
BEFORE UPDATE ON public.gatepass_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();