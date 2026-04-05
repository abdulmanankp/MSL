-- Add core team flag to members so admins can mark members for the Core Team card design
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS core_team BOOLEAN NOT NULL DEFAULT false;