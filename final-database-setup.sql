-- ===========================================
-- MSL Pakistan Database Setup - FINAL VERSION
-- Run this single file in Supabase SQL Editor
-- ===========================================

-- This is a clean, minimal migration that creates everything from scratch
-- If you have existing data, back it up first as this will replace everything

-- ===========================================
-- PART 1: CREATE EVERYTHING FRESH
-- ===========================================

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

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ===========================================
-- PART 2: MEMBERS TABLE
-- ===========================================

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
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.membership_id := 'MSL2026-' || LPAD(nextval('public.membership_id_seq')::TEXT, 2, '0');
  RETURN NEW;
END;
$$;

-- Create function to update timestamps
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

-- Create triggers
CREATE TRIGGER set_membership_id
  BEFORE INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_membership_id();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- PART 3: SECURITY POLICIES
-- ===========================================

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

-- Create policy for admins to update members
CREATE POLICY "Admins can update members"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create policy for admins to delete members
CREATE POLICY "Admins can delete members"
  ON public.members
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- PART 4: USER ROLES SYSTEM
-- ===========================================

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: only admins can view roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy: only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- PART 5: STORAGE BUCKET
-- ===========================================

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public to upload profile photos
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

-- Create policy for public to view profile photos
CREATE POLICY "Anyone can view profile photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- Create policy to allow updating profile photos
CREATE POLICY "Anyone can update profile photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'profile-photos');

-- ===========================================
-- PART 6: INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX idx_members_whatsapp ON public.members(whatsapp_number);
CREATE INDEX idx_members_membership_id ON public.members(membership_id);
CREATE INDEX idx_members_status ON public.members(status);

-- ===========================================
-- PART 7: ADMIN USER SETUP
-- ===========================================

-- This will assign admin role to existing user or be ready for new user
INSERT INTO public.user_roles (user_id, role)
SELECT
  id,
  'admin'::app_role
FROM auth.users
WHERE email = 'admin@mslpakistan.org'
ON CONFLICT (user_id, role) DO NOTHING;

-- ===========================================
-- SETUP COMPLETE!
-- ===========================================

-- Verification: Run these queries to check if everything worked
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typtype = 'e' AND n.nspname = 'public';