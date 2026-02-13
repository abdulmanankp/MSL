# QUICK FIX - 3 STEPS

## Problem
Admin actions (approve/reject/delete) don't update database

## Fix (3 steps, 2 minutes)

### 1️⃣ Open Supabase
https://supabase.com/dashboard → SQL Editor → New Query

### 2️⃣ Paste This SQL
```sql
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user'); EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE TABLE IF NOT EXISTS public.user_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, role app_role NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE (user_id, role));
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
INSERT INTO public.user_roles (user_id, role) SELECT id, 'admin'::app_role FROM auth.users WHERE email IN ('admin@mslpakistan.org', 'abdulmanankp0@gmail.com') ON CONFLICT (user_id, role) DO NOTHING;
DROP POLICY IF EXISTS "Admins can update members" ON public.members;
CREATE POLICY "Admins can update members" ON public.members FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete members" ON public.members;
CREATE POLICY "Admins can delete members" ON public.members FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

### 3️⃣ Click RUN

Done ✅

---

## Test
- Clear browser cache / Log out and in
- Click approve button
- Status should change
- Refresh page
- Status should persist

---

## Why
Missing RLS UPDATE/DELETE policies blocking admin changes
