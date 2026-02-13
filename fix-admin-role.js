#!/usr/bin/env node

/**
 * Fix Admin Role Assignment
 * Run with: node fix-admin-role.js
 */

console.log('🔧 Fix Admin Role Assignment');
console.log('=============================');
console.log('');
console.log('✅ DIAGNOSIS: Login works but user lacks admin privileges');
console.log('');
console.log('📋 SOLUTION: Assign admin role to the user');
console.log('');
console.log('🚀 STEPS:');
console.log('');
console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project: ugjlaalllfthxngfzvxh');
console.log('3. Go to SQL Editor');
console.log('4. Run this SQL query:');
console.log('');
console.log('   -- Assign admin role to existing user');
console.log('   INSERT INTO public.user_roles (user_id, role)');
console.log('   SELECT id, \'admin\'::app_role');
console.log('   FROM auth.users');
console.log('   WHERE email = \'admin@mslpakistan.org\'');
console.log('   ON CONFLICT (user_id, role) DO NOTHING;');
console.log('');
console.log('5. Verify the role was assigned:');
console.log('');
console.log('   SELECT u.email, ur.role, ur.created_at as role_assigned');
console.log('   FROM auth.users u');
console.log('   LEFT JOIN public.user_roles ur ON u.id = ur.user_id');
console.log('   WHERE u.email = \'admin@mslpakistan.org\';');
console.log('');
console.log('🧪 TEST AGAIN:');
console.log('');
console.log('After running the SQL:');
console.log('- Visit: http://localhost:8081/admin');
console.log('- Login with: admin@mslpakistan.org / Admin123!');
console.log('- You should now see the admin dashboard!');
console.log('');
console.log('📊 EXPECTED RESULT:');
console.log('   - Email: admin@mslpakistan.org');
console.log('   - Role: admin');
console.log('   - Role assigned: [timestamp]');
console.log('');
console.log('🔍 IF STILL NOT WORKING:');
console.log('');
console.log('1. Check that the user_roles table exists:');
console.log('   SELECT table_name FROM information_schema.tables');
console.log('   WHERE table_schema = \'public\';');
console.log('');
console.log('2. Check that the app_role enum exists:');
console.log('   SELECT typname FROM pg_type');
console.log('   WHERE typname = \'app_role\';');
console.log('');
console.log('3. Check browser console for errors');
console.log('');
console.log('🎯 SUCCESS: You should be able to access the admin dashboard!');
console.log('');
console.log('🚀 Go run the SQL query in Supabase now!');