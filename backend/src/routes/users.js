const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const { protect } = require('../middleware/auth');
const { getAVLTree } = require('../ds/AVLTree');
const { getGraph } = require('../ds/Graph');

// GET /api/users/search?q=name
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json({ users: [], avlTree: null });

    const tree = getAVLTree();
    const avlResults = tree.prefixSearch(q);
    const avlTreeStructure = tree.getTreeStructure();

    const userIds = avlResults.map(r => r.value).filter(id => id !== req.user._id.toString());
    
    let users;
    if (process.env.MOCK_MODE === 'true') {
      const { mockQuery } = require('../mock/mockData');
      users = await mockQuery.findUsers({ _id: { $in: userIds } });
    } else {
      users = await User.find({ _id: { $in: userIds } }).select('-password');
    }

    const graph = getGraph();
    const usersWithMutuals = users.map(u => {
      const mutual = graph.getMutualFriends(req.user._id.toString(), u._id.toString());
      return { ...(u.toPublicJSON ? u.toPublicJSON() : u), mutualCount: mutual.length };
    });

    res.json({
      users: usersWithMutuals,
      avlTree: avlTreeStructure,
      searchPath: q,
      resultCount: avlResults.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/suggestions
router.get('/suggestions', protect, async (req, res) => {
  try {
    const graph = getGraph();
    const suggestions = graph.getFriendSuggestions(req.user._id.toString(), 8);
    const userIds = suggestions.map(s => s.userId);
    
    let users;
    if (process.env.MOCK_MODE === 'true') {
      const { mockQuery } = require('../mock/mockData');
      users = await mockQuery.findUsers({ _id: { $in: userIds } });
    } else {
      users = await User.find({ _id: { $in: userIds } }).select('-password');
    }

    const suggestionsWithData = suggestions.map(s => {
      const user = users.find(u => (u._id?.toString() || u._id) === s.userId);
      const publicUser = user ? (user.toPublicJSON ? user.toPublicJSON() : user) : null;
      return publicUser ? { ...publicUser, mutualCount: s.mutualCount } : null;
    }).filter(Boolean);

    res.json({ suggestions: suggestionsWithData });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const graph = getGraph();
    let user, mutualUsers, friendship;
    
    if (process.env.MOCK_MODE === 'true') {
      const { mockQuery, getMockUsers } = require('../mock/mockData');
      const allUsers = await getMockUsers();
      user = allUsers.find(u => u._id === req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      const mutuals = graph.getMutualFriends(req.user._id.toString(), req.params.id);
      mutualUsers = allUsers.filter(u => mutuals.includes(u._id));
      
      const friendships = await mockQuery.findFriendships({
        $or: [
          { requester: req.user._id, recipient: req.params.id },
          { requester: req.params.id, recipient: req.user._id }
        ]
      });
      friendship = friendships[0];
    } else {
      user = await User.findById(req.params.id).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      const mutuals = graph.getMutualFriends(req.user._id.toString(), req.params.id);
      mutualUsers = await User.find({ _id: { $in: mutuals } }).select('displayName username avatar');
      friendship = await Friendship.findOne({
        $or: [
          { requester: req.user._id, recipient: req.params.id },
          { requester: req.params.id, recipient: req.user._id }
        ]
      });
    }

    const pathResult = graph.shortestPath(req.user._id.toString(), req.params.id);

    res.json({
      user: user.toPublicJSON ? user.toPublicJSON() : user,
      mutualFriends: mutualUsers.map(u => u.toPublicJSON ? u.toPublicJSON() : u),
      mutualCount: mutualUsers.length,
      friendshipStatus: friendship ? friendship.status : null,
      isRequester: friendship ? (friendship.requester.toString() === req.user._id.toString()) : null,
      degreesOfSeparation: pathResult.distance,
      connectionPath: pathResult.path
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/friends
router.get('/:id/friends', protect, async (req, res) => {
  try {
    let friendships, friends;
    if (process.env.MOCK_MODE === 'true') {
      const { mockQuery, getMockUsers } = require('../mock/mockData');
      friendships = await mockQuery.findFriendships({
        $or: [{ requester: req.params.id }, { recipient: req.params.id }],
        status: 'accepted'
      });
      const allUsers = await getMockUsers();
      const friendIds = friendships.map(f =>
        f.requester.toString() === req.params.id ? f.recipient.toString() : f.requester.toString()
      );
      friends = allUsers.filter(u => friendIds.includes(u._id));
    } else {
      friendships = await Friendship.find({
        $or: [{ requester: req.params.id }, { recipient: req.params.id }],
        status: 'accepted'
      });
      const friendIds = friendships.map(f =>
        f.requester.toString() === req.params.id ? f.recipient : f.requester
      );
      friends = await User.find({ _id: { $in: friendIds } }).select('-password');
    }
    res.json({ friends: friends.map(f => f.toPublicJSON ? f.toPublicJSON() : f) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/graph
router.get('/:id/graph', protect, async (req, res) => {
  try {
    const graph = getGraph();
    const graphData = graph.getGraphData(req.params.id, 2);
    const nodeIds = graphData.nodes.map(n => n.id);
    
    let users;
    if (process.env.MOCK_MODE === 'true') {
      const { getMockUsers } = require('../mock/mockData');
      const allUsers = await getMockUsers();
      users = allUsers.filter(u => nodeIds.includes(u._id));
    } else {
      users = await User.find({ _id: { $in: nodeIds } }).select('displayName username avatar');
    }

    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const enrichedNodes = graphData.nodes.map(n => ({
      ...n,
      displayName: userMap[n.id]?.displayName || 'Unknown',
      username: userMap[n.id]?.username || '',
      isCenter: n.id === req.params.id
    }));

    res.json({ ...graphData, nodes: enrichedNodes });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
