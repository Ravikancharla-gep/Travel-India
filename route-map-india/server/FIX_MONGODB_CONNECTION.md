# Fix MongoDB Connection Timeout

## The Issue
**MongoDB connection timeout is NOT related to Google Client ID.** They are separate.

## Quick Fix Steps

### Step 1: Whitelist Your IP in MongoDB Atlas

1. Go to https://cloud.mongodb.com/
2. Log in
3. Click on your cluster → **"Network Access"** (left sidebar)
4. Click **"Add IP Address"**
5. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`) OR add your current IP
6. Click **"Confirm"**
7. **Wait 1-2 minutes** for changes to take effect

### Step 2: Verify Your Connection String

Your `.env` file should have (and it looks correct):
```env
MONGODB_URI=mongodb+srv://ravikrc02_db_user:%40Cs6147246@travel-india.sbccrz9.mongodb.net/route-map-india?retryWrites=true&w=majority
```

**Note**: The `%40` is correct - it's URL-encoded `@` symbol.

### Step 3: Check MongoDB Cluster Status

1. Go to MongoDB Atlas dashboard
2. Check if your cluster is **"Paused"**
3. If paused, click **"Resume"** (free tier clusters pause after inactivity)
4. Wait 2-3 minutes for cluster to resume

### Step 4: Restart Server

After whitelisting IP and verifying cluster is running:

```bash
cd route-map-india/server
npm start
```

You should see:
```
✅ Connected to MongoDB successfully!
📦 Database: route-map-india
🚀 Server running on http://localhost:3001
```

## Common Issues

### "Still timing out after whitelisting"
- Wait 2-3 minutes after adding IP
- Check if cluster is paused and resume it
- Try using mobile hotspot to test if it's a network issue

### "Authentication failed"
- Verify username and password in MongoDB Atlas
- Make sure password is URL-encoded in connection string

## Important Notes

- **Google Client ID** is only needed for Google Sign-In feature
- **MongoDB connection** is needed for user registration/login and data storage
- These are **completely separate** - one doesn't affect the other

