-- Migration: Add provincial_seat field to members table
ALTER TABLE public.members ADD COLUMN provincial_seat TEXT;
