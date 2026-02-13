#!/usr/bin/env node

/**
 * Script to create an admin user for MSL Pakistan
 * Run with: node create-admin.js
 */

console.log('🛠️  MSL Pakistan Admin User Setup');
console.log('=====================================');
console.log('');
console.log('⚠️  IMPORTANT: This script provides instructions for creating an admin user.');
console.log('   You need the SUPABASE_SERVICE_ROLE_KEY to create users programmatically.');
console.log('');
console.log('📋 MANUAL STEPS TO CREATE ADMIN USER:');
console.log('');
console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Navigate to your project (qprbervafyvzyyfmqfis)');
console.log('3. Go to Authentication > Users');
console.log('4. Click "Add user"');
console.log('5. Enter these details:');
console.log('   - Email: admin@mslpakistan.org');
console.log('   - Password: Admin123!');
console.log('   - Auto-confirm user: ✅ Enabled');
console.log('   - User metadata: {"full_name": "MSL Admin"}');
console.log('');
console.log('6. After creating the user, go to SQL Editor');
console.log('7. Run this query to assign admin role:');
console.log('');
console.log('   INSERT INTO public.user_roles (user_id, role)');
console.log('   SELECT id, \'admin\'::app_role');
console.log('   FROM auth.users');
console.log('   WHERE email = \'admin@mslpakistan.org\'');
console.log('   ON CONFLICT (user_id, role) DO NOTHING;');
console.log('');
console.log('8. Verify the admin user:');
console.log('   SELECT u.email, ur.role FROM auth.users u');
console.log('   JOIN public.user_roles ur ON u.id = ur.user_id');
console.log('   WHERE u.email = \'admin@mslpakistan.org\';');
console.log('');
console.log('🔐 ADMIN LOGIN CREDENTIALS:');
console.log('   Email: admin@mslpakistan.org');
console.log('   Password: Admin123!');
console.log('   URL: http://localhost:8080/admin (after starting the app)');
console.log('');
console.log('✅ Once created, you can login to the admin dashboard!');