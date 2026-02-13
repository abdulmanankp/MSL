-- ============================================
-- DEBUGGING: Verify RLS Setup
-- ============================================
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if admin user exists and has role
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@mslpakistan.org'
OR u.email = 'abdulmanankp0@gmail.com';

-- 2. Check if ALL required policies exist on members table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'members'
ORDER BY policyname;

-- 3. Check if has_role function exists
SELECT 
  n.nspname as schema,
  p.proname as function,
  pg_catalog.pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'has_role';

-- 4. Check user_roles table
SELECT id, user_id, role, created_at
FROM public.user_roles
WHERE role = 'admin';

-- 5. Test: See if current session has admin role
-- This should return true if logged in as admin
SELECT public.has_role(auth.uid(), 'admin'::app_role);

-- 6. Manually verify has_role works for admin user
SELECT 
  u.email,
  public.has_role(u.id, 'admin'::app_role) as is_admin
FROM auth.users u
WHERE u.email = 'admin@mslpakistan.org'
OR u.email = 'abdulmanankp0@gmail.com';

-- 7. Sample member data to verify table structure
SELECT id, membership_id, full_name, status, updated_at
FROM public.members
LIMIT 5;

-- ============================================
-- If something is wrong, here are the fixes:
-- ============================================

-- FIX 1: Admin user doesn't have admin role
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::app_role
-- FROM auth.users
-- WHERE email = 'admin@mslpakistan.org'
-- ON CONFLICT (user_id, role) DO NOTHING;

-- FIX 2: UPDATE policy doesn't exist
-- DROP POLICY IF EXISTS "Admins can update members" ON public.members;
-- CREATE POLICY "Admins can update members"
--   ON public.members
--   FOR UPDATE
--   TO authenticated
--   USING (public.has_role(auth.uid(), 'admin'))
--   WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FIX 3: DELETE policy doesn't exist
-- DROP POLICY IF EXISTS "Admins can delete members" ON public.members;
-- CREATE POLICY "Admins can delete members"
--   ON public.members
--   FOR DELETE
--   TO authenticated
--   USING (public.has_role(auth.uid(), 'admin'));
