# Production Deployment - Complete Checklist

**Project:** MSL Pakistan  
**Status:** Ready for Deployment  
**Date:** February 2026

---

## Pre-Deployment Setup (Week 1)

### Phase 1: GitHub Repository Setup

- [ ] **Create GitHub Account**
  - Go to github.com/signup
  - Create free account
  - Create repository: `msl-pakistan`
  - Set to **Private** (if confidential data)

- [ ] **Initialize Local Git**
  ```bash
  cd f:\MSL
  git config --global user.name "Your Full Name"
  git config --global user.email "your@email.com"
  git init
  ```

- [ ] **Create .gitignore File**
  - Create file: `f:\MSL\.gitignore`
  - Add content from below:
  ```
  .env
  node_modules/
  logs/
  dist/
  build/
  .vscode/
  .DS_Store
  Thumbs.db
  *.log
  temp/
  storage/downloads.json
  storage/whatsapp_settings.json
  ```

- [ ] **First Git Commit**
  ```bash
  git add .
  git commit -m "Initial commit: MSL Pakistan application"
  git branch -M main
  git remote add origin https://github.com/yourusername/msl-pakistan.git
  git push -u origin main
  ```

### Phase 2: Hostinger Account Setup

- [ ] **Sign Up for Hostinger**
  - Go to hostinger.com
  - Choose Node.js hosting plan
  - Complete registration and payment

- [ ] **Create Node.js Application**
  - Login to hpanel.hostinger.com
  - Hosting → Applications → Create Application
  - Node.js Version: 18 LTS
  - Port: 3000
  - Startup Command: `npm run server`

- [ ] **Point Domain to Hostinger**
  - Add domain in Hostinger control panel
  - Update nameservers at domain registrar
  - Wait 24-48 hours for propagation
  - Verify domain points to hosting

- [ ] **Enable HTTPS/SSL**
  - Hostinger → SSL Certificates
  - Auto-enable Let's Encrypt
  - Verify HTTPS works: `https://yourdomain.com`

### Phase 3: Environment Variables

- [ ] **Set Environment Variables in Hostinger**
  - Applications → Your App → Environment Variables
  - Add all variables from your `.env` file:

```env
NODE_ENV=production
PORT=3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
VITE_SUPABASE_PROJECT_ID=your_project_id
WHATSAPP_TOKEN=your_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_BUSINESS_ID=your_business_id
GRAPH_API_VERSION=v17.0
WEBHOOK_VERIFY_TOKEN=your_webhook_token
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@mslpakistan.org
SMTP_PASS=your_email_password
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

- [ ] **Verify .env is in .gitignore**
  ```bash
  git status
  # .env should NOT appear in changes
  ```

### Phase 4: GitHub & Hostinger Integration

- [ ] **Connect GitHub to Hostinger**
  - Applications → Your App → Settings
  - Repository Integration → Connect Repository
  - Authorize GitHub → Select `msl-pakistan`
  - Branch: `main`
  - Enable: "Auto-deploy on push" ✅

- [ ] **Test Auto-Deploy**
  ```bash
  # Make small change locally
  echo "// Test change" >> server.js
  git add .
  git commit -m "test: verify auto-deploy"
  git push origin main
  
  # Watch Hostinger deployment history
  # Should deploy within 2-3 minutes ✅
  
  # Revert test change
  git reset --hard HEAD~1
  git push origin main
  ```

---

## Pre-Launch Verification (Week 2)

### Database & Services

- [ ] **Test Supabase Connection**
  ```bash
  npm run dev
  # Go to http://localhost:5173/admin
  # Should connect to database
  ```

- [ ] **Test Email Service**
  ```bash
  curl -X POST http://localhost:3001/send-registration-email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","full_name":"Test User"}'
  # Check if email received
  ```

- [ ] **Test WhatsApp Integration**
  - Update webhook URL in Meta Business Suite:
    - From: `http://localhost:3001/webhook`
    - To: `https://yourdomain.com/webhook`
  - Test webhook verification completes successfully

- [ ] **Check Error Logging**
  - Local: `logs/main.log` and `logs/errors.log` exist
  - Production: SSH to Hostinger, verify `/logs/` directory created

### Application Testing

- [ ] **Test All Pages Load**
  ```
  https://yourdomain.com                 ✅
  https://yourdomain.com/admin           ✅
  https://yourdomain.com/generate-card   ✅
  https://yourdomain.com/verify-member   ✅
  ```

- [ ] **Test Member Registration**
  - Submit form with test data
  - Verify email received
  - Check Supabase database for new member

- [ ] **Test Admin Features**
  - Login with admin account
  - Check download limits configurable
  - Verify settings save correctly

- [ ] **Test WhatsApp Features**
  - Send OTP via WhatsApp
  - Verify message received
  - Check download limits enforced

### Performance & Security

- [ ] **Performance Check**
  - Page load time < 3 seconds
  - No console errors in DevTools
  - Images optimized and loading fast

- [ ] **Security Check**
  - HTTPS enabled (green lock icon) ✅
  - No sensitive data in logs
  - `.env` not committed to GitHub ✅
  - `node_modules/` not committed ✅

### Browser Compatibility

- [ ] **Test on Multiple Browsers**
  - Chrome ✅
  - Firefox ✅
  - Safari ✅
  - Edge ✅

- [ ] **Test on Mobile**
  - iPhone Safari
  - Android Chrome
  - Responsive design works

