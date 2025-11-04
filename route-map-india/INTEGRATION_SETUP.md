# MongoDB Integration Setup Guide

This guide will help you set up MongoDB Atlas (free tier) for your Route Map India application.

## Prerequisites

- Node.js installed (v18 or higher)
- MongoDB Atlas account (free)

## Step 1: Set Up MongoDB Atlas

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Sign up for a free account

2. **Create a Cluster**
   - After signing in, click "Build a Database"
   - Choose **FREE** (M0) tier
   - Select a cloud provider and region (closest to you)
   - Click "Create"

3. **Create Database User**
   - Go to **Database Access** → **Add New Database User**
   - Choose "Password" authentication
   - Username: Choose something (e.g., `route-map-user`)
   - Password: Generate or create a strong password (SAVE THIS!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to **Network Access** → **Add IP Address**
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
   - ⚠️ **Note**: For production, restrict to specific IPs

5. **Get Connection String**
   - Go to **Database** → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with your database user credentials

## Step 2: Set Up Backend Server

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file**
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/route-map-india?retryWrites=true&w=majority
   PORT=3001
   ```
   
   Replace:
   - `your-username` with your MongoDB Atlas username
   - `your-password` with your MongoDB Atlas password
   - `cluster0.xxxxx.mongodb.net` with your actual cluster URL

5. **Start the server**
   ```bash
   npm run dev
   ```
   
   You should see: `✅ Connected to MongoDB` and `🚀 Server running on http://localhost:3001`

## Step 3: Configure Frontend

1. **Create `.env` file in root directory**
   ```bash
   cp .env.example .env
   ```

2. **For local development**, the default is already set:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Start the frontend**
   ```bash
   npm run dev
   ```

## Step 4: Deploy Backend (Free Options)

### Option A: Render (Recommended)

1. Push your code to GitHub
2. Go to [Render](https://render.com)
3. Sign up/login
4. Click "New +" → "Web Service"
5. Connect your GitHub repository
6. Configure:
   - **Name**: `route-map-india-api`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `MONGODB_URI`: Your MongoDB connection string
     - `PORT`: `10000` (Render uses port 10000)
7. Click "Create Web Service"
8. Copy the service URL (e.g., `https://route-map-india-api.onrender.com`)

### Option B: Railway

1. Push your code to GitHub
2. Go to [Railway](https://railway.app)
3. Sign up/login
4. Click "New Project" → "Deploy from GitHub repo"
5. Select your repository
6. Add environment variable:
   - `MONGODB_URI`: Your MongoDB connection string
7. Deploy

## Step 5: Update Frontend for Production

1. **Update `.env` file** (or create `.env.production`)
   ```
   VITE_API_URL=https://your-api-url.onrender.com/api
   ```

2. **Rebuild frontend**
   ```bash
   npm run build
   ```

3. **Deploy frontend** (GitHub Pages, Netlify, Vercel, etc.)

## Testing

1. **Test backend locally**:
   - Start server: `cd server && npm run dev`
   - Visit: `http://localhost:3001/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Test frontend**:
   - Add a trip in the app
   - Check MongoDB Atlas → Browse Collections
   - You should see `appStates` collection with your data

## Troubleshooting

### "MongoNetworkError: failed to connect"
- Check your MongoDB Atlas IP whitelist (should include 0.0.0.0/0)
- Verify username/password in connection string
- Check cluster is running (not paused)

### "401 Unauthorized"
- Verify MongoDB username and password are correct
- Check connection string format

### "Frontend can't connect to API"
- Check `VITE_API_URL` in `.env` file
- Make sure backend server is running
- Check CORS settings in server.js

### CORS errors
- Server already has CORS enabled for all origins
- If issues persist, check browser console for specific error

## Data Sharing

With this setup:
- ✅ All users see the **same shared data** (one global state)
- ✅ Changes made by one user are visible to all users
- ✅ Data persists even after browser refresh

**Future Enhancement**: To add user-specific data, you would:
1. Add user authentication (login)
2. Modify API to store data per user ID
3. Filter data by user ID when loading

## Support

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app

