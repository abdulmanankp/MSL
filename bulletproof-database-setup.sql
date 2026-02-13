-- ===========================================
-- MSL Pakistan Database Setup - BULLETPROOF VERSION
-- This works regardless of existing database state
-- ===========================================

-- ===========================================
-- STEP 1: CLEANUP EXISTING OBJECTS SAFELY
-- ===========================================

-- Drop tables if they exist (this will also drop their policies)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generate_membership_id() CASCADE;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS public.membership_id_seq CASCADE;

-- Drop enums if they exist (safe cleanup)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        DROP TYPE public.app_role CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
        DROP TYPE public.member_status CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'area_of_interest') THEN
        DROP TYPE public.area_of_interest CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level') THEN
        DROP TYPE public.education_level CASCADE;
    END IF;
END $$;

-- Clean up storage bucket
DELETE FROM storage.buckets WHERE id = 'profile-photos';

-- ===========================================
-- STEP 2: CREATE FRESH ENUMS
-- ===========================================

CREATE TYPE public.education_level AS ENUM (
  'hafiz_quran',
  'matric',
  'inter',
  'bs',
  'masters',
  'phd'
);

CREATE TYPE public.area_of_interest AS ENUM (
  'muslim_kids',
  'media_department',
  'madadgar_team',
  'universities_department',
  'msl_team',
  'it_department'
);

CREATE TYPE public.member_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'inactive'
);

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ===========================================
-- STEP 3: CREATE TABLES
-- ===========================================

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

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- ===========================================
-- STEP 4: CREATE SEQUENCES AND FUNCTIONS
-- ===========================================

CREATE SEQUENCE public.membership_id_seq START WITH 1;

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

-- ===========================================
-- STEP 5: CREATE TRIGGERS
-- ===========================================

DROP TRIGGER IF EXISTS set_membership_id ON public.members;
CREATE TRIGGER set_membership_id
  BEFORE INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_membership_id();

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- STEP 6: ENABLE SECURITY AND POLICIES
-- ===========================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Members policies
DROP POLICY IF EXISTS "Anyone can register as a member" ON public.members;
CREATE POLICY "Anyone can register as a member"
  ON public.members
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can verify members" ON public.members;
CREATE POLICY "Anyone can verify members"
  ON public.members
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update members" ON public.members;
CREATE POLICY "Admins can update members"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete members" ON public.members;
CREATE POLICY "Admins can delete members"
  ON public.members
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- STEP 6.5: CARD TEMPLATE SYSTEM
-- ===========================================

-- Create card_templates table
DROP TABLE IF EXISTS public.template_fields CASCADE;
DROP TABLE IF EXISTS public.card_templates CASCADE;

CREATE TABLE public.card_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pdf_data BYTEA NOT NULL, -- Store the PDF template as binary
  page_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template_fields table for field mappings
CREATE TABLE public.template_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.card_templates(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- e.g., 'full_name', 'whatsapp_number', 'profile_photo'
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'image', 'qr_code')),
  page_number INTEGER NOT NULL DEFAULT 1,
  x_position NUMERIC(10,2), -- X coordinate (optional for auto-placement)
  y_position NUMERIC(10,2), -- Y coordinate (optional for auto-placement)
  width NUMERIC(10,2), -- Width for images
  height NUMERIC(10,2), -- Height for images
  font_family TEXT, -- Font family for text fields
  font_size INTEGER, -- Font size for text fields
  font_color TEXT, -- Hex color for text fields
  text_alignment TEXT CHECK (text_alignment IN ('left', 'center', 'right')), -- Alignment for text
  image_shape TEXT CHECK (image_shape IN ('circle', 'square')), -- Shape for image fields
  has_border BOOLEAN DEFAULT false, -- Border for images
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, field_name)
);

-- Create index for better performance
CREATE INDEX idx_template_fields_template_id ON public.template_fields(template_id);
CREATE INDEX idx_card_templates_active ON public.card_templates(is_active);

-- Enable RLS
ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage templates
CREATE POLICY "Admins can view card templates"
ON public.card_templates
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage card templates"
ON public.card_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view template fields"
ON public.template_fields
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage template fields"
ON public.template_fields
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_card_templates_updated_at ON public.card_templates;
CREATE TRIGGER update_card_templates_updated_at
    BEFORE UPDATE ON public.card_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_template_fields_updated_at ON public.template_fields;
CREATE TRIGGER update_template_fields_updated_at
    BEFORE UPDATE ON public.template_fields
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- STEP 7: STORAGE BUCKET
-- ===========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can upload profile photos" ON storage.objects;
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
CREATE POLICY "Anyone can view profile photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Anyone can update profile photos" ON storage.objects;
CREATE POLICY "Anyone can update profile photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'profile-photos');

-- ===========================================
-- STEP 8: INDEXES
-- ===========================================

DROP INDEX IF EXISTS idx_members_whatsapp;
CREATE INDEX idx_members_whatsapp ON public.members(whatsapp_number);

DROP INDEX IF EXISTS idx_members_membership_id;
CREATE INDEX idx_members_membership_id ON public.members(membership_id);

DROP INDEX IF EXISTS idx_members_status;
CREATE INDEX idx_members_status ON public.members(status);

-- ===========================================
-- STEP 9: ADMIN USER SETUP
-- ===========================================

-- Clean up any existing admin role assignments
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'abdulmanankp0@gmail.com'
) AND role = 'admin';

-- Assign admin role (will work if user exists or when created later)
INSERT INTO public.user_roles (user_id, role)
SELECT
  id,
  'admin'::app_role
FROM auth.users
WHERE email = 'abdulmanankp0@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ===========================================
-- SETUP COMPLETE! 🎉
-- ===========================================

-- Run these to verify:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT typname FROM pg_type WHERE typname IN ('education_level', 'area_of_interest', 'member_status', 'app_role');

-- ===========================================
-- EDGE FUNCTION SETUP (Required for PDF Generation)
-- ===========================================

-- 1. Go to Supabase Dashboard > Edge Functions
-- 2. Create new function named "generate-card"
-- 3. Copy the contents of supabase/functions/generate-card/index.ts
-- 4. Deploy the function
-- 5. Set environment variables in Edge Functions settings:
--    - SITE_URL: Your website URL (e.g., https://yourdomain.com)
--    - SUPABASE_URL: Your Supabase URL
--    - SUPABASE_SERVICE_ROLE_KEY: Your service role key (from Project Settings > API)