---

## Launch Day (Week 3)

### Final Checks

- [ ] **All code committed and pushed**
  ```bash
  git status
  # Should show "nothing to commit, working tree clean"
  ```

- [ ] **Latest deployment successful**
  - Hostinger → Applications → Deployment History
  - Last deployment: Success ✅

- [ ] **Admin credentials reset**
  - Change admin password to strong value
  - Update in Supabase Auth

- [ ] **Database backups enabled**
  - Supabase Dashboard → Settings → Backups
  - Enable automatic daily backups

- [ ] **Monitoring enabled**
  - Hostinger error logs being watched
  - Email alerts configured
  - Uptime monitoring enabled

### Launch Announcement

- [ ] **Announce publicly**
  - Send email to users: "Visit https://yourdomain.com"
  - Update social media with link
  - Post in relevant groups/communities

- [ ] **Monitor first 24 hours**
  - Check Hostinger logs every hour
  - Monitor error logs for issues
  - Be ready to hotfix if needed

---

## Post-Launch Operations

### Daily (First Week)

- [ ] Check application is responding
  ```bash
  curl https://yourdomain.com/test
  ```

- [ ] Review error logs for issues
  - SSH → `tail -f logs/errors.log`

- [ ] Monitor user registrations
  - Supabase Dashboard → Members table

### Weekly

- [ ] Review `logs/main.log` for patterns
- [ ] Update dependencies: `npm update`
- [ ] Check GitHub for security alerts
- [ ] Test critical workflows

### Monthly

- [ ] Full system health check
- [ ] Update API token/webhooks if needed
- [ ] Rotate SMTP password
- [ ] Review user feedback and issues
- [ ] Plan feature updates

---

## Ongoing Development Workflow

### For Each Update

```bash
# 1. Create feature branch
git checkout -b feature/description

# 2. Make changes in VS Code
# ... edit files ...

# 3. Test locally
npm run dev
npm run build

# 4. Commit and push
git add .
git commit -m "feat: description of changes"
git push origin feature/description

# 5. Create Pull Request on GitHub
# Review changes → Merge to main

# 6. Hostinger auto-deploys ✅ (2-3 min)
# Production updated automatically
```

### Emergency Hotfix

```bash
# If critical bug in production
git checkout main
git pull origin main

# Make fix
# ... edit files ...

# Push directly to main (skip PR)
git add .
git commit -m "fix: critical issue description"
git push origin main

# Hostinger deploys immediately
```

---

## Monthly Checklist

- [ ] All changes committed
- [ ] No uncommitted changes: `git status`
- [ ] No unmerged branches
- [ ] Dependencies updated: `npm update`
- [ ] Security alerts checked
- [ ] Backups verified in Supabase
- [ ] Error logs reviewed and archived
- [ ] User feedback collected and addressed
- [ ] Performance metrics checked
- [ ] Cost review (Hostinger, Supabase)

---

## Troubleshooting Deployed App

### App Won't Start
```
Hostinger → Applications → Logs
Look for error messages
Common: Missing environment variable, dependency not installed
```

### Changes Not Live
```
Check:
1. Code pushed to main: git push origin main
2. Deployment successful: Hostinger → Deployment History
3. Hard refresh browser: Ctrl+Shift+R
4. Clear browser cache
```

### Email Not Sending
```
Check:
1. SMTP_PASS correct in Hostinger env vars
2. SMTP credentials valid (test in Hostinger SMTP)
3. Firewall not blocking port 465
4. Look at errors.log for details
```

### WhatsApp Webhook Failing
```
Check:
1. Webhook URL updated to HTTPS
2. Webhook URL publicly accessible
3. hub.verify_token matches in Meta Dashboard
4. Port 443 (HTTPS) open in firewall
```

---

## Quick Reference

### Important URLs
```
GitHub: https://github.com/yourusername/msl-pakistan
Hostinger: https://hpanel.hostinger.com
Supabase: https://app.supabase.com
Your App: https://yourdomain.com
```

### Critical Files
- `.env` - Local secrets (NEVER COMMIT)
- `.gitignore` - Git ignore rules (ALWAYS COMMIT)
- `package.json` - Dependencies (ALWAYS COMMIT)
- `server.js` - Backend main file (ALWAYS COMMIT)

### Key Commands
```bash
git push origin main              # Deploy to production
npm install                       # Install dependencies
npm run server                    # Start backend
npm run dev                       # Start frontend
git log --oneline -10             # See recent commits
```

---

## Success Criteria

✅ **Deployment Successful When:**
- [ ] Domain points to Hostinger
- [ ] HTTPS/SSL enabled
- [ ] App accessible at yourdomain.com
- [ ] Admin panel accessible
- [ ] Database connected
- [ ] WhatsApp webhooks working
- [ ] Email notifications working
- [ ] Error logs created
- [ ] GitHub auto-deploy working
- [ ] All users can access the app

---

## Support Resources

- **Hostinger Support:** https://support.hostinger.com
- **GitHub Help:** https://docs.github.com
- **Node.js Docs:** https://nodejs.org/docs
- **Git Guide:** https://git-scm.com/doc
- **Express.js:** https://expressjs.com

---

**Next Steps:**
1. Follow Phase 1-4 in order over 2 weeks
2. Complete pre-launch verification
3. Launch on Week 3
4. Monitor and maintain ongoing

**Estimated Timeline:** 3 weeks from start to live production
