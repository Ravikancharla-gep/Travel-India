import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to frontend build directory (for production deployment)
const distPath = join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/route-map-india';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
let db;
let client;


// Google OAuth client
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

async function connectDB() {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📍 Connection string:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    
    // MongoDB connection options for Atlas (SSL/TLS)
    const options = {
      // SSL/TLS options for MongoDB Atlas
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 30000, // Increased timeout to 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 30000, // Connection timeout increased to 30s
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 1,
    };
    
    client = new MongoClient(MONGODB_URI, options);
    console.log('⏳ Connecting... (this may take up to 30 seconds)');
    await client.connect();
    
    // Test the connection
    await client.db('admin').command({ ping: 1 });
    db = client.db('route-map-india');
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📦 Database: route-map-india');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('🔍 Error details:', error);
    
    if (error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('alert')) {
      console.error('\n💡 Tip: Check MongoDB Atlas Network Access → IP Whitelist');
      console.error('   Make sure your current IP address is whitelisted (or use 0.0.0.0/0 for all IPs)');
    }
    
    if (error.message.includes('timeout') || error.message.includes('Server selection')) {
      console.error('\n💡 Tips to fix timeout:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify MongoDB Atlas Network Access → IP Whitelist includes your IP');
      console.error('   3. Check if your firewall/network blocks MongoDB connections');
      console.error('   4. Verify the connection string is correct in .env file');
      console.error('   5. Try whitelisting 0.0.0.0/0 (all IPs) in MongoDB Atlas for testing');
    }
    
    console.error('\n⚠️  Server will not start without database connection.');
    console.error('   You can still use the app with localStorage fallback (data won\'t be shared)');
    process.exit(1);
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = user.userId;
    next();
  });
};

// API Routes

// Root route - provide API info
// Root route - will be handled by static file serving if dist exists
app.get('/', (req, res, next) => {
  // Skip if static files exist (they'll be served by the catch-all route)
  if (existsSync(distPath)) {
    return next();
  }
  res.json({
    message: 'Route Map India API Server',
    version: '2.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        google: 'POST /api/auth/google',
      },
      health: 'GET /api/health',
      getAppState: 'GET /api/app-state (requires auth)',
      saveAppState: 'POST /api/app-state (requires auth)',
      deleteAppState: 'DELETE /api/app-state (requires auth)',
    },
    status: 'running',
  });
});

