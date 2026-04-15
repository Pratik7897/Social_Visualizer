/**
 * AVL TREE IMPLEMENTATION
 * ========================
 * Used for: Efficient user search by name (O(log n) insertion and lookup)
 * The tree stays balanced via rotations, ensuring worst-case O(log n) operations.
 * 
 * Each node stores: { key: username, value: userId, height, left, right }
 * 
 * Why AVL over BST? Regular BST can degrade to O(n) on sorted insertions.
 * AVL guarantees O(log n) by maintaining balance factor |left.height - right.height| <= 1
 */

class AVLNode {
  constructor(key, value) {
    this.key = key.toLowerCase();    // username for comparison
    this.value = value;              // user id
    this.displayName = key;          // original casing for display
    this.height = 1;
    this.left = null;
    this.right = null;
  }
}

class AVLTree {
  constructor() {
    this.root = null;
    this.rotationLog = [];           // track rotations for visualization
  }

  // === HELPER METHODS ===

  height(node) {
    return node ? node.height : 0;
  }

  balanceFactor(node) {
    return node ? this.height(node.left) - this.height(node.right) : 0;
  }

  updateHeight(node) {
    node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
  }

  // === ROTATIONS ===
  // Rotations restore AVL balance property after insertions

  rotateRight(y) {
    const x = y.left;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    this.updateHeight(y);
    this.updateHeight(x);
    this.rotationLog.push({ type: 'RIGHT', node: y.key, pivot: x.key });
    return x;
  }

  rotateLeft(x) {
    const y = x.right;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    this.updateHeight(x);
    this.updateHeight(y);
    this.rotationLog.push({ type: 'LEFT', node: x.key, pivot: y.key });
    return y;
  }

  // === INSERTION ===

  insert(key, value) {
    this.root = this._insert(this.root, key, value);
  }

  _insert(node, key, value) {
    const lowerKey = key.toLowerCase();

    if (!node) return new AVLNode(key, value);

    if (lowerKey < node.key) {
      node.left = this._insert(node.left, key, value);
    } else if (lowerKey > node.key) {
      node.right = this._insert(node.right, key, value);
    } else {
      node.value = value; // update if same key
      return node;
    }

    this.updateHeight(node);

    const balance = this.balanceFactor(node);

    // Left-Left Case → single right rotation
    if (balance > 1 && lowerKey < node.left.key) {
      return this.rotateRight(node);
    }
    // Right-Right Case → single left rotation
    if (balance < -1 && lowerKey > node.right.key) {
      return this.rotateLeft(node);
    }
    // Left-Right Case → left then right rotation
    if (balance > 1 && lowerKey > node.left.key) {
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }
    // Right-Left Case → right then left rotation
    if (balance < -1 && lowerKey < node.right.key) {
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }

    return node;
  }

  // === DELETION ===

  delete(key) {
    this.root = this._delete(this.root, key.toLowerCase());
  }

  _getMinNode(node) {
    let curr = node;
    while (curr.left) curr = curr.left;
    return curr;
  }

  _delete(node, key) {
    if (!node) return null;
    if (key < node.key) {
      node.left = this._delete(node.left, key);
    } else if (key > node.key) {
      node.right = this._delete(node.right, key);
    } else {
      if (!node.left || !node.right) {
        node = node.left || node.right;
      } else {
        const minRight = this._getMinNode(node.right);
        node.key = minRight.key;
        node.value = minRight.value;
        node.displayName = minRight.displayName;
        node.right = this._delete(node.right, minRight.key);
      }
    }
    if (!node) return null;

    this.updateHeight(node);
    const balance = this.balanceFactor(node);

    if (balance > 1 && this.balanceFactor(node.left) >= 0) return this.rotateRight(node);
    if (balance > 1 && this.balanceFactor(node.left) < 0) {
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }
    if (balance < -1 && this.balanceFactor(node.right) <= 0) return this.rotateLeft(node);
    if (balance < -1 && this.balanceFactor(node.right) > 0) {
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }
    return node;
  }

  // === SEARCH ===
  // O(log n) exact search
  search(key) {
    return this._search(this.root, key.toLowerCase());
  }

  _search(node, key) {
    if (!node) return null;
    if (key === node.key) return { key: node.displayName, value: node.value };
    if (key < node.key) return this._search(node.left, key);
    return this._search(node.right, key);
  }

  // Prefix search - finds all users whose names start with prefix
  // Used for real-time search suggestions
  prefixSearch(prefix) {
    const results = [];
    this._prefixSearch(this.root, prefix.toLowerCase(), results);
    return results;
  }

  _prefixSearch(node, prefix, results) {
    if (!node) return;
    if (node.key.startsWith(prefix)) {
      results.push({ key: node.displayName, value: node.value });
    }
    if (prefix <= node.key) this._prefixSearch(node.left, prefix, results);
    if (prefix >= node.key.substring(0, prefix.length)) this._prefixSearch(node.right, prefix, results);
  }

  // Inorder traversal → returns sorted list of all users
  inorder() {
    const result = [];
    this._inorder(this.root, result);
    return result;
  }

  _inorder(node, result) {
    if (!node) return;
    this._inorder(node.left, result);
    result.push({ key: node.displayName, value: node.value, height: node.height, balance: this.balanceFactor(node) });
    this._inorder(node.right, result);
  }

  // Returns tree structure for frontend visualization
  getTreeStructure(node = this.root) {
    if (!node) return null;
    return {
      key: node.displayName,
      value: node.value,
      height: node.height,
      balance: this.balanceFactor(node),
      left: this.getTreeStructure(node.left),
      right: this.getTreeStructure(node.right)
    };
  }

  clearRotationLog() {
    this.rotationLog = [];
  }
}

// Singleton AVL tree instance - rebuilt on server start from DB
let globalAVLTree = new AVLTree();

function buildAVLFromUsers(users) {
  globalAVLTree = new AVLTree();
  users.forEach(user => {
    globalAVLTree.insert(user.username, user._id.toString());
  });
  console.log(`[AVL Tree] Built with ${users.length} users`);
  return globalAVLTree;
}

module.exports = { AVLTree, AVLNode, buildAVLFromUsers, getAVLTree: () => globalAVLTree };
