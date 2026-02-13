-- Create admin user migration
-- This migration creates an admin user with email: admin@mslpakistan.org
-- Password should be set through the Supabase dashboard or API

-- Note: This migration assumes you have the service role key to create users
-- For development, you can run this manually in the Supabase SQL editor

-- First, create the user (this requires service role key):
-- Run this in Supabase SQL Editor or through API with service role key:
-- SELECT auth.admin_create_user('admin@mslpakistan.org', 'Admin123!', '{"full_name": "MSL Admin"}');

-- Then assign the admin role:
INSERT INTO public.user_roles (user_id, role)
SELECT
  id,
  'admin'::app_role
FROM auth.users
WHERE email = 'admin@mslpakistan.org'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the admin user was created
SELECT
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@mslpakistan.org';