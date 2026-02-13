-- Manual Member Creation Script
-- Use this script to manually insert members into the database

-- ===================================================
-- OPTION 1: Insert a single member
-- ===================================================
INSERT INTO public.members (
  membership_id,
  full_name,
  email,
  whatsapp_number,
  designation,
  district,
  provincial_seat,
  complete_address,
  area_of_interest,
  education_level,
  degree_institute,
  profile_photo_url,
  status,
  created_at,
  updated_at
) VALUES (
  'MSL2026-MANUAL-001',           -- membership_id
  'John Doe',                      -- full_name
  'john@example.com',              -- email
  '03001234567',                   -- whatsapp_number
  'Manager',                       -- designation
  'Karachi',                       -- district
  'Sindh',                         -- provincial_seat
  '123 Street, Karachi',           -- complete_address
  'msl_team',                      -- area_of_interest (muslim_kids, media_department, madadgar_team, universities_department, msl_team, it_department)
  'masters',                       -- education_level (hafiz_quran, matric, inter, bs, masters, phd)
  'BS Computer Science, FAST',     -- degree_institute
  NULL,                            -- profile_photo_url
  'approved',                      -- status (pending, approved, rejected, inactive)
  NOW(),                           -- created_at
  NOW()                            -- updated_at
);

-- ===================================================
-- OPTION 2: Insert multiple members at once
-- ===================================================
INSERT INTO public.members (
  membership_id,
  full_name,
  email,
  whatsapp_number,
  designation,
  district,
  provincial_seat,
  complete_address,
  area_of_interest,
  education_level,
  degree_institute,
  profile_photo_url,
  status,
  created_at,
  updated_at
) VALUES
  (
    'MSL2026-MANUAL-002',
    'Ahmed Khan',
    'ahmed@example.com',
    '03017654321',
    'Developer',
    'Lahore',
    'Punjab',
    '456 Avenue, Lahore',
    'it_department',
    'bs',
    'BS Software Engineering, LUMS',
    NULL,
    'approved',
    NOW(),
    NOW()
  ),
  (
    'MSL2026-MANUAL-003',
    'Fatima Ali',
    'fatima@example.com',
    '03109876543',
    'Coordinator',
    'Islamabad',
    'Islamabad',
    '789 Road, Islamabad',
    'media_department',
    'inter',
    'FA and FSC from Government College',
    NULL,
    'pending',
    NOW(),
    NOW()
  ),
  (
    'MSL2026-MANUAL-004',
    'Hassan Raza',
    'hassan@example.com',
    '03211111111',
    'Researcher',
    'Multan',
    'Punjab',
    '321 Lane, Multan',
    'universities_department',
    'phd',
    'PhD Islamic Studies, University of Punjab',
    NULL,
    'approved',
    NOW(),
    NOW()
  );

-- ===================================================
-- OPTION 3: Update existing member's area_of_interest
-- ===================================================
-- UPDATE public.members
-- SET area_of_interest = 'msl_team'
-- WHERE membership_id = 'MSL2026-01';

-- ===================================================
-- OPTION 4: Update member status
-- ===================================================
-- UPDATE public.members
-- SET status = 'approved'
-- WHERE status = 'pending'
-- AND created_at >= NOW() - INTERVAL '7 days';

-- ===================================================
-- OPTION 5: View all members
-- ===================================================
-- SELECT * FROM public.members ORDER BY created_at DESC;

-- ===================================================
-- OPTION 6: View members by area_of_interest
-- ===================================================
-- SELECT * FROM public.members
-- WHERE area_of_interest = 'msl_team'
-- ORDER BY full_name;

-- ===================================================
-- OPTION 7: Delete a member (if needed)
-- ===================================================
-- DELETE FROM public.members
-- WHERE membership_id = 'MSL2026-MANUAL-001';

-- ===================================================
-- Area of Interest Options:
-- ===================================================
-- - muslim_kids
-- - media_department
-- - madadgar_team
-- - universities_department
-- - msl_team (NEW)
-- - it_department (NEW)

-- ===================================================
-- Education Level Options:
-- ===================================================
-- - hafiz_quran
-- - matric
-- - inter
-- - bs
-- - masters
-- - phd

-- ===================================================
-- Member Status Options:
-- ===================================================
-- - pending
-- - approved
-- - rejected
-- - inactive
