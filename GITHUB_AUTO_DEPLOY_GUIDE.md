# GitHub & Auto-Deployment Quick Guide

**Last Updated:** February 2026

---

## 1-Minute Summary

```
VS Code Changes → git push → GitHub → Hostinger Auto-Deploy → Live in 2-3 minutes ✅
```

---

## Initial Setup (One-Time Only)

### Step 1: Create GitHub Account & Repository

```bash
# Go to github.com/signup
# Create free account
# Go to github.com/new
# Create repository: msl-pakistan
# Copy HTTPS link: https://github.com/yourusername/msl-pakistan.git
```

### Step 2: Setup Git in VS Code

```bash
# Open Terminal in VS Code (Ctrl + `)
# Configure Git (one-time)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Step 3: Initialize & Push to GitHub

```bash
# In VS Code Terminal (project root):
git init
git add .
git commit -m "Initial commit: MSL Pakistan app"
git branch -M main
git remote add origin https://github.com/yourusername/msl-pakistan.git
git push -u origin main
```

### Step 4: Hostinger Auto-Deploy Setup

1. Login to Hostinger Control Panel
2. **Applications → Your App → Settings**
3. Click **Connect Repository**
4. Authorize GitHub → Select `msl-pakistan`
5. Branch: `main`
6. Enable **Auto-deploy on push** ✅

---

## Daily Workflow (Edit → Deploy)

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes in VS Code
# ... edit files, save (Ctrl+S) ...

# 3. Test locally
npm run dev
npm run server

# 4. Commit changes
git add .
git commit -m "feat: describe your changes"

# 5. Push to GitHub
git push origin feature/my-feature

# 6. Go to GitHub.com → Create Pull Request
# 7. Merge to main
# 8. Hostinger deploys automatically ✅ (2-3 min)
```

### Alternative: Direct to Main (Faster)

```bash
# Skip pull request, go directly to production
git add .
git commit -m "feat: quick fix"
git push origin main
# Deployment starts immediately ✅
```

---

## Key Files to Add to .gitignore

**Create `.gitignore` in project root:**

```
# CRITICAL - Never commit these!
.env                    # Local secrets
node_modules/           # Dependencies
logs/                   # Application logs
dist/                   # Build files
.vscode/                # Editor config
.DS_Store               # Mac files
Thumbs.db               # Windows files
*.log                   # Log files
temp/                   # Temporary files

# Optional
storage/downloads.json  # Local data
storage/whatsapp_settings.json
```

**Commit .gitignore:**
```bash
git add .gitignore
git commit -m "chore: add gitignore"
git push origin main
```

---

## GitHub Workflow Diagram

```
┌─────────────────┐
│   VS Code IDE   │
│  (Local Editor) │
└────────┬────────┘
         │ git push
         ↓
┌─────────────────┐
│ GitHub.com      │
│ (Repository)    │
└────────┬────────┘
         │ Webhook
         ↓
┌─────────────────┐
│ Hostinger       │
│ (Auto-deploy)   │
└────────┬────────┘
         │ npm install
         │ npm run server
         ↓
┌─────────────────┐
│ Production Live │
│ yourdomain.com  │
└─────────────────┘
```

---

## Checking Deployment Status

### In Hostinger

1. **Hosting → Applications → Your App**
2. **Deployment History** tab
3. **Status:** Success ✅ or Failed ❌
4. **Logs:** See what happened during deploy

### Common Deploy Logs

**Success:**
```
Cloning repository...
npm install...
Build successful
✅ Application deployed
```

**No Changes:**
```
No new commits detected
⏭️ Skipped deployment
```

**Failed (Check logs):**
```
❌ npm install failed
❌ Missing environment variable
❌ Syntax error in code
```

---

## Typical Daily Workflow

### Morning
```bash
# Get latest changes
git pull origin main

# Create today's branch
git checkout -b feature/daily-updates
```

### Throughout Day
```bash
# Make changes in VS Code
# Test locally: npm run dev

# Every 1-2 hours:
git add .
git commit -m "feat: describe work"
git push origin feature/daily-updates
```

### End of Day
```bash
# Go to GitHub.com
# Review Pull Request
# Click "Merge pull request"
# Hostinger auto-deploys to production ✅
```

---

## Common Commands Reference

### Git Commands
```bash
# Status and changes
git status              # See what changed
git diff                # See exact changes
git log                 # See commit history

# Branches
git checkout -b name    # Create new branch
git checkout main       # Switch to main
git branch -d name      # Delete branch

