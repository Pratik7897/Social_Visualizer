const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const { protect } = require('../middleware/auth');
const { getBTree } = require('../ds/BTree');

// GET /api/posts/feed - posts from friends + self
router.get('/feed', protect, async (req, res) => {
  try {
    if (process.env.MOCK_MODE === 'true') {
      const { mockQuery } = require('../mock/mockData');
      const friendships = await mockQuery.findFriendships({
        $or: [{ requester: req.user._id }, { recipient: req.user._id }],
        status: 'accepted'
      });
      const friendIds = friendships.map(f =>
        f.requester.toString() === req.user._id.toString() ? f.recipient.toString() : f.requester.toString()
      );
      friendIds.push(req.user._id.toString());
      const posts = await mockQuery.findPosts({ author: { $in: friendIds } });
      
      // Expand author data for mock
      const mockUsers = await require('../mock/mockData').getMockUsers();
      const enrichedPosts = posts.map(p => ({
        ...p,
        author: mockUsers.find(u => u._id === p.author)
      }));

      return res.json({ posts: enrichedPosts });
    }

    const friendships = await Friendship.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted'
    });

    const friendIds = friendships.map(f =>
      f.requester.toString() === req.user._id.toString() ? f.recipient : f.requester
    );
    friendIds.push(req.user._id);

    const posts = await Post.find({ author: { $in: friendIds } })
      .populate('author', 'displayName username avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/btree-stats - B-Tree structure for visualization
router.get('/btree-stats', protect, (req, res) => {
  const btree = getBTree();
  res.json({
    structure: btree.getTreeStructure(),
    stats: btree.getStats(),
    recentPosts: btree.getAllSorted().slice(-10).reverse()
  });
});

// GET /api/posts/range?start=timestamp&end=timestamp
// B-Tree range query demonstration
router.get('/range', protect, async (req, res) => {
  try {
    const { start, end } = req.query;
    const btree = getBTree();
    const results = btree.rangeSearch(parseInt(start), parseInt(end));
    const postIds = results.map(r => r.postId);

    if (process.env.MOCK_MODE === 'true') {
      const { getMockPosts, getMockUsers } = require('../mock/mockData');
      const allPosts = await getMockPosts();
      const mockUsers = await getMockUsers();
      const posts = allPosts.filter(p => postIds.includes(p._id))
        .map(p => ({ ...p, author: mockUsers.find(u => u._id === p.author) }));
      return res.json({ posts, btreeResults: results, count: results.length });
    }

    const posts = await Post.find({ _id: { $in: postIds } })
      .populate('author', 'displayName username avatar')
      .sort({ createdAt: -1 });
    res.json({ posts, btreeResults: results, count: results.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/user/:userId
router.get('/user/:userId', protect, async (req, res) => {
  try {
    if (process.env.MOCK_MODE === 'true') {
      const { mockQuery } = require('../mock/mockData');
      const posts = await mockQuery.findPosts({ author: req.params.userId });
      return res.json({ posts });
    }

    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'displayName username avatar')
      .sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) {
    console.error('[Get User Posts Error]:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// POST /api/posts
router.post('/', protect, async (req, res) => {
  try {
    const { content, tags } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content required' });
    }

    if (process.env.MOCK_MODE === 'true') {
      const { mockMutations } = require('../mock/mockData');
      const post = await mockMutations.addPost(req.user._id, content.trim(), tags);
      
      // Still update B-Tree if possible
      const btree = getBTree();
      btree.insert(new Date(post.createdAt).getTime(), post._id, {
        title: post.content.substring(0, 30),
        authorId: req.user._id.toString()
      });

      return res.status(201).json({ post });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      tags: tags || []
    });
    await post.populate('author', 'displayName username avatar');

    // Insert into B-Tree index
    const btree = getBTree();
    btree.insert(new Date(post.createdAt).getTime(), post._id.toString(), {
      title: post.content.substring(0, 30),
      authorId: req.user._id.toString()
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { postCount: 1 } });

    res.status(201).json({ post });
  } catch (err) {
    console.error('[Create Post Error]:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// POST /api/posts/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    if (process.env.MOCK_MODE === 'true') {
      const { mockMutations } = require('../mock/mockData');
      const result = await mockMutations.likePost(req.params.id, req.user._id);
      if (!result) return res.status(404).json({ message: 'Post not found' });
      return res.json(result);
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isLiked = post.likes.includes(req.user._id);
    if (isLiked) {
      post.likes.pull(req.user._id);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(req.user._id);
      post.likeCount++;
    }
    await post.save();
    res.json({ liked: !isLiked, likeCount: post.likeCount });
  } catch (err) {
    console.error('[Like Post Error]:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (process.env.MOCK_MODE === 'true') {
      const { mockMutations } = require('../mock/mockData');
      const success = await mockMutations.deletePost(req.params.id, req.user._id);
      if (!success) return res.status(404).json({ message: 'Post not found or unauthorized' });
      return res.json({ message: 'Post deleted' });
    }

    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ message: 'Post not found or unauthorized' });
    await post.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { postCount: -1 } });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('[Delete Post Error]:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
