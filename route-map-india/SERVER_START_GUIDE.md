# Server Start Guide - Quick Fix

## ✅ Current Status

**Good News:** Your server should be working! The terminal shows:
- ✅ Connected to MongoDB
- 🚀 Server running on http://localhost:3001

## 🔧 Fixed Issues

1. **Save Error Fixed**: The `result.value` undefined error has been fixed in the code
2. **Error Handling Improved**: Better error messages for Google OAuth

## 🚀 To Start the Server Fresh

1. **Stop any running server** (if needed):
   - Press `Ctrl+C` in the terminal where server is running
   - OR kill the process: `taskkill /F /IM node.exe` (careful - kills all Node processes)

2. **Start the server**:
   ```bash
   cd route-map-india/server
   npm start
   ```

3. **You should see**:
   ```
   ✅ Connected to MongoDB
   🚀 Server running on http://localhost:3001
   📡 API endpoints available at http://localhost:3001/api
   ```

## ⚠️ If You Still Get Errors

### Error: "Cannot find package 'express'"
**Solution**: Install dependencies
```bash
cd route-map-india/server
npm install
```

### Error: "EADDRINUSE: address already in use"
**Solution**: Port 3001 is already in use
```bash
# Find and kill the process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
# Then start server again
npm start
```

### Error: "result.value is undefined"
**Solution**: This is now fixed in the code. Just restart the server.

## 🧪 Test Your Server

1. **Test health endpoint**:
   - Open: http://localhost:3001/api/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Test root endpoint**:
   - Open: http://localhost:3001/
   - Should show API info

3. **Test Google OAuth endpoint** (should return error without credentials, but confirms it exists):
   - Open: http://localhost:3001/api/auth/google
   - Should return an error (expected - needs POST with credentials)

## 📝 Environment Variables Check

Make sure `.env` file exists in `route-map-india/server/` with:
```
MONGODB_URI=mongodb+srv://ravikrc02_db_user:%40Cs6147246@travel-india.sbccrz9.mongodb.net/route-map-india?retryWrites=true&w=majority
PORT=3001
JWT_SECRET=travel-india-secret-key-2024
GOOGLE_CLIENT_ID=663190802521-je6ard3s9p9054p4gd7ffl183aldgrp6.apps.googleusercontent.com
```

## 🎯 Next Steps

Once server is running:
1. Restart your frontend: `cd route-map-india && npm run dev`
2. Try Google Sign-In again
3. The improved error messages will tell you exactly what's wrong if anything fails

---

**Your server should be working now! 🎉**

