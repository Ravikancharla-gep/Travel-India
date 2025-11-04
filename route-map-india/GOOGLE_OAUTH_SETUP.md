# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Travel India app.

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project** (or select existing)
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it "Travel India" (or any name you like)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity Services"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless you have a Google Workspace account)
   - Fill in required fields:
     - App name: "Travel India"
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Add scopes (default is fine): `email`, `profile`, `openid`
   - Add test users (your email) if app is in testing mode
   - Click "Save and Continue"

5. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Travel India Web Client"
   - **Authorized JavaScript origins**:
     - For local dev: `http://localhost:5173` (or your Vite port)
     - For production: `https://your-domain.com` (your deployed frontend URL)
   - **Authorized redirect URIs**:
     - For local dev: `http://localhost:5173` (or your Vite port)
     - For production: `https://your-domain.com` (your deployed frontend URL)
   - Click "Create"
   - **Copy the Client ID** (you'll need this!)
   - "663190802521-je6ard3s9p9054p4gd7ffl183aldgrp6.apps.googleusercontent.com"

## Step 2: Configure Frontend

1. **Create `.env` file** in `route-map-india/` directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
   VITE_API_URL=http://localhost:3001/api
   ```

2. **Restart your frontend dev server**:
   ```bash
   npm run dev
   ```

## Step 3: Configure Backend

1. **Create/Update `.env` file** in `route-map-india/server/` directory:
   ```env
   MONGODB_URI=your-mongodb-connection-string
   PORT=3001
   JWT_SECRET=your-secret-key-here
   GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
   ```

2. **Install dependencies** (if not already done):
   ```bash
   cd server
   npm install
   ```

3. **Restart your backend server**:
   ```bash
   npm start
   ```

## Step 4: Test

1. Open your app: `http://localhost:5173`
2. Click "Login"
3. You should see "Sign in with Google" button
4. Click it and sign in with your Google account
5. You should be logged in! ✨

## For Production Deployment

1. **Update Authorized Origins/URIs** in Google Cloud Console:
   - Add your production frontend URL (e.g., `https://your-app.netlify.app`)
   - Add your production backend URL if needed

2. **Update Environment Variables**:
   - Frontend: Set `VITE_GOOGLE_CLIENT_ID` in your hosting platform (Netlify/Vercel)
   - Backend: Set `GOOGLE_CLIENT_ID` in your hosting platform (Render/Railway)

## Troubleshooting

### "Google Sign-In is not available"
- Make sure `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Restart your dev server after adding the env variable
- Check browser console for errors

### "Invalid client" or "Origin mismatch"
- Verify your frontend URL matches the "Authorized JavaScript origins" in Google Cloud Console
- For localhost, make sure the port matches (e.g., `http://localhost:5173`)
- Wait a few minutes after updating Google Console settings

### "Google OAuth is not configured on the server"
- Make sure `GOOGLE_CLIENT_ID` is set in `server/.env`
- Restart your backend server
- Verify the Client ID matches in both frontend and backend

### Button doesn't appear
- Check browser console for JavaScript errors
- Verify Google Identity Services script loaded: `https://accounts.google.com/gsi/client`
- Make sure `VITE_GOOGLE_CLIENT_ID` is configured correctly

## Security Notes

⚠️ **Important**:
- Never commit `.env` files to Git
- The Client ID is safe to expose in frontend code (it's public)
- Keep `JWT_SECRET` and `GOOGLE_CLIENT_ID` secret in backend
- Use environment variables for all sensitive data

## Need Help?

- Google OAuth Docs: https://developers.google.com/identity/gsi/web
- Google Cloud Console: https://console.cloud.google.com/

---

**Once configured, users can sign in with their Google account with just one click! 🎉**

