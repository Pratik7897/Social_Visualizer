/**
 * GRAPH DATA STRUCTURE (Adjacency List)
 * =======================================
 * Used for: Modeling the social network
 * - Nodes = Users
 * - Edges = Friend connections (undirected)
 * 
 * Operations:
 * - addUser(id)           → O(1)
 * - addFriendship(a, b)   → O(1)
 * - removeFriendship(a,b) → O(degree)
 * - BFS(source)           → O(V+E) - used for "people you may know" suggestions
 * - DFS(source)           → O(V+E) - used for connection path finding
 * - mutualFriends(a, b)   → O(degree_a + degree_b)
 * - shortestPath(a, b)    → O(V+E) via BFS - degrees of separation
 */

class SocialGraph {
  constructor() {
    // adjacencyList: Map<userId, Set<userId>>
    this.adjacencyList = new Map();
    this.nodeCount = 0;
    this.edgeCount = 0;
  }

  // Add a user node to the graph
  addUser(userId) {
    const id = userId.toString();
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, new Set());
      this.nodeCount++;
    }
  }

  // Remove a user and all their connections
  removeUser(userId) {
    const id = userId.toString();
    if (!this.adjacencyList.has(id)) return;
    // Remove this user from all neighbor sets
    this.adjacencyList.get(id).forEach(neighborId => {
      const neighbors = this.adjacencyList.get(neighborId);
      if (neighbors) {
        neighbors.delete(id);
        this.edgeCount--;
      }
    });
    this.adjacencyList.delete(id);
    this.nodeCount--;
  }

  // Add undirected friendship edge
  addFriendship(userId1, userId2) {
    const a = userId1.toString();
    const b = userId2.toString();
    if (!this.adjacencyList.has(a)) this.addUser(a);
    if (!this.adjacencyList.has(b)) this.addUser(b);
    if (!this.adjacencyList.get(a).has(b)) {
      this.adjacencyList.get(a).add(b);
      this.adjacencyList.get(b).add(a);
      this.edgeCount++;
    }
  }

  // Remove friendship edge
  removeFriendship(userId1, userId2) {
    const a = userId1.toString();
    const b = userId2.toString();
    if (this.adjacencyList.has(a)) this.adjacencyList.get(a).delete(b);
    if (this.adjacencyList.has(b)) this.adjacencyList.get(b).delete(a);
    this.edgeCount = Math.max(0, this.edgeCount - 1);
  }

  // Check if two users are friends
  areFriends(userId1, userId2) {
    const a = userId1.toString();
    const b = userId2.toString();
    return this.adjacencyList.has(a) && this.adjacencyList.get(a).has(b);
  }

  // Get all friends of a user
  getFriends(userId) {
    const id = userId.toString();
    if (!this.adjacencyList.has(id)) return [];
    return Array.from(this.adjacencyList.get(id));
  }

  // Get degree (number of friends)
  getDegree(userId) {
    const id = userId.toString();
    return this.adjacencyList.has(id) ? this.adjacencyList.get(id).size : 0;
  }

  /**
   * BFS TRAVERSAL
   * -------------
   * Used for: "People You May Know" suggestions and finding connection paths
   * Returns layers of connections: level 1 = direct friends, level 2 = friends of friends, etc.
   */
  bfs(startId, maxDepth = 3) {
    const start = startId.toString();
    if (!this.adjacencyList.has(start)) return { visited: [], layers: [], traversalLog: [] };

    const visited = new Set([start]);
    const traversalLog = []; // for visualization
    const layers = []; // layers[i] = nodes at depth i
    const parent = new Map();

    // Standard queue-based BFS modified for level-batch log generation
    let currentLevel = [start];
    let depth = 0;

    // Log the initial start node discovery/visit if desired
    traversalLog.push({ node: start, depth: 0, action: 'visit' });

    while (currentLevel.length > 0 && depth < maxDepth) {
      const nextLevel = [];
      const currentLevelNodes = [...currentLevel];
      
      // Store current layer (excluding layer 0)
      if (depth > 0) {
        layers[depth - 1] = currentLevelNodes;
      }

      // For every node in the current level, find its neighbors
      for (const id of currentLevelNodes) {
        const neighbors = Array.from(this.adjacencyList.get(id) || new Set()).sort();
        
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            parent.set(neighbor, id);
            nextLevel.push(neighbor);
            
            // Record discovery (enqueue) for the visualizer
            traversalLog.push({ node: neighbor, depth: depth + 1, action: 'enqueue', from: id });
          }
        }
      }

      // After ALL neighbors of the current level are discovered, 
      // we move to visiting them in the next iteration.
      // Now record "visit" for all nodes we just discovered
      for (const nextNode of nextLevel) {
        traversalLog.push({ node: nextNode, depth: depth + 1, action: 'visit' });
      }

      currentLevel = nextLevel;
      depth++;
      
      // Update the layers for the final discovered set
      if (depth > 0 && currentLevel.length > 0) {
        layers[depth - 1] = currentLevel;
      }
    }

    return {
      visited: Array.from(visited).filter(id => id !== start),
      layers: layers,
      traversalLog,
      parent: Object.fromEntries(parent)
    };
  }


  /**
   * DFS TRAVERSAL
   * -------------
   * Used for: Finding all connected components, detecting clusters
   * Returns: DFS path and stack operations for visualization
   */
  dfs(startId, maxDepth = 4) {
    const start = startId.toString();
    if (!this.adjacencyList.has(start)) return { visited: [], traversalLog: [] };

    const visited = new Set();
    const traversalLog = [];
    const stack = [];

    const dfsRecursive = (id, depth) => {
      if (depth > maxDepth || visited.has(id)) return;
      visited.add(id);
      stack.push(id);
      traversalLog.push({ node: id, depth, action: 'visit', stack: [...stack] });

      const neighbors = Array.from(this.adjacencyList.get(id) || []).sort();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          traversalLog.push({ node: neighbor, depth: depth + 1, action: 'explore', from: id, stack: [...stack] });
          dfsRecursive(neighbor, depth + 1);
        }
      }
      stack.pop();
      traversalLog.push({ node: id, depth, action: 'backtrack', stack: [...stack] });
    };

    dfsRecursive(start, 0);
    return {
      visited: Array.from(visited).filter(id => id !== start),
      traversalLog
    };
  }

  /**
   * SHORTEST PATH (BFS-based)
   * --------------------------
   * Used for: Showing "X and Y are N degrees apart" feature
   * Returns the actual path and degrees of separation
   */
  shortestPath(sourceId, targetId) {
    const source = sourceId.toString();
    const target = targetId.toString();

    if (!this.adjacencyList.has(source) || !this.adjacencyList.has(target)) {
      return { path: [], distance: -1 };
    }
    if (source === target) return { path: [source], distance: 0 };

    const visited = new Set([source]);
    const queue = [source];
    const parent = new Map();

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = Array.from(this.adjacencyList.get(current) || new Set()).sort();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
          if (neighbor === target) {
            // Reconstruct path
            const path = [];
            let curr = target;
            while (curr) {
              path.unshift(curr);
              curr = parent.get(curr);
            }
            return { path, distance: path.length - 1 };
          }
        }
      }
    }
    return { path: [], distance: -1 }; // not connected
  }

  /**
   * MUTUAL FRIENDS
   * ---------------
   * Used for: "X mutual friends" on profile cards, friend suggestions
   * Set intersection of two adjacency lists
   */
  getMutualFriends(userId1, userId2) {
    const a = userId1.toString();
    const b = userId2.toString();
    const friendsA = this.adjacencyList.get(a) || new Set();
    const friendsB = this.adjacencyList.get(b) || new Set();
    const mutual = [];
    for (const id of friendsA) {
      if (friendsB.has(id)) mutual.push(id);
    }
    return mutual;
  }

  /**
   * FRIEND SUGGESTIONS
   * -------------------
   * Uses BFS level-2 nodes (friends of friends) not already friends with user
   * Ranked by mutual friend count
   */
  getFriendSuggestions(userId, limit = 10) {
    const id = userId.toString();
    const { layers } = this.bfs(id, 2);
    const directFriends = this.adjacencyList.get(id) || new Set();

    const suggestions = new Map(); // candidateId → mutualCount

    // Level 2 nodes are the best suggestions (friends of friends)
    const candidates = layers[1] || [];
    for (const candidate of candidates) {
      if (candidate !== id && !directFriends.has(candidate)) {
        const mutual = this.getMutualFriends(id, candidate);
        suggestions.set(candidate, mutual.length);
      }
    }

    return Array.from(suggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([candidateId, mutualCount]) => ({ userId: candidateId, mutualCount }));
  }

  // Export graph as adjacency list for visualization
  getGraphData(centerUserId, depth = 2) {
    const center = centerUserId.toString();
    const { visited, layers, traversalLog } = this.bfs(center, depth);
    const nodeIds = new Set([center, ...visited]);
    const nodes = [];
    const edges = [];
    const edgeSet = new Set();

    for (const nodeId of nodeIds) {
      nodes.push({ id: nodeId, depth: nodeId === center ? 0 : (layers.findIndex(l => l.includes(nodeId)) + 1) });
    }

    for (const nodeId of nodeIds) {
      const neighbors = this.adjacencyList.get(nodeId) || new Set();
      for (const neighborId of neighbors) {
        if (nodeIds.has(neighborId)) {
          const edgeKey = [nodeId, neighborId].sort().join('-');
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({ source: nodeId, target: neighborId });
          }
        }
      }
    }

    return { nodes, edges, traversalLog };
  }

  // Stats for dashboard
  getStats() {
    return {
      totalUsers: this.nodeCount,
      totalFriendships: this.edgeCount,
      avgFriendsPerUser: this.nodeCount > 0 ? (this.edgeCount * 2 / this.nodeCount).toFixed(2) : 0
    };
  }
}

// Singleton graph instance
let globalGraph = new SocialGraph();

function buildGraphFromFriendships(users, friendships) {
  globalGraph = new SocialGraph();
  users.forEach(user => globalGraph.addUser(user._id.toString()));
  friendships.forEach(f => {
    if (f.status === 'accepted') {
      globalGraph.addFriendship(f.requester.toString(), f.recipient.toString());
    }
  });
  console.log(`[Graph] Built: ${globalGraph.nodeCount} users, ${globalGraph.edgeCount} friendships`);
  return globalGraph;
}

module.exports = { SocialGraph, buildGraphFromFriendships, getGraph: () => globalGraph };