# Upload changes
git add .               # Stage all changes
git commit -m "msg"     # Commit with message
git push origin branch  # Upload to GitHub
git pull origin main    # Download from GitHub

# Undo changes
git reset --hard HEAD   # Discard all changes
git revert <commit>     # Undo specific commit

# Tags (releases)
git tag v1.0.0          # Create version tag
git push origin --tags  # Push tags to GitHub
```

### Node Commands
```bash
npm install             # Install dependencies
npm run dev             # Dev server (port 5173)
npm run build           # Build for production
npm run server          # Backend (port 3001)
npm run preview         # Preview build
npm start               # Production start
```

---

## Troubleshooting

### "fatal: not a git repository"
```bash
# Fix: Initialize git in project root
git init
git add .
git commit -m "Initial commit"
```

### "Permission denied (publickey)"
```bash
# Fix: Add SSH key
# Go to github.com/settings/keys
# Or use HTTPS instead of SSH
git remote set-url origin https://github.com/user/repo.git
```

### Changes Not Deploying
```bash
# 1. Make sure you're on main branch
git checkout main

# 2. Verify changes are pushed
git log -1  # See latest commit

# 3. Check Hostinger deployment history
# (Applications → Your App → Deployment History)

# 4. If stuck, manually trigger in Hostinger
# (Applications → Rebuild)
```

### Merge Conflicts
```bash
# This happens when same file changed in two branches
# Fix: Use VS Code
# 1. Click file with conflict
# 2. Choose "Accept Current Change" or "Accept Incoming"
# 3. Save file
# 4. Git add . && git commit

git add .
git commit -m "fix: resolve merge conflict"
git push origin main
```

### Can't Push Changes
```bash
# Error: "updates were rejected"
# Fix: Pull before push
git pull origin main
git push origin main
```

---

## Security Best Practices

### ✅ DO:
- Use `.gitignore` for `.env` files ✅
- Create strong GitHub password
- Enable 2FA on GitHub: github.com/settings/security
- Keep tokens secret (never in git)
- Use separate passwords for different services

### ❌ DON'T:
- Commit `.env` file ❌
- Share GitHub credentials ❌
- Commit passwords or API keys ❌
- Disable git checks ❌
- Use weak passwords ❌

---

## Advanced Tips

### Automated Testing Before Deploy

Add to `package.json`:
```json
{
  "scripts": {
    "pre-commit": "npm run lint && npm run test",
    "server": "node server.js"
  }
}
```

Then before push:
```bash
npm run pre-commit  # Run tests
git push origin main
```

### Feature Branch Strategy

```bash
# Keep main stable, use feature branches
git checkout -b feature/new-card-design
# ... work ...
git push origin feature/new-card-design

# Create PR, review, merge when ready
```

### Rollback to Previous Version

```bash
# See previous commits
git log --oneline

# Go back to specific commit
git revert <commit-hash>
git push origin main
# Production reverts to that version ✅
```

---

## GitHub Repository Settings

### Recommended Settings

1. **Settings → General**
   - Keep repository description updated
   - Lock main branch

2. **Settings → Branches**
   - Set `main` as default branch
   - Require pull request reviews (optional)

3. **Settings → Deploy Keys**
   - Add Hostinger's public key for secure pushes

4. **Settings → Secrets**
   - GitHub Actions secrets (if using CI/CD)

---

## Monthly Checklist

- [ ] All changes committed and pushed
- [ ] `.env` never committed
- [ ] `logs/` not in repository
- [ ] `node_modules/` not in repository
- [ ] GitHub repository backed up
- [ ] Production deployment working
- [ ] No unmerged feature branches
- [ ] Dependencies updated: `npm update`

---

## Example: Complete Workflow

```bash
# 1. Get latest
git pull origin main

# 2. Create feature
git checkout -b feature/new-feature

# 3. Make changes
# ... edit src/pages/Admin.tsx ...
# ... test: npm run dev ...

# 4. Commit
git add .
git commit -m "feat: add new admin dashboard widget"

# 5. Push feature
git push origin feature/new-feature

# 6. GitHub → Create Pull Request
# Review changes, check for issues

# 7. GitHub → Merge to main
git checkout main
git pull origin main

# 8. Hostinger detects change
# Auto-deployment starts...
# ✅ Live in 2-3 minutes

# 9. Production verification
curl https://yourdomain.com
# Should see latest changes
```

---

## Quick Links

- **GitHub Dashboard:** https://github.com/dashboard
- **Hostinger Panel:** https://hpanel.hostinger.com
- **Git Docs:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com

---

**Status:** Ready to Use ✅  
**Questions?** Check Hostinger support or Git documentation
