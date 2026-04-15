# Project Report: Social Connect — Advanced Data Structures Implementation

## 1. Project Overview
**Social Connect** is an advanced social networking simulation designed to demonstrate the real-world application of complex data structures and algorithms. The project focuses on three primary pillars of Advanced Data Structures (ADS): **Self-Balancing Binary Search Trees (AVL)**, **Graph Theory**, and **Multi-way Search Trees (B-Trees)**.

### 1.1 Objective
The primary goal was to implement from-scratch algorithmic logic for efficient user management, social network modeling, and data indexing, providing a visual representation of how these structures mutate and balance in real-time.

---

## 2. Technical Architecture
While the system utilizes a modern web stack (React/Node.js) for visualization, the core "Engine" consists of pure algorithmic implementations that follow C++ logic patterns (Recursion, height balancing, adjacency modeling, and node splitting).

- **Data Persistence**: MongoDB (Storage)
- **Algorithmic Layer**: In-memory Data Structure Singletons (Logic)
- **Visualization**: D3.js and SVG-based rendering.

---

## 3. Implementation of Core Data Structures

### 3.1 AVL Tree (Self-Balancing BST)
**Role**: High-performance Search Index for Usernames.

#### 3.1.1 Implementation Logic
The AVL Tree ensures that the height of the left and right subtrees of any node differs by at most one. This is achieved through four types of rotations:
1. **Left Rotation (RR)**
2. **Right Rotation (LL)**
3. **Left-Right Rotation (LR)**
4. **Right-Left Rotation (RL)**

#### 3.1.2 Complexity Analysis
| Operation | Time Complexity | Space Complexity |
| :--- | :--- | :--- |
| **Search** | $O(\log N)$ | $O(1)$ |
| **Insertion** | $O(\log N)$ | $O(N)$ (Total nodes) |
| **Deletion** | $O(\log N)$ | $O(1)$ |

> [!IMPORTANT]
> **Why AVL?** Unlike a standard BST, the AVL Tree prevents skewness (degeneration into a linked list), ensuring that search operations never exceed $\log N$ height.

---

### 3.2 Graph Theory (Adjacency List)
**Role**: Social Network Modeling (Friendships and Connections).

#### 3.2.1 Representation
The network is modeled as an **Undirected Graph** using an **Adjacency List** (`Map<ID, Set<ID>>`). This approach is memory-efficient for sparse social networks where each user has a limited number of connections.

#### 3.2.2 Algorithms Implemented
- **Breadth-First Search (BFS)**: Used for finding "Friends of Friends" (Level-2 neighbor discovery) and calculating "Degrees of Separation."
- **Depth-First Search (DFS)**: Utilized to identify connected components or communities within the network.
- **Dijkstra's Algorithm**: Implemented to find the absolute **shortest path** between two users in the social network (Minimum Degrees of Connection).

#### 3.2.3 Complexity Analysis
- **Traversal (BFS/DFS)**: $O(V + E)$ where $V$ is vertices and $E$ is edges.
- **Space Complexity**: $O(V + E)$ for adjacency list storage.

---

### 3.3 B-Tree (Order 3 Indexing)
**Role**: Large-scale Post Indexing and Range Queries.

#### 3.3.1 Definition & Properties
A B-Tree is a self-balancing search tree that allows for multi-way searching. In this project, an **Order 3 B-Tree** (2-3 Tree) is used:
- Every node has a maximum of $m-1$ keys (2 keys).
- Every node splits upward once the limit is exceeded.
- All leaves are at the same depth, ensuring perfectly balanced search.

#### 3.3.2 Implementation Highlights
- **Node Splitting**: Once a node reaches 3 keys, it splits, and the median key is promoted to the parent.
- **Range Queries**: Highly efficient for finding all posts within a certain timestamp range (e.g., "Show all posts between Jan 1st and Jan 15th").

---

## 4. Algorithmic Visualization Engine
A key feature of this project is the **Interactive Animation Engine**.
- **Real-time Rotations**: Users can watch as AVL nodes shift during a rotation to maintain balance.
- **Traversal Logs**: A granular step-by-step log shows which nodes are "discovered", "visited", and "processed" during Graph traversals.
- **Split Animation**: Visualizes the B-Tree node splitting and propagation of keys.

---

## 5. Performance Insights
By implementing these structures in-memory as singletons, the Social Connect backend achieves near-instantaneous response times for complex operations:
- **Search Latency**: Extremely low lookup time for users via AVL.
- **Pathfinding**: BFS calculates connection paths for complex graphs in near-constant time.

---

## 6. Conclusion
This project demonstrates that Advanced Data Structures are not just theoretical concepts but the backbone of modern social infrastructure. By implementing AVL, Graphs, and B-Trees from scratch, the project successfully bridges the gap between low-level algorithmic efficiency and high-level software application.
