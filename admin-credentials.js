#!/usr/bin/env node

/**
 * Updated Admin Credentials
 * Run with: node admin-credentials.js
 */

console.log('🔐 Updated Admin Credentials');
console.log('=============================');
console.log('');
console.log('✅ EMAIL CHANGED: abdulmanankp0@gmail.com');
console.log('✅ PASSWORD SAME: Admin123!');
console.log('');
console.log('🚀 TO SET UP ADMIN USER:');
console.log('');
console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project: ugjlaalllfthxngfzvxh');
console.log('3. Go to Authentication > Users');
console.log('4. Click "Add user"');
console.log('5. Enter:');
console.log('   - Email: abdulmanankp0@gmail.com');
console.log('   - Password: Admin123!');
console.log('   - ✅ Enable "Auto-confirm user"');
console.log('6. Click "Add user"');
console.log('');
console.log('7. Go to SQL Editor and run:');
console.log('');
console.log('   INSERT INTO public.user_roles (user_id, role)');
console.log('   SELECT id, \'admin\'::app_role');
console.log('   FROM auth.users');
console.log('   WHERE email = \'abdulmanankp0@gmail.com\'');
console.log('   ON CONFLICT (user_id, role) DO NOTHING;');
console.log('');
console.log('🧪 TEST LOGIN:');
console.log('');
console.log('- URL: http://localhost:8081/admin');
console.log('- Email: abdulmanankp0@gmail.com');
console.log('- Password: Admin123!');
console.log('');
console.log('📊 VERIFY SETUP:');
console.log('');
console.log('Run this SQL to confirm:');
console.log('');
console.log('   SELECT u.email, ur.role');
console.log('   FROM auth.users u');
console.log('   LEFT JOIN public.user_roles ur ON u.id = ur.user_id');
console.log('   WHERE u.email = \'abdulmanankp0@gmail.com\';');
console.log('');
console.log('✅ Expected: 1 row with role = \'admin\'');
console.log('');
console.log('🎉 You should now be able to login as admin!');
console.log('');
console.log('📝 NOTE: Password remains Admin123! as requested.');