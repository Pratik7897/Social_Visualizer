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

// Mock data for fallback
const mockData = require('./mock/mockData');

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes - Mounted twice for Vercel prefix-agnostic support
const routes = {
  auth: require('./routes/auth'),
  users: require('./routes/users'),
  friends: require('./routes/friends'),
  posts: require('./routes/posts'),
  ds: require('./routes/ds')
};

Object.entries(routes).forEach(([name, router]) => {
  app.use(`/_/backend/${name}`, router);
  app.use(`/${name}`, router); // Fallback for prefix-stripped requests
});

app.get(['/_/backend/health', '/health'], (req, res) => res.json({ status: 'ok', message: 'SocialConnect API running' }));

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, '../../frontend/build')));
}

// 404 Handler for unknown API routes
app.use(['/_/backend/*', '/api/*'], (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

// For any other request, servce index.html (SPA support)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend/build/index.html'));
  });
}

// Connect to MongoDB and initialize data structures
// Connect to MongoDB with a short timeout to fail fast and trigger MOCK_MODE
const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialconnect';

async function initDataStructures(isMock = false) {
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

    console.log(`[DS Init] All data structures ready ${isMock ? '(MOCK MODE)' : '✓'}\n`);
  } catch (err) {
    console.error('[DS Init] Error:', err.message);
  }
}

mongoose.connect(MONGO_URI, { 
  serverSelectionTimeoutMS: 5000 // 5 seconds timeout vs default 30s
})
  .then(async () => {
    console.log('MongoDB connected');
    await initDataStructures();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(async (err) => {
    console.error('MongoDB connection failed:', err.message);
    console.log('>>> STARTING IN MOCK MODE (In-memory only) <<<');
    process.env.MOCK_MODE = 'true';
    await initDataStructures(true);
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (MOCK MODE)`));
  });

module.exports = app;
