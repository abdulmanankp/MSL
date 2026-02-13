#!/usr/bin/env node

/**
 * Database Reset and Setup Script
 * Run with: node reset-database.js
 */

console.log('🔄 MSL Pakistan - Database Reset & Complete Setup');
console.log('==================================================');
console.log('');
console.log('⚠️  WARNING: This will RESET your entire database!');
console.log('   All existing data will be lost. Make sure you want to do this.');
console.log('');
console.log('📋 UPDATED MIGRATION FILE: complete-database-setup.sql');
console.log('');
console.log('✅ WHAT THE UPDATED FILE NOW INCLUDES:');
console.log('   - Cleanup section that drops all existing objects');
console.log('   - Safe recreation of all database components');
console.log('   - Conflict handling for storage buckets');
console.log('   - Admin user role reassignment');
console.log('');
console.log('🔥 HOW TO RUN THE RESET:');
console.log('');
console.log('1. ⚠️  BACKUP any important data first!');
console.log('2. Go to Supabase Dashboard: https://supabase.com/dashboard');
console.log('3. Select your project: qprbervafyvzyyfmqfis');
console.log('4. Click "SQL Editor"');
console.log('5. Open file: F:\\MSL\\complete-database-setup.sql');
console.log('6. Copy ALL content and paste into SQL Editor');
console.log('7. Click "Run" button (this will reset everything)');
console.log('');
console.log('👤 ADMIN USER HANDLING:');
console.log('');
console.log('The migration now handles existing admin users:');
console.log('   - If admin@mslpakistan.org exists: reassigns admin role');
console.log('   - If admin@mslpakistan.org doesn\'t exist: provides instructions');
console.log('   - Password remains: Admin123!');
console.log('');
console.log('🧪 TESTING AFTER RESET:');
console.log('');
console.log('1. Start the app: npm run dev');
console.log('2. Visit: http://localhost:8080');
console.log('3. Admin login: http://localhost:8080/admin');
console.log('4. Credentials: admin@mslpakistan.org / Admin123!');
console.log('');
console.log('📊 VERIFICATION QUERIES:');
console.log('');
console.log('After running the migration, verify with:');
console.log('');
console.log('   -- Check all tables exist');
console.log('   SELECT table_name FROM information_schema.tables');
console.log('   WHERE table_schema = \'public\';');
console.log('');
console.log('   -- Check all enums exist');
console.log('   SELECT t.typname AS enum_name FROM pg_type t');
console.log('   JOIN pg_namespace n ON n.oid = t.typnamespace');
console.log('   WHERE t.typtype = \'e\' AND n.nspname = \'public\';');
console.log('');
console.log('   -- Check admin user and role');
console.log('   SELECT u.email, ur.role, u.email_confirmed_at');
console.log('   FROM auth.users u');
console.log('   LEFT JOIN public.user_roles ur ON u.id = ur.user_id');
console.log('   WHERE u.email = \'admin@mslpakistan.org\';');
console.log('');
console.log('🎯 ALTERNATIVE: If you don\'t want to reset everything,');
console.log('   you can manually drop just the conflicting objects:');
console.log('');
console.log('   DROP TYPE IF EXISTS public.education_level CASCADE;');
console.log('   DROP TYPE IF EXISTS public.area_of_interest CASCADE;');
console.log('   DROP TYPE IF EXISTS public.member_status CASCADE;');
console.log('   DROP TYPE IF EXISTS public.app_role CASCADE;');
console.log('');
console.log('💡 TIP: The updated migration is now safe to run multiple times!');
console.log('');
console.log('🚀 Ready to reset your database? Run the complete-database-setup.sql file!');