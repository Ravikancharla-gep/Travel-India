# MongoDB Connection Troubleshooting Guide

## Issue: "Server selection timed out after 10000 ms"

This error means the server cannot connect to MongoDB Atlas. Here's how to fix it:

## Step 1: Check MongoDB Atlas IP Whitelist

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Click on your cluster → **Network Access** (left sidebar)
4. Click **"Add IP Address"**
5. **For testing**: Add `0.0.0.0/0` (allows all IPs) - Click "Confirm"
6. **For production**: Add your current IP address only

**Important**: After adding IP, wait 1-2 minutes for changes to take effect.

## Step 2: Verify Connection String in .env File

Create/check `.env` file in `route-map-india/server/` directory:

```env
MONGODB_URI=mongodb+srv://ravikrc02_db_user:@Cs6147246@travel-india.sbccrz1.mongodb.net/?appName=travel-india
JWT_SECRET=your-secret-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id
```

**Important Notes:**
- Make sure the connection string is correct
- The password `@Cs6147246` needs to be URL-encoded if it contains special characters
- If your password contains `@`, it should be `%40` in the connection string
- Make sure there are no spaces or extra characters

## Step 3: Test Connection

After updating IP whitelist, restart the server:

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

### Issue: Still timing out after whitelisting IP
- **Solution**: Wait 2-3 minutes after adding IP, then restart server
- Check if your firewall/antivirus is blocking MongoDB connections
- Try using mobile hotspot to test if it's a network issue

### Issue: "Authentication failed"
- **Solution**: Check your MongoDB username and password in the connection string
- Make sure password is URL-encoded if it contains special characters

### Issue: "SSL/TLS error"
- **Solution**: The connection string should use `mongodb+srv://` (with `+srv`)
- Make sure you're using the correct connection string from MongoDB Atlas

## Quick Fix (For Testing Only)

If you need to test quickly without MongoDB:
1. The app will still work with localStorage fallback
2. Data will be stored locally (not shared with other users)
3. You can connect to MongoDB later to enable shared data

## Still Having Issues?

1. Check MongoDB Atlas dashboard → Cluster → "Connect" → "Connect your application"
2. Copy the connection string from there
3. Make sure to replace `<password>` with your actual password
4. Update `.env` file with the new connection string

