const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAVLTree } = require('../ds/AVLTree');
const { getGraph } = require('../ds/Graph');
const { getBTree } = require('../ds/BTree');

// GET /api/ds/avl - AVL tree full structure + stats
router.get('/avl', protect, (req, res) => {
  const tree = getAVLTree();
  const inorderList = tree.inorder();
  res.json({
    tree: tree.getTreeStructure(),
    inorder: inorderList,
    totalNodes: inorderList.length,
    rotationLog: tree.rotationLog.slice(-20),
    description: 'AVL Self-Balancing BST used for O(log n) user search by username'
  });
});

// GET /api/ds/graph - Graph stats and traversal
router.get('/graph', protect, async (req, res) => {
  const graph = getGraph();
  const userId = req.user._id.toString();

  const bfsResult = graph.bfs(userId, 3);
  const dfsResult = graph.dfs(userId, 3);
  const graphData = graph.getGraphData(userId, 2);

  res.json({
    stats: graph.getStats(),
    bfs: bfsResult,
    dfs: dfsResult,
    graphData,
    description: 'Adjacency-list Graph representing friendship connections'
  });
});

// GET /api/ds/btree - B-Tree structure
router.get('/btree', protect, (req, res) => {
  const btree = getBTree();
  res.json({
    structure: btree.getTreeStructure(),
    stats: btree.getStats(),
    splitLog: btree.splitLog.slice(-20),
    description: 'B-Tree (order 3) indexing posts by timestamp for O(log n) range queries'
  });
});

// GET /api/ds/bfs/:targetId - BFS path from current user to target
router.get('/bfs/:targetId', protect, (req, res) => {
  const graph = getGraph();
  const result = graph.shortestPath(req.user._id.toString(), req.params.targetId);
  const bfsResult = graph.bfs(req.user._id.toString(), 4);
  res.json({ shortestPath: result, bfsTraversal: bfsResult });
});

module.exports = router;
