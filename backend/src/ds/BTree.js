/**
 * B-TREE IMPLEMENTATION (Order t = 3, so max 2t-1 = 5 keys per node)
 * =====================================================================
 * Used for: Efficient indexing and range queries on posts by timestamp
 * - Insert post: O(log n)
 * - Search post by time range: O(log n + k) where k = results
 * - Range query [t1, t2]: O(log n + k)
 * 
 * B-Trees are ideal for disk-backed storage as they minimize I/O operations
 * by keeping many keys per node. In-memory, they're used here for
 * demonstration of their properties with post indexing.
 * 
 * ORDER t = 3:
 * - Each non-root node has at least t-1 = 2 keys
 * - Each node has at most 2t-1 = 5 keys
 * - Each internal node has at most 2t = 6 children
 */

const T = 3; // minimum degree

class BTreeNode {
  constructor(isLeaf = true) {
    this.keys = [];      // [{ timestamp, postId }] sorted by timestamp
    this.children = [];  // child BTreeNodes
    this.isLeaf = isLeaf;
    this.n = 0;          // current number of keys
  }
}

class BTree {
  constructor() {
    this.root = new BTreeNode(true);
    this.size = 0;
    this.splitLog = []; // track splits for visualization
  }

  // === SEARCH ===
  // O(log n) - find a post by exact timestamp
  search(timestamp, node = this.root) {
    let i = 0;
    while (i < node.n && timestamp > node.keys[i].timestamp) i++;
    if (i < node.n && timestamp === node.keys[i].timestamp) {
      return { found: true, node, index: i, data: node.keys[i] };
    }
    if (node.isLeaf) return { found: false };
    return this.search(timestamp, node.children[i]);
  }

  // Range search: find all posts in [startTime, endTime]
  rangeSearch(startTime, endTime) {
    const results = [];
    this._rangeSearch(this.root, startTime, endTime, results);
    return results;
  }

  _rangeSearch(node, startTime, endTime, results) {
    let i = 0;
    while (i < node.n && node.keys[i].timestamp < startTime) i++;

    while (i < node.n && node.keys[i].timestamp <= endTime) {
      if (!node.isLeaf) {
        this._rangeSearch(node.children[i], startTime, endTime, results);
      }
      results.push(node.keys[i]);
      i++;
    }

    if (!node.isLeaf && i < node.children.length) {
      this._rangeSearch(node.children[i], startTime, endTime, results);
    }
  }

  // === INSERTION ===
  insert(timestamp, postId, metadata = {}) {
    const root = this.root;
    if (root.n === 2 * T - 1) {
      // Root is full - split it
      const newRoot = new BTreeNode(false);
      newRoot.children.push(this.root);
      this._splitChild(newRoot, 0);
      this.root = newRoot;
      this.splitLog.push({ type: 'root_split', timestamp });
    }
    this._insertNonFull(this.root, timestamp, postId, metadata);
    this.size++;
  }

  _insertNonFull(node, timestamp, postId, metadata) {
    let i = node.n - 1;
    if (node.isLeaf) {
      // Find position and shift keys right
      const newKey = { timestamp, postId, ...metadata };
      node.keys.push(null); // make room
      while (i >= 0 && timestamp < node.keys[i].timestamp) {
        node.keys[i + 1] = node.keys[i];
        i--;
      }
      node.keys[i + 1] = newKey;
      node.n++;
    } else {
      // Find child to descend into
      while (i >= 0 && timestamp < node.keys[i].timestamp) i--;
      i++;
      if (node.children[i].n === 2 * T - 1) {
        this._splitChild(node, i);
        this.splitLog.push({ type: 'node_split', timestamp, level: 'internal' });
        if (timestamp > node.keys[i].timestamp) i++;
      }
      this._insertNonFull(node.children[i], timestamp, postId, metadata);
    }
  }

  _splitChild(parent, i) {
    const t = T;
    const fullChild = parent.children[i];
    const newChild = new BTreeNode(fullChild.isLeaf);

    newChild.n = t - 1;
    for (let j = 0; j < t - 1; j++) {
      newChild.keys[j] = fullChild.keys[j + t];
    }
    if (!fullChild.isLeaf) {
      for (let j = 0; j < t; j++) {
        newChild.children[j] = fullChild.children[j + t];
      }
    }

    const promotedKey = fullChild.keys[t - 1];
    fullChild.n = t - 1;
    fullChild.keys.splice(t - 1);
    if (!fullChild.isLeaf) fullChild.children.splice(t);

    parent.children.splice(i + 1, 0, newChild);
    parent.keys.splice(i, 0, promotedKey);
    parent.n++;
  }

  // Get all entries in sorted order (inorder traversal)
  getAllSorted() {
    const results = [];
    this._inorder(this.root, results);
    return results;
  }

  _inorder(node, results) {
    for (let i = 0; i < node.n; i++) {
      if (!node.isLeaf) this._inorder(node.children[i], results);
      results.push(node.keys[i]);
    }
    if (!node.isLeaf) this._inorder(node.children[node.n], results);
  }

  // Get tree structure for visualization
  getTreeStructure() {
    return this._getStructure(this.root, 0);
  }

  _getStructure(node, level) {
    const result = {
      level,
      isLeaf: node.isLeaf,
      keys: node.keys.map(k => ({ timestamp: k.timestamp, postId: k.postId, title: k.title || '' })),
      children: []
    };
    if (!node.isLeaf) {
      for (const child of node.children) {
        result.children.push(this._getStructure(child, level + 1));
      }
    }
    return result;
  }

  // Stats for visualization
  getStats() {
    let nodeCount = 0;
    let leafCount = 0;
    let height = 0;

    const traverse = (node, depth) => {
      nodeCount++;
      height = Math.max(height, depth);
      if (node.isLeaf) { leafCount++; return; }
      node.children.forEach(child => traverse(child, depth + 1));
    };

    traverse(this.root, 1);
    return { totalPosts: this.size, nodeCount, leafCount, height, order: T, maxKeysPerNode: 2 * T - 1 };
  }

  clearSplitLog() {
    this.splitLog = [];
  }
}

// Singleton B-Tree instance
let globalBTree = new BTree();

function buildBTreeFromPosts(posts) {
  globalBTree = new BTree();
  // Sort posts by creation time and insert into B-tree
  const sorted = [...posts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  sorted.forEach(post => {
    globalBTree.insert(
      new Date(post.createdAt).getTime(),
      post._id.toString(),
      { title: post.content.substring(0, 30), authorId: post.author.toString() }
    );
  });
  console.log(`[B-Tree] Built with ${posts.length} posts`);
  return globalBTree;
}

module.exports = { BTree, BTreeNode, buildBTreeFromPosts, getBTree: () => globalBTree };