// Authentication Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if database is connected
    if (!db) {
      console.error('Database not connected');
      return res.status(500).json({ error: 'Database connection error. Please try again later.' });
    }

    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists. Please login instead.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await usersCollection.insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      picture: null,
      createdAt: new Date(),
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertedId.toString(), email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        picture: null,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    const errorMessage = error.message || 'Failed to register user';
    res.status(500).json({ error: errorMessage });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const usersCollection = db.collection('users');
    
    // Find user
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture || null,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Google OAuth login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    if (!googleClient || !GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google OAuth is not configured on the server' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    // Extract all fields from Google payload
    const email = payload.email;
    const name = payload.name;
    const googleId = payload.sub;
    const picture = payload.picture;
    
    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    const usersCollection = db.collection('users');
    
    // Find or create user
    let user = await usersCollection.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user - always use picture from Google if provided
      const newUserData = {
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        googleId,
        picture: picture || null,
        createdAt: new Date(),
        isGoogleAuth: true,
      };
      
      const result = await usersCollection.insertOne(newUserData);
      user = await usersCollection.findOne({ _id: result.insertedId });
    } else {
      // Always update with latest data from Google
      const updateData = {
        googleId,
        name: name || user.name,
        isGoogleAuth: true,
      };
      
      // Only update picture if Google provides it (not null/undefined)
      if (picture !== null && picture !== undefined && picture !== '') {
        updateData.picture = picture;
      } else if (!user.picture) {
        // If user has no picture and Google doesn't provide one, keep it null
        updateData.picture = null;
      }
      // If user already has a picture and Google doesn't provide one, don't update it
      
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: updateData }
      );
      user = await usersCollection.findOne({ _id: user._id });
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to create/find user' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || user.email.split('@')[0],
        picture: user.picture || null,
      },
    });
  } catch (error) {
    console.error('Error with Google login:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// Get user's app state (requires authentication)
app.get('/api/app-state', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const collection = db.collection('appStates');
    
    // Find app state for this user
    let appState = await collection.findOne({ userId }, { sort: { updatedAt: -1 } });
    
    if (!appState) {
      // Create default app state for this user
      const defaultState = {
        userId,
        tripLists: [],
        selectedTripId: null,
        mapState: {
          center: [20.5937, 78.9629],
          zoom: 6,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await collection.insertOne(defaultState);
      appState = defaultState;
    }
    
    // Remove MongoDB _id and userId before sending
    const { _id, userId: _, ...stateWithoutId } = appState;
    res.json(stateWithoutId);
  } catch (error) {
    console.error('Error fetching app state:', error);
    res.status(500).json({ error: 'Failed to fetch app state' });
  }
});

// Save app state (requires authentication)
app.post('/api/app-state', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const appState = req.body;
    const collection = db.collection('appStates');
    
    // Remove any _id that might be sent from client
    const { _id, ...stateWithoutId } = appState;
    
    // Try to update first
    const updateResult = await collection.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...stateWithoutId,
          userId, // Ensure userId is set
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );
    
    // Handle different MongoDB driver response formats
    let savedDoc = null;
    
    if (updateResult && updateResult.value) {
      // MongoDB driver 4.x+ format
      savedDoc = updateResult.value;
    } else if (updateResult && updateResult.lastErrorObject && updateResult.lastErrorObject.updatedExisting === false) {
      // Document was inserted, fetch it
      savedDoc = await collection.findOne({ userId });
    } else if (updateResult) {
      // Try direct property access
      savedDoc = updateResult.value || updateResult;
    }
    
    // If still no document, insert manually
    if (!savedDoc) {
      const insertResult = await collection.insertOne({
        ...stateWithoutId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      savedDoc = await collection.findOne({ _id: insertResult.insertedId });
    }
    
    if (!savedDoc) {
      return res.status(500).json({ error: 'Failed to save app state' });
    }
    
    // Remove MongoDB _id and userId before sending
    const { _id: mongoId, userId: _, ...savedState } = savedDoc;
    res.json(savedState);
  } catch (error) {
    console.error('Error saving app state:', error);
    res.status(500).json({ error: 'Failed to save app state', details: error.message });
  }
});

// Delete user's app state (requires authentication)
app.delete('/api/app-state', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const collection = db.collection('appStates');
    await collection.deleteMany({ userId });
    res.json({ message: 'App state deleted successfully' });
  } catch (error) {
    console.error('Error deleting app state:', error);
    res.status(500).json({ error: 'Failed to delete app state' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React app build directory (for production)
// Path is relative to server.js: ../dist (Vite build output)
if (existsSync(distPath)) {
  // Serve static files from the React app
  app.use(express.static(distPath));
  
  // Handle React routing: return all requests to React app (must be last route)
  app.get('*', (req, res, next) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return next(); // Let API routes handle their own 404s
    }
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  // Frontend build not found - normal in development
  
  // Development mode: just return a message for root route (non-API)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // Let API routes handle their own responses
    }
    res.json({
      message: 'Route Map India API Server',
      note: 'Frontend build not found. In production, the frontend will be served from /dist',
      api: {
        health: '/api/health',
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          google: 'POST /api/auth/google',
        },
        appState: {
          get: 'GET /api/app-state (requires auth)',
          save: 'POST /api/app-state (requires auth)',
          delete: 'DELETE /api/app-state (requires auth)',
        },
      },
    });
  });
}

// Start server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

