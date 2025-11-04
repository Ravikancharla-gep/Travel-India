# GitHub Publishing Guide

This guide will help you publish your Travel India application to GitHub.

## Prerequisites

1. **GitHub Account**: Make sure you have a GitHub account
2. **Git Installed**: Ensure Git is installed on your system
3. **No Sensitive Data**: All `.env` files are already excluded in `.gitignore`

## Step-by-Step Instructions

### 1. Initialize Git Repository

```bash
cd route-map-india
git init
```

### 2. Add All Files to Git

```bash
git add .
```

### 3. Create Initial Commit

```bash
git commit -m "Initial commit: Travel India - Interactive route mapping application"
```

### 4. Create a New Repository on GitHub

1. Go to [GitHub.com](https://github.com)
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `travel-india` (or your preferred name)
   - **Description**: "Interactive route mapping application for planning trips across India"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

### 5. Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/travel-india.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 6. Verify Upload

- Go to your GitHub repository page
- You should see all your files there
- Check that `.env` files are **NOT** visible (they should be excluded)

## Important Notes

### ✅ What's Included
- All source code
- Configuration files
- Documentation
- Public assets (images, icons)
- Package files (package.json, package-lock.json)

### ❌ What's Excluded (via .gitignore)
- `.env` files (containing API keys and secrets)
- `node_modules/` (dependencies - will be installed via `npm install`)
- `dist/` (build output)
- Log files
- Editor-specific files

### 🔒 Security Checklist

Before pushing, verify:
- ✅ No `.env` files in the repository
- ✅ No API keys hardcoded in source files
- ✅ MongoDB connection strings are in `.env` (excluded)
- ✅ Google Client ID in `.env` (excluded)
- ✅ JWT secrets in `.env` (excluded)

## Environment Variables Setup

Anyone cloning your repository will need to create their own `.env` files:

### Frontend `.env` (route-map-india/.env):
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_API_URL=http://localhost:3001/api
```

### Backend `.env` (route-map-india/server/.env):
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id-here
PORT=3001
```

## After Publishing

### For Contributors/Users

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/travel-india.git
   cd travel-india
   ```

2. **Install dependencies**:
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd server
   npm install
   cd ..
   ```

3. **Set up environment variables**:
   - Create `.env` files in root and `server/` directory
   - Add the required environment variables

4. **Run the application**:
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd server
   npm start
   ```

## Troubleshooting

### Issue: "fatal: remote origin already exists"
**Solution**: 
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/travel-india.git
```

### Issue: "Permission denied (publickey)"
**Solution**: 
- Use HTTPS URL instead of SSH
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### Issue: "failed to push some refs"
**Solution**:
```bash
git pull origin main --allow-unrelated-histories
# Resolve any conflicts, then:
git push -u origin main
```

## Next Steps

After publishing:
1. Add a detailed README.md with setup instructions
2. Add a LICENSE file
3. Consider adding GitHub Actions for CI/CD
4. Set up GitHub Pages for hosting (if needed)
5. Add badges to README (build status, version, etc.)

## Useful Git Commands

```bash
# Check status
git status

# View changes
git diff

# View commit history
git log

# Add specific file
git add filename

# Commit with message
git commit -m "Your commit message"

# Push changes
git push

# Pull latest changes
git pull
```

