const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAVLTree } = require('../ds/AVLTree');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, displayName, email, password, bio, occupation, location } = req.body;

    if (process.env.MOCK_MODE === 'true') {
      const { getMockUsers } = require('../mock/mockData');
      const mockUsers = await getMockUsers();
      const newUser = {
        _id: (mockUsers.length + 1).toString(),
        username,
        displayName,
        email,
        password,
        bio: bio || '',
        occupation: occupation || '',
        location: location || '',
        friendCount: 0,
        postCount: 0
      };
      
      const userObj = {
        ...newUser,
        toPublicJSON() { return { _id: this._id, username: this.username, displayName: this.displayName, email: this.email, bio: this.bio, occupation: this.occupation, location: this.location, friendCount: this.friendCount, postCount: this.postCount }; }
      };
      
      return res.status(201).json({
        token: generateToken(userObj._id),
        user: userObj.toPublicJSON()
      });
    }

    const user = await User.create({ username, displayName, email, password, bio: bio || '', occupation: occupation || '', location: location || '' });

    // Insert into AVL tree for fast search
    getAVLTree().insert(user.username, user._id.toString());

    res.status(201).json({
      token: generateToken(user._id),
      user: user.toPublicJSON()
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (process.env.MOCK_MODE === 'true') {
      const mockUsers = await require('../mock/mockData').getMockUsers();
      const user = mockUsers.find(u => u.email === email);
      if (user && user.comparePassword(password)) {
        return res.json({ token: generateToken(user._id), user: user.toPublicJSON() });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({
      token: generateToken(user._id),
      user: user.toPublicJSON()
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// GET /api/auth/me
const { protect } = require('../middleware/auth');
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

module.exports = router;
