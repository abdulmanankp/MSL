#!/usr/bin/env node

/**
 * Script to verify admin user setup
 * Run with: node verify-admin.js
 */

console.log('🔍 MSL Pakistan Admin User Verification');
console.log('========================================');
console.log('');
console.log('📋 CHECKLIST:');
console.log('');
console.log('1. ✅ Go to Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. ✅ Select project: qprbervafyvzyyfmqfis');
console.log('3. ✅ Go to Authentication > Users');
console.log('4. ✅ Check if user exists: admin@mslpakistan.org');
console.log('5. ✅ Check if user is "Confirmed" (not pending)');
console.log('');
console.log('6. ✅ Go to SQL Editor and run:');
console.log('');
console.log('   -- Check if user exists');
console.log('   SELECT id, email, email_confirmed_at, created_at');
console.log('   FROM auth.users');
console.log('   WHERE email = \'admin@mslpakistan.org\';');
console.log('');
console.log('   -- Check if admin role is assigned');
console.log('   SELECT u.email, ur.role, ur.created_at as role_assigned');
console.log('   FROM auth.users u');
console.log('   LEFT JOIN public.user_roles ur ON u.id = ur.user_id');
console.log('   WHERE u.email = \'admin@mslpakistan.org\';');
console.log('');
console.log('🔧 TROUBLESHOOTING:');
console.log('');
console.log('❌ If user doesn\'t exist:');
console.log('   - Follow the create-admin.js instructions to create the user');
console.log('');
console.log('❌ If user exists but no role:');
console.log('   - Run the SQL INSERT query from create-admin.js');
console.log('');
console.log('❌ If user is not confirmed:');
console.log('   - In Supabase Dashboard, edit the user and enable "Auto-confirm user"');
console.log('   - Or manually confirm via SQL:');
console.log('     UPDATE auth.users SET email_confirmed_at = now()');
console.log('     WHERE email = \'admin@mslpakistan.org\';');
console.log('');
console.log('❌ If still getting "Invalid credentials":');
console.log('   - Double-check the password: Admin123!');
console.log('   - Make sure you\'re using the correct Supabase project');
console.log('   - Check browser console for any errors');
console.log('');
console.log('✅ SUCCESS CHECK:');
console.log('   - User exists and is confirmed');
console.log('   - Admin role is assigned');
console.log('   - Can login at http://localhost:8080/admin');
console.log('');
console.log('🆘 NEED HELP?');
console.log('   - Check the browser developer console (F12) for errors');
console.log('   - Verify your .env file has correct Supabase credentials');
console.log('   - Make sure the app is running: npm run dev');