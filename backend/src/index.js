const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { buildAVLFromUsers } = require('./ds/AVLTree');
const { buildGraphFromFriendships } = require('./ds/Graph');
const { buildBTreeFromPosts } = require('./ds/BTree');

const User = require('./models/User');
const Friendship = require('./models/Friendship');
const Post = require('./models/Post');

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// --- LAZY INITIALIZATION SYSTEM ---
let dsInitialized = false;
let dsInitializing = false;

async function initDataStructures(isMock = false) {
  if (dsInitialized) return;
  console.log(`\n[DS Init] Building in-memory data structures from ${isMock ? 'MOCK data' : 'database'}...`);
  try {
    let users, friendships, posts;
    
    if (isMock) {
      const mockData = require('./mock/mockData');
      users = await mockData.getMockUsers();
      friendships = await mockData.getMockFriendships();
      posts = await mockData.getMockPosts();
    } else {
      users = await User.find({}).select('_id username');
      friendships = await Friendship.find({}).select('requester recipient status');
      posts = await Post.find({}).select('_id content author createdAt');
    }

    buildAVLFromUsers(users);
    buildGraphFromFriendships(users, friendships);
    buildBTreeFromPosts(posts);

    dsInitialized = true;
    console.log(`[DS Init] All data structures ready ${isMock ? '(MOCK MODE)' : '✓'}\n`);
  } catch (err) {
    console.error('[DS Init] Error:', err.message);
  }
}

// Middleware to ensure DS is ready before any request
const ensureDSReady = async (req, res, next) => {
  if (dsInitialized) return next();
  
  if (!dsInitializing) {
    dsInitializing = true;
    const MONGO_URI = process.env.MONGODB_URI;
    
    if (!MONGO_URI || process.env.MOCK_MODE === 'true') {
       process.env.MOCK_MODE = 'true';
       await initDataStructures(true);
       dsInitializing = false;
       return next();
    }

    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      console.log('MongoDB connected (Lazy)');
      await initDataStructures(false);
    } catch (err) {
      console.error('Lazy MongoDB connection failed:', err.message);
      process.env.MOCK_MODE = 'true';
      await initDataStructures(true);
    } finally {
      dsInitializing = false;
    }
  } else {
    // If already initializing, wait a bit
    let checks = 0;
    const interval = setInterval(() => {
      checks++;
      if (dsInitialized || checks > 10) {
        clearInterval(interval);
        next();
      }
    }, 500);
    return;
  }
  next();
};

app.use(ensureDSReady);

// Routes
const routes = {
  auth: require('./routes/auth'),
  users: require('./routes/users'),
  friends: require('./routes/friends'),
  posts: require('./routes/posts'),
  ds: require('./routes/ds')
};

Object.entries(routes).forEach(([name, router]) => {
  app.use(`/_/backend/${name}`, router);
  app.use(`/${name}`, router); 
});

app.get(['/_/backend/health', '/health'], (req, res) => res.json({ 
  status: 'ok', 
  mockMode: process.env.MOCK_MODE === 'true',
  initialized: dsInitialized 
}));

// Static Files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, '../../frontend/build')));
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/_/') && !req.url.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, '../../frontend/build/index.html'));
    }
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Local Start (not used on Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 5050;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
