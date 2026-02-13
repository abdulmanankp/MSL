#!/usr/bin/env node

/**
 * Check Admin User Status
 * Run with: node check-admin.js
 */

console.log('🔍 Checking Admin User Status');
console.log('==============================');
console.log('');
console.log('📋 STEPS TO VERIFY:');
console.log('');
console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project: ugjlaalllfthxngfzvxh');
console.log('3. Go to SQL Editor');
console.log('4. Run these queries:');
console.log('');
console.log('   -- Check if admin user exists');
console.log('   SELECT id, email, email_confirmed_at, created_at');
console.log('   FROM auth.users');
console.log('   WHERE email = \'abdulmanankp0@gmail.com\';');
console.log('');
console.log('   -- Check if admin role is assigned');
console.log('   SELECT u.email, ur.role, ur.created_at as role_assigned');
console.log('   FROM auth.users u');
console.log('   LEFT JOIN public.user_roles ur ON u.id = ur.user_id');
console.log('   WHERE u.email = \'abdulmanankp0@gmail.com\';');
console.log('');
console.log('   -- Check all user roles');
console.log('   SELECT u.email, ur.role');
console.log('   FROM auth.users u');
console.log('   JOIN public.user_roles ur ON u.id = ur.user_id;');
console.log('');
console.log('🔧 IF ISSUES FOUND:');
console.log('');
console.log('❌ No admin user:');
console.log('   - Go to Authentication > Users');
console.log('   - Click "Add user"');
console.log('   - Email: abdulmanankp0@gmail.com');
console.log('   - Password: Admin123!');
console.log('   - ✅ Enable "Auto-confirm user"');
console.log('');
console.log('❌ Admin user exists but no role:');
console.log('   - Run this SQL:');
console.log('     INSERT INTO public.user_roles (user_id, role)');
console.log('     SELECT id, \'admin\'::app_role');
console.log('     FROM auth.users');
console.log('     WHERE email = \'abdulmanankp0@gmail.com\'');
console.log('     ON CONFLICT (user_id, role) DO NOTHING;');
console.log('');
console.log('❌ User not confirmed:');
console.log('   - In Supabase Dashboard, edit the user');
console.log('   - Ensure "Email confirmed" is checked');
console.log('   - Or run: UPDATE auth.users SET email_confirmed_at = now()');
console.log('     WHERE email = \'abdulmanankp0@gmail.com\';');
console.log('');
console.log('🧪 TEST LOGIN:');
console.log('');
console.log('After fixing:');
console.log('- Visit: http://localhost:8081/admin');
console.log('- Email: abdulmanankp0@gmail.com');
console.log('- Password: Admin123!');
console.log('');
console.log('📞 DEBUGGING TIPS:');
console.log('');
console.log('- Open browser Developer Tools (F12)');
console.log('- Check Console tab for errors');
console.log('- Check Network tab for failed requests');
console.log('- Clear browser cache and try again');
console.log('');
console.log('✅ SUCCESS: You should see the admin dashboard after login!');
console.log('');
console.log('🚀 Go check your Supabase project now!');