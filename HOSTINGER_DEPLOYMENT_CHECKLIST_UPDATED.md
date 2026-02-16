
==== ON HOSTINGER PANEL ====

1. Go to Hostinger > Node.js / Domains > Create Node.js Application

2. Configure these settings:
   ┌─────────────────────────────────────────┐
   │ Application Name: msl-pakistan          │
   │ Node.js Version: 18.x or higher (LTS)   │
   │ Application Root: / (root)              │
   │ Entry Point: server.js                  │
   │ Application URL: yourdomain.com         │
   │ Running Directory: / (root)             │
   │ Start Command: npm start                │
   │ Build Command: npm run build            │
   └─────────────────────────────────────────┘

3. IMPORTANT - Start Command:
   - Do NOT use "npm run build" as the start command
   - The start command must be: npm start
   - The build command is separate

4. Deploy Version Control:
   - Connect to GitHub or manually upload
   - Make sure all files are uploaded including:
     ✓ server.js
     ✓ package.json
     ✓ .env.production (with your credentials)
     ✓ public/ folder
     ✓ server/ folder
     ✓ supabase/ folder if needed

5. Set Environment Variables in Hostinger:
   - Go to Application Settings > Environment Variables
   - Add all variables from .env.production:
     VITE_SUPABASE_URL = your_url
     VITE_SUPABASE_ANON_KEY = your_key
     SMTP_HOST = your_smtp
     WHATSAPP_TOKEN = your_token
     etc.

6. Wait for deployment to complete
   - You'll see a green checkmark when ready
   - May take 2-5 minutes

==== TROUBLESHOOTING ====

✗ Still Getting Blank Page?
  1. SSH into your Hostinger account
  2. Check logs: tail -f ~/logs/error.log
  3. Verify npm start runs without errors
  4. Check that public/index.html exists
  5. Run: npm run build && npm start manually

✗ "npm: command not found"
  - Node.js may not be enabled on your Hostinger plan
  - Upgrading to Business Plan or use cPanel Node.js manager

✗ CORS or API Errors in Console:
  - Check .env.production has correct API URLs
  - Verify VITE_SUPABASE_URL is set correctly
  - Check browser console for full error messages

✗ Files Not Found (404):
  - Verify public/ folder has assets
  - Run: npm run build locally and upload again
  - Make sure .htaccess file is in root

==== VERIFICATION CHECKLIST ====

Before considering deployment complete:

□ Domain loads without blank page
□ React app displays (not blank)
□ Check browser console (F12) - no major errors
□ Test API calls work (login, member creation, etc.)
□ Check /test endpoint returns: {"message":"Server is running"}
□ WhatsApp/Email features work if configured
□ Database queries return data (if using Supabase)

==== USEFUL COMMANDS ====

# Build frontend and copy to public
npm run build

# Start server normally
npm start

# Test server locally before uploading
npm start  (then open http://localhost:3001)
