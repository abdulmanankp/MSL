# Hostinger Node.js Deployment Guide - Complete Setup

**Last Updated:** February 2026  
**Project:** MSL Pakistan  
**Hosting:** Hostinger Node.js App Hosting

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Hostinger Setup](#hostinger-setup)
3. [Environment Variables](#environment-variables)
4. [Deployment Process](#deployment-process)
5. [Auto-Updates](#auto-updates)
6. [GitHub Integration](#github-integration)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings fixed
- [ ] `.env` file configured with production values
- [ ] No hardcoded credentials in code
- [ ] `logs/` directory created
- [ ] All dependencies installed: `npm install`

### Testing
- [ ] Local server runs: `npm run server`
- [ ] Frontend builds: `npm run build`
- [ ] Email SMTP working (test with curl)
- [ ] WhatsApp webhooks verified
- [ ] Supabase connection tested

### Git Repository
- [ ] Project uploaded to GitHub
- [ ] `.env` added to `.gitignore` (don't commit secrets!)
- [ ] `logs/` added to `.gitignore`
- [ ] `node_modules/` added to `.gitignore`

---

## Hostinger Setup

### Step 1: Create Node.js Application

1. Login to [Hostinger Control Panel](https://hpanel.hostinger.com)
2. Navigate to **Hosting → Applications**
3. Click **Create Application**
4. **Application Type:** Node.js
5. **Node.js Version:** 18 LTS (or latest)
6. **Application Root:** Select your root directory
7. **Port:** Use `3000` (will be proxied to 80/443)
8. Click **Create**

### Step 2: Connect Your Repository

#### Option A: GitHub Integration (Recommended)
1. In Hostinger, click **Connect Repository**
2. Select **GitHub**
3. Authorize Hostinger to access your GitHub
4. Select your MSL Pakistan repository
5. Branch: `main`
6. Deployment path: `/` (root)

#### Option B: Manual Upload (via SFTP)
1. Get SFTP credentials from Hostinger
2. Upload files using FileZilla or VS Code SFTP Extension
3. Run: `npm install` in the app directory

### Step 3: Configure Node.js App

1. In Hostinger Application Settings:
   - **Startup Command:** `npm run server`
   - **Node.js Version:** 18 LTS
   - **Port:** 3000

2. Set **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   ```

---

## Environment Variables

### Setup in Hostinger Control Panel

1. Go to **Application → Environment Variables**
2. Add all these variables:

```env
# Node Environment
NODE_ENV=production
PORT=3000

# Database (Supabase)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# WhatsApp Cloud API
WHATSAPP_TOKEN=your_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_BUSINESS_ID=your_business_id
GRAPH_API_VERSION=v17.0
WEBHOOK_VERIFY_TOKEN=your_webhook_token

# Email (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@mslpakistan.org
SMTP_PASS=your_email_password

# App Settings
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

### Important Security Notes

⚠️ **NEVER:**
- Commit `.env` to GitHub
- Share access tokens or passwords
- Use test credentials in production
- Leave passwords in version control

✅ **DO:**
- Store all secrets in Hostinger environment variables
- Use strong, unique passwords
- Rotate tokens periodically
- Keep `.env` in `.gitignore`

---

## Deployment Process

### Automatic Deployment (GitHub Integration)

**Setup (One-time):**
1. In Hostinger: Connect your GitHub repository
2. Select `main` branch for auto-deployment
3. Enable auto-redeploy on push

**Publishing Code Updates:**
```bash
# In VS Code Terminal:
git add .
git commit -m "feat: add new feature description"
git push origin main
```

**What Happens Automatically:**
1. GitHub receives the push
2. Hostinger detects the change
3. Automatically pulls latest code
4. Runs `npm install` to install dependencies
5. Restarts Node.js app with new code
6. Your changes are LIVE in ~2-3 minutes

### Manual Deployment (Via SFTP)

**If not using GitHub:**

1. Connect via SFTP in VS Code:
   - Install "SFTP" extension
   - Configure with Hostinger credentials
   - Upload files to server

2. SSH into server and run:
   ```bash
   cd /path/to/app
   npm install
   npm run server
   ```

---

## Auto-Updates & Development Workflow

### Option 1: Git Push to Production (Recommended)

**Development Workflow:**
```bash
# Clone repository
git clone https://github.com/yourusername/msl-pakistan.git
cd msl-pakistan

# Create feature branch
git checkout -b feature/new-feature

# Make changes in VS Code
# ... edit files ...

# Test locally
npm run dev
npm run server

# Commit changes
git add .
git commit -m "feat: describe your changes"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
# Review → Merge to main

# Hostinger auto-deploys within 2-3 minutes ✅
```

### Option 2: Live Reload During Development

**For local testing with auto-reload:**

```bash
# Install nodemon for auto-restart
npm install --save-dev nodemon

# Update package.json scripts:
"dev:watch": "nodemon server.js"

# Run with auto-reload
npm run dev:watch
```

### Option 3: Direct Server Updates (Not Recommended)

SSH into Hostinger and edit files directly:
```bash
ssh user@hostingserver.com
cd /home/user/public_html/msl-pakistan
nano server.js  # Edit file
npm restart     # Restart app
```

---

## GitHub Integration & Publishing

### Step 1: Initialize Git Repository

```bash
# In VS Code Terminal (in project root):
git init
git add .
git commit -m "Initial commit: MSL Pakistan application"
```

### Step 2: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `msl-pakistan`
3. **Description:** "MSL Pakistan member management system"
4. **Public/Private:** Choose based on preference
5. Create repository
6. Copy the HTTPS URL

### Step 3: Connect Local to GitHub

```bash
# Add GitHub as remote
git remote add origin https://github.com/yourusername/msl-pakistan.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 4: Setup Auto-Deploy from GitHub

In Hostinger:
1. **Applications → [Your App] → Settings**
2. **Repository Integration**
3. **Connect Repository**
4. Authorize GitHub
5. Select `msl-pakistan` repository
6. Branch: `main`
7. Enable **Auto-deploy on push**

---

## Development → Production Workflow

### Daily Development

```bash
# Start of day: Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/description

# Make changes, test locally
npm run dev
npm run build

# When done, commit and push
git add .
git commit -m "feat: detailed description"
git push origin feature/description
```

### Code Review & Merge

```bash
# On GitHub:
# 1. Create Pull Request
# 2. Review changes
# 3. Resolve conflicts if any
# 4. Merge to main

# Auto-deployment happens automatically ✅
```

### Watch Deployment Status

**In Hostinger Control Panel:**
1. Go to **Applications**
2. Click your app
3. View **Deployment History**
4. See real-time logs of each deployment

---

## Key Files & Directories

```
msl-pakistan/
├── server.js              # Node.js server entry point
├── package.json           # Dependencies & scripts
├── .env                   # ⚠️ Local secrets (NOT in git)
├── .gitignore             # Ignore .env, node_modules, logs
├── src/                   # React frontend
├── server/                # Backend utilities
│   ├── logger.js          # Error logging
│   ├── emailService.js    # Email sending
│   └── templateManager.js # PDF templates
├── logs/                  # ⚠️ Auto-created (NOT in git)
└── storage/               # File persistence
    ├── whatsapp_settings.json
    ├── downloads.json
    └── template/
```

### .gitignore (Must Have)

Create `.gitignore` in root directory:

```
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
package-lock.json

# Logs
logs/
*.log

# Build output
dist/
build/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Temporary
temp/
tmp/
*.tmp

# Storage files (local only)
storage/downloads.json
storage/whatsapp_settings.json
```

---

## Deployment Verification

### After Deployment

1. **Check Hostinger Logs:**
   ```
   Applications → [Your App] → Logs
   ```
   Look for:
   ```
   ✅ Server running on port 3000
   ```

2. **Test Your App:**
   ```
   https://yourdomain.com
   https://yourdomain.com/admin
   https://yourdomain.com/generate-card
   ```

3. **Check API Endpoints:**
   ```bash
   curl https://yourdomain.com/test
   # Should return: { "message": "Server is running" }
   ```

4. **Verify Webhooks:**
   ```
   Update Webhook URL in Meta Dashboard to:
   https://yourdomain.com/webhook
   ```

5. **Test Email:**
   ```bash
   curl -X POST https://yourdomain.com/send-registration-email \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","full_name":"Test User"}'
   ```

---

## Troubleshooting

### Application Won't Start

**Error in Logs:** `Cannot find module 'express'`
```bash
SSH into server and run:
npm install
npm run server
```

### Environment Variables Not Loading

**Check Hostinger Environment Variables:**
1. Applications → Settings → Environment Variables
2. Ensure all required variables are set
3. Restart application

**Test Environment Variable:**
```javascript
// Add to server.js temporarily
console.log('DATABASE_URL:', process.env.VITE_SUPABASE_URL);
```

### Webhook URL Not Working

**Error:** Meta says webhook unreachable

1. Verify domain is pointing to Hostinger
2. Check HTTPS is enabled
3. Update webhook URL to HTTPS only
4. Test with curl:
   ```bash
   curl -v https://yourdomain.com/webhook
   ```

### Emails Not Sending in Production

**Check:**
1. SMTP credentials in Hostinger environment variables
2. SMTP_PASS is correct (copy from Hostinger email settings)
3. Test directly:
   ```bash
   curl -X POST https://yourdomain.com/send-registration-email \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","full_name":"Test"}'
   ```

### Logs Not Created

**Solution:**
1. SSH into server
2. Create logs directory:
   ```bash
   mkdir -p /home/user/public_html/msl-pakistan/logs
   chmod 755 logs
   ```
3. Restart app

---

## Best Practices

### Commit Messages
```
feat: add new feature          # New feature
fix: resolve bug               # Bug fix
docs: update readme             # Documentation
style: format code             # Code formatting
refactor: restructure code     # Code reorganization
test: add tests                # Test addition
```

### Update Frequency
- Push to main only when ready for production
- Use feature branches for development
- Test locally before pushing
- Keep main branch stable

### Monitoring
- Check logs regularly: `logs/main.log` and `logs/errors.log`
- Monitor GitHub for deployment status
- Test critical flows after each deployment
- Keep error logs backed up

### Version Control
- Meaningful commit messages
- One feature per commit
- Push frequently (at least daily)
- Tag releases: `git tag v1.0.0`

---

## Production Checklist (Before Going Live)

- [ ] Domain configured and pointing to Hostinger
- [ ] HTTPS/SSL certificate enabled
- [ ] All environment variables set in Hostinger
- [ ] Database backups configured in Supabase
- [ ] Email SMTP tested from production
- [ ] WhatsApp webhook URL updated to production domain
- [ ] Error logs being created and monitored
- [ ] Admin credentials reset (strong password)
- [ ] `.env` file removed from repository
- [ ] `node_modules/` is in `.gitignore`
- [ ] GitHub repository is set to private (if confidential)
- [ ] GitHub auto-deploy integration tested
- [ ] Local development uses `.env.local` (not committed)

---

## Post-Deployment Monitoring

### Daily Tasks
```bash
# Check if app is running
curl https://yourdomain.com/test

# Monitor errors
# Review Hostinger Application Logs
```

### Weekly Tasks
- Review `logs/errors.log` for issues
- Update dependencies: `npm update`
- Check GitHub for security alerts
- Backup database: Supabase Dashboard → Backups

### Monthly Tasks
- Rotate API tokens
- Update SMTP password if needed
- Review user activity logs
- Plan feature updates

---

## Quick Reference Commands

```bash
# Local Development
npm install              # Install dependencies
npm run dev             # Start frontend dev server
npm run server          # Start backend server
npm run build           # Build for production

# Git Commands
git clone <url>         # Clone repository
git checkout -b feature # Create feature branch
git push origin main    # Push to GitHub
git pull origin main    # Pull latest changes

# Hostinger (via SSH)
npm install             # Install dependencies
npm restart             # Restart application
tail -f logs/main.log   # View logs in real-time
```

---

## Support & Documentation

- **Hostinger Help:** https://support.hostinger.com
- **Node.js Docs:** https://nodejs.org/docs
- **GitHub Docs:** https://docs.github.com
- **Supabase:** https://supabase.com/docs
- **Express.js:** https://expressjs.com

---

**Status:** Ready for Production Deployment ✅
