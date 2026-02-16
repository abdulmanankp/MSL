# VERCEL DEPLOYMENT GUIDE

## Setup Instructions

### 1. Install Vercel CLI (Optional - for command line deployment)
```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in** with GitHub, GitLab, or Bitbucket
3. **Click "Add New Project"**
4. **Import your Git repository** or upload folder
5. **Configure Project:**
   - Framework Preset: **Other**
   - Root Directory: `./` (keep as is)
   - Build Command: `npm run vercel-build` (Vercel auto-detects this)
   - Output Directory: `public`
   - Install Command: `npm install`

6. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   NODE_ENV = production
   VITE_SUPABASE_URL = your_supabase_url
   VITE_SUPABASE_ANON_KEY = your_anon_key
   SMTP_HOST = your_smtp_host
   SMTP_PORT = 587
   SMTP_USER = your_email
   SMTP_PASS = your_password
   ADMIN_EMAIL = admin@yourdomain.com
   WHATSAPP_TOKEN = your_whatsapp_token
   WHATSAPP_PHONE_NUMBER_ID = your_phone_id
   WHATSAPP_BUSINESS_ID = your_business_id
   GRAPH_API_VERSION = v17.0
   WEBHOOK_VERIFY_TOKEN = your_webhook_token
   ```

7. **Click "Deploy"** → Wait 2-3 minutes

8. **Your app is live!** 🎉

### 3. Deploy via CLI

```bash
# Step 1: Login to Vercel
vercel login

# Step 2: Deploy (follow prompts)
vercel

# Step 3: Deploy to production
vercel --prod
```

---

## How Vercel Works

**Serverless Functions:**
- Your `server.js` runs as a serverless function
- Each API request spins up a function instance
- Static files (HTML, CSS, JS) served from CDN
- No "always-on" server needed

**Routes:**
- `/api/*` → Handled by server.js
- `/webhook`, `/whatsapp/*`, etc. → Handled by server.js  
- Everything else → Served from `public/` folder (React app)

---

## Testing After Deployment

1. **Visit your Vercel URL** (e.g., `https://your-app.vercel.app`)
2. **Test API endpoints:**
   - `/test` → Should return JSON
   - `/health` → Should show health status
   - `/load-template` → Should work
3. **Check React app loads** (no blank page)
4. **Test features:**
   - Login
   - Member verification
   - Card generation
   - Admin dashboard

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure `vercel-build` script exists in package.json
- Verify all dependencies are in `dependencies` (not just `devDependencies`)

### 500 Internal Server Error
- Check Function Logs in Vercel dashboard
- Environment variables might be missing
- Check Supabase connection string

### Static Files 404
- Ensure `npm run vercel-build` succeeded
- Verify `public/` folder has built files
- Check `vercel.json` routes configuration

### CORS Errors
- Server.js already handles CORS
- Vercel domains are automatically allowed
- Check browser console for specific error

---

## Vercel vs Hostinger

| Feature | Vercel | Hostinger |
|---------|--------|-----------|
| Server Type | Serverless | Traditional Node.js |
| Deployment | Git push (auto) | Manual upload/SSH |
| Scaling | Automatic | Manual |
| CDN | Built-in (global) | Limited |
| Build Time | Fast (2-3 min) | Medium (5-10 min) |
| Free Tier | Yes (generous) | No |
| Best For | Modern apps | Full control |

---

## Custom Domain on Vercel

1. Go to **Project Settings** → **Domains**
2. **Add your domain** (e.g., `mslpakistan.online`)
3. **Update DNS records** (Vercel provides instructions)
4. **Wait for SSL** (automatically issued by Vercel)
5. **Done!** Your app is on your custom domain

---

## Files Created for Vercel

√ `vercel.json` - Vercel configuration (routes, builds)
√ `package.json` - Added `vercel-build` script
√ `server.js` - Exports Express app for serverless

Your app is **Vercel-ready!** 🚀
