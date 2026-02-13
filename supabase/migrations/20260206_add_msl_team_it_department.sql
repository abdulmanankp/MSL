-- Add MSL Team and IT Department to area_of_interest enum

-- Alter the existing area_of_interest enum to add new values
ALTER TYPE public.area_of_interest ADD VALUE 'msl_team';
ALTER TYPE public.area_of_interest ADD VALUE 'it_department';
