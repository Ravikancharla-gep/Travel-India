# Route Map India - Backend API

Backend server for Route Map India using MongoDB Atlas (free tier).

## Setup Instructions

### 1. Create MongoDB Atlas Account (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (Free tier - M0)
4. Create a database user:
   - Database Access → Add New Database User
   - Choose username and password (save these!)
5. Whitelist IP addresses:
   - Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for development
6. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`)

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/route-map-india?retryWrites=true&w=majority
   PORT=3001
   ```

   **Important**: Replace `your-username` and `your-password` with your actual MongoDB Atlas credentials.

### 4. Run the Server

For development (with auto-reload):
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will run on `http://localhost:3001` (or the PORT you specified).

## Deployment Options

### Option 1: Deploy to Render (Free Tier)

1. Push your code to GitHub
2. Go to [Render](https://render.com)
3. Create a new Web Service
4. Connect your GitHub repo
5. Set:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**: Add `MONGODB_URI` and `PORT`

### Option 2: Deploy to Railway (Free Tier)

1. Push your code to GitHub
2. Go to [Railway](https://railway.app)
3. Create a new project from GitHub
4. Add environment variable `MONGODB_URI`
5. Deploy

### Option 3: Deploy to Vercel/Netlify (Serverless Functions)

You'll need to convert this to serverless functions. See their documentation for MongoDB Atlas integration.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/app-state` - Get the current app state
- `POST /api/app-state` - Save app state (body: AppState object)

## Notes

- The API currently stores one shared app state (all users see the same data)
- To add user-specific data later, you can add user authentication and modify the endpoints to filter by user ID
- Images are stored as base64 strings in MongoDB (for free tier, this works but has size limits)

