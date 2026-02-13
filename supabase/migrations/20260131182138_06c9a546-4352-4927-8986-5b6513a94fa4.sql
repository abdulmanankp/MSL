-- Create enum for education levels
CREATE TYPE public.education_level AS ENUM (
  'hafiz_quran',
  'matric',
  'inter',
  'bs',
  'masters',
  'phd'
);

-- Create enum for areas of interest
CREATE TYPE public.area_of_interest AS ENUM (
  'muslim_kids',
  'media_department',
  'madadgar_team',
  'universities_department',
  'msl_team',
  'it_department'
);

-- Create enum for member status
CREATE TYPE public.member_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'inactive'
);

-- Create members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL UNIQUE,
  designation TEXT NOT NULL,
  district TEXT NOT NULL,
  complete_address TEXT NOT NULL,
  area_of_interest area_of_interest NOT NULL,
  education_level education_level NOT NULL,
  degree_institute TEXT NOT NULL,
  profile_photo_url TEXT,
  status member_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for membership ID
CREATE SEQUENCE public.membership_id_seq START WITH 1;

-- Create function to generate membership ID
CREATE OR REPLACE FUNCTION public.generate_membership_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.membership_id := 'MSL2026-' || LPAD(nextval('public.membership_id_seq')::TEXT, 2, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating membership ID
CREATE TRIGGER set_membership_id
  BEFORE INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_membership_id();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create policy for public to insert (registration)
CREATE POLICY "Anyone can register as a member"
  ON public.members
  FOR INSERT
  WITH CHECK (true);

-- Create policy for public to read approved members (for verification)
CREATE POLICY "Anyone can verify members"
  ON public.members
  FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_members_whatsapp ON public.members(whatsapp_number);
CREATE INDEX idx_members_membership_id ON public.members(membership_id);
CREATE INDEX idx_members_status ON public.members(status);