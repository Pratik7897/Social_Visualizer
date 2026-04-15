const express = require('express');
const router = express.Router();
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getGraph } = require('../ds/Graph');

// GET /api/friends/requests - incoming pending requests
router.get('/requests', protect, async (req, res) => {
  try {
    if (process.env.MOCK_MODE === 'true') {
      const { mockQuery, getMockUsers } = require('../mock/mockData');
      const requests = await mockQuery.findFriendships({ recipient: req.user._id, status: 'pending' });
      const mockUsers = await getMockUsers();
      const enrichedRequests = requests.map(r => ({
        ...r,
        requester: mockUsers.find(u => u._id === r.requester)
      }));
      return res.json({ requests: enrichedRequests });
    }

    const requests = await Friendship.find({ recipient: req.user._id, status: 'pending' })
      .populate('requester', 'displayName username avatar bio occupation');
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/friends/sent - outgoing pending requests
router.get('/sent', protect, async (req, res) => {
  try {
    if (process.env.MOCK_MODE === 'true') {
      const { mockQuery, getMockUsers } = require('../mock/mockData');
      const sent = await mockQuery.findFriendships({ requester: req.user._id, status: 'pending' });
      const mockUsers = await getMockUsers();
      const enrichedSent = sent.map(s => ({
        ...s,
        recipient: mockUsers.find(u => u._id === s.recipient)
      }));
      return res.json({ sent: enrichedSent });
    }

    const sent = await Friendship.find({ requester: req.user._id, status: 'pending' })
      .populate('recipient', 'displayName username avatar bio');
    res.json({ sent });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/friends - all accepted friends
router.get('/', protect, async (req, res) => {
  try {
    if (process.env.MOCK_MODE === 'true') {
      const { mockQuery, getMockUsers } = require('../mock/mockData');
      const friendships = await mockQuery.findFriendships({
        $or: [{ requester: req.user._id }, { recipient: req.user._id }],
        status: 'accepted'
      });
      const mockUsers = await getMockUsers();
      const friends = friendships.map(f => {
        const friendId = f.requester.toString() === req.user._id.toString() ? f.recipient.toString() : f.requester.toString();
        const friend = mockUsers.find(u => u._id === friendId);
        return { ...friend, mutualCount: 0, friendshipId: f._id }; // Simplified for mock
      });
      return res.json({ friends });
    }

    const friendships = await Friendship.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted'
    }).populate('requester recipient', 'displayName username avatar bio occupation friendCount');

    const friends = friendships.map(f => {
      const friend = f.requester._id.toString() === req.user._id.toString() ? f.recipient : f.requester;
      const graph = getGraph();
      const mutuals = graph.getMutualFriends(req.user._id.toString(), friend._id.toString());
      return { ...friend.toPublicJSON(), mutualCount: mutuals.length, friendshipId: f._id };
    });

    res.json({ friends });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/request/:userId
router.post('/request/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot friend yourself' });
    }
    if (process.env.MOCK_MODE === 'true') {
      const { getMockUsers, getMockFriendships } = require('../mock/mockData');
      const allUsers = await getMockUsers();
      const target = allUsers.find(u => u._id === userId);
      if (!target) return res.status(404).json({ message: 'User not found' });
      
      const friendships = await getMockFriendships();
      const existing = friendships.find(f => 
        (f.requester === req.user._id && f.recipient === userId) ||
        (f.requester === userId && f.recipient === req.user._id)
      );
      if (existing) return res.status(400).json({ message: 'Request already exists', status: existing.status });
      
      const friendship = { _id: Date.now().toString(), requester: req.user._id, recipient: userId, status: 'pending' };
      friendships.push(friendship);
      return res.status(201).json({ friendship });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: userId },
        { requester: userId, recipient: req.user._id }
      ]
    });
    if (existing) return res.status(400).json({ message: 'Request already exists', status: existing.status });

    const friendship = await Friendship.create({ requester: req.user._id, recipient: userId });
    res.status(201).json({ friendship });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/friends/accept/:friendshipId
router.put('/accept/:friendshipId', protect, async (req, res) => {
  try {
    if (process.env.MOCK_MODE === 'true') {
      const { getMockFriendships } = require('../mock/mockData');
      const friendships = await getMockFriendships();
      const friendship = friendships.find(f => f._id === req.params.friendshipId);
      if (!friendship) return res.status(404).json({ message: 'Request not found' });
      friendship.status = 'accepted';
      const graph = getGraph();
      graph.addFriendship(friendship.requester.toString(), friendship.recipient.toString());
      return res.json({ friendship });
    }

    const friendship = await Friendship.findById(req.params.friendshipId);
    if (!friendship) return res.status(404).json({ message: 'Request not found' });
    if (friendship.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    friendship.status = 'accepted';
    await friendship.save();

    // Update graph - add edge
    const graph = getGraph();
    graph.addFriendship(friendship.requester.toString(), friendship.recipient.toString());

    // Update friend counts
    await User.findByIdAndUpdate(friendship.requester, { $inc: { friendCount: 1 } });
    await User.findByIdAndUpdate(friendship.recipient, { $inc: { friendCount: 1 } });

    res.json({ friendship });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/friends/reject/:friendshipId
router.put('/reject/:friendshipId', protect, async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);
    if (!friendship) return res.status(404).json({ message: 'Not found' });
    if (friendship.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await friendship.deleteOne();
    res.json({ message: 'Request declined' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/friends/unfriend/:userId
router.delete('/unfriend/:userId', protect, async (req, res) => {
  try {
    if (process.env.MOCK_MODE === 'true') {
      const { getMockFriendships } = require('../mock/mockData');
      const friendships = await getMockFriendships();
      const idx = friendships.findIndex(f => 
        (f.requester === req.user._id && f.recipient === req.params.userId) ||
        (f.requester === req.params.userId && f.recipient === req.user._id)
      );
      if (idx === -1) return res.status(404).json({ message: 'Friendship not found' });
      friendships.splice(idx, 1);
      const graph = getGraph();
      graph.removeFriendship(req.user._id.toString(), req.params.userId);
      return res.json({ message: 'Unfriended successfully' });
    }

    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: req.user._id, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.user._id }
      ],
      status: 'accepted'
    });

    if (!friendship) return res.status(404).json({ message: 'Friendship not found' });

    // Update graph - remove edge
    const graph = getGraph();
    graph.removeFriendship(req.user._id.toString(), req.params.userId);

    await User.findByIdAndUpdate(req.user._id, { $inc: { friendCount: -1 } });
    await User.findByIdAndUpdate(req.params.userId, { $inc: { friendCount: -1 } });

    res.json({ message: 'Unfriended successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
