# Social Connect — Advanced Data Structures Project

A fully functional social network platform built to demonstrate real-world use of **AVL Trees**, **Graphs**, and **B-Trees** in production-grade software.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, D3.js |
| Backend | Node.js, Express 4 |
| Database | MongoDB (via Mongoose) |
| Auth | JWT (jsonwebtoken) |
| Styling | Custom CSS Design System (no UI lib) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Clone and Install

```bash
git clone <repo-url>
cd socialconnect

# Install root tools (concurrently for parallel dev)
npm install

# Install backend and frontend dependencies
npm run install:all
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env if needed (default MongoDB URI works for local Mongo)
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- **10 sample users** with profiles
- **20 accepted friendships** forming a connected graph
- **~15 sample posts** with likes

### 4. Start the Application

```bash
npm run dev
# Backend starts on http://localhost:5000
# Frontend starts on http://localhost:3000
```

### 5. Login

Use any seeded account:
- **Email:** `alex@example.com` · **Password:** `password123`
- **Email:** `priya@example.com` · **Password:** `password123`
- *(or any `name@example.com`)*

---

## Data Structures — Implementation Deep Dive

### 1. AVL Tree (`backend/src/ds/AVLTree.js`)

**Purpose:** Fast user search by username

**How it's used:**
- On server startup, all usernames are inserted into an in-memory AVL tree
- Every new registration inserts the username into the tree
- Search API (`GET /api/users/search?q=`) calls `tree.prefixSearch(query)` to find matching users in **O(log n)**

**Why AVL over regular BST?**
If users are inserted in alphabetical order (A, B, C…), a plain BST degrades to O(n) — a linked list. AVL trees perform rotations after each insertion to maintain balance, guaranteeing O(log n) always.

**Key operations:**
```
Insert: O(log n) — + up to 2 rotations
Search: O(log n) — left/right traversal
Prefix search: O(log n + k) — where k = results
```

**Visualization:** Go to `/search` → type any prefix → see the tree with balance factors shown on each node.

---

### 2. Graph — Adjacency List (`backend/src/ds/Graph.js`)

**Purpose:** Model the social network (users = nodes, friendships = edges)

**How it's used:**
- Entire friendship graph lives in memory as a `Map<userId, Set<userId>>`
- **Accepting a friend request** → adds an edge to the graph
- **Friend suggestions** → BFS from current user, level-2 nodes = "friends of friends"
- **Mutual friends** → set intersection of two adjacency lists
- **Degrees of separation** → BFS shortest path between two users

**Key operations:**
```
Add edge: O(1)
BFS traversal: O(V + E)
Mutual friends: O(deg_A + deg_B)
Shortest path: O(V + E)
```

**Visualization:** Open any profile → click "Connections" tab → interactive D3 force-directed graph. Visit `/ds-viz` → Graph tab → watch BFS/DFS animated step-by-step.

---

### 3. B-Tree — Order 3 (`backend/src/ds/BTree.js`)

**Purpose:** Index posts by timestamp for efficient range queries

**How it's used:**
- On server startup, all posts are inserted into a B-tree keyed by creation timestamp
- New posts trigger an insertion into the tree
- Range query API (`GET /api/posts/range?start=&end=`) uses B-tree range search

**Properties (t = 3):**
- Min keys per node: 2 (except root)
- Max keys per node: 5
- All leaf nodes at same depth
- Splits propagate upward when nodes overflow

**Why B-Tree for posts?**
B-Trees minimize I/O operations — in real databases they're stored on disk with each node = one disk page. Range queries on timestamps (like "last 7 days") are O(log n) to find the start, then sequential reads forward.

**Visualization:** Visit `/ds-viz` → B-Tree tab → see the multi-level tree structure, node capacities, and split log.

---

## Folder Structure

```
socialconnect/
├── backend/
│   ├── src/
│   │   ├── ds/
│   │   │   ├── AVLTree.js      ← Self-balancing BST for user search
│   │   │   ├── Graph.js        ← Adjacency list social graph
│   │   │   └── BTree.js        ← B-Tree for post indexing
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Friendship.js
│   │   │   └── Post.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js        ← Search via AVL tree
│   │   │   ├── friends.js      ← Friend ops update the Graph
│   │   │   ├── posts.js        ← Post ops update the B-Tree
│   │   │   └── ds.js           ← DS visualization endpoints
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── seed/
│   │   │   └── seedData.js
│   │   └── index.js            ← Server + DS initialization
│   └── .env.example
│
└── frontend/
    └── src/
        ├── components/
        │   ├── dsvis/
        │   │   ├── AVLTreeViz.jsx   ← Tree layout algorithm + SVG render
        │   │   ├── GraphViz.jsx     ← D3 force-directed graph
        │   │   └── BTreeViz.jsx     ← Multi-level B-tree SVG
        │   └── layout/
        │       ├── Sidebar.jsx
        │       └── Avatar.jsx
        ├── pages/
        │   ├── AuthPages.jsx
        │   ├── Dashboard.jsx
        │   ├── SearchPage.jsx      ← AVL tree viz + search
        │   ├── FriendsPage.jsx
        │   ├── ProfilePage.jsx     ← Graph viz + mutual friends
        │   └── DSVizPage.jsx       ← Full DS showcase
        ├── hooks/
        │   ├── useAuth.js
        │   └── useToast.js
        ├── utils/
        │   └── api.js
        └── styles/
            └── global.css
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?q=` | **AVL tree** prefix search |
| GET | `/api/users/suggestions` | **Graph BFS** friend suggestions |
| GET | `/api/users/:id` | Profile + mutual friends + degrees of separation |
| GET | `/api/users/:id/graph` | **Graph** adjacency data for visualization |

### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/friends/request/:id` | Send friend request |
| PUT | `/api/friends/accept/:id` | Accept → **adds graph edge** |
| DELETE | `/api/friends/unfriend/:id` | Unfriend → **removes graph edge** |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/feed` | Friend feed |
| POST | `/api/posts` | Create post → **B-tree insert** |
| GET | `/api/posts/range?start=&end=` | **B-tree range query** |
| GET | `/api/posts/btree-stats` | B-tree structure for visualization |

### DS Visualization
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ds/avl` | Full AVL tree structure + inorder + rotation log |
| GET | `/api/ds/graph` | Graph stats + BFS/DFS traversal log |
| GET | `/api/ds/btree` | B-tree structure + split log |
| GET | `/api/ds/bfs/:targetId` | BFS path to specific user |

---

## Features

- **Authentication** — JWT-based login/register with 7-day tokens
- **User Profiles** — bio, occupation, location, friend/post counts
- **Friend System** — send/accept/reject/unfriend with real-time graph updates
- **Feed** — posts from your friend network, with likes
- **Search** — AVL tree powered prefix search with live tree visualization
- **Connection Graph** — D3 force-directed visualization of your network
- **Mutual Friends** — set intersection algorithm, shown on profiles
- **Degrees of Separation** — BFS shortest path between any two users
- **Friend Suggestions** — BFS level-2 ranked by mutual count
- **DS Visualizer** — dedicated page showing all 3 data structures live
  - AVL tree with balance factors + rotation log
  - Graph with animated BFS/DFS step-through
  - B-tree with node capacity + split log

---

## Design Decisions

- **In-memory DS + MongoDB:** The data structures are rebuilt from MongoDB on startup and kept in memory for O(log n) / O(1) operations. MongoDB handles persistence.
- **Singleton pattern:** Each DS (AVL, Graph, BTree) is exported as a singleton that routes share — no re-initialization per request.
- **Graph mutation on friend ops:** When a friendship is accepted or deleted, the route handler immediately mutates the in-memory graph — no rebuild needed.
- **AVL over Red-Black:** AVL trees are slightly faster for lookups (stricter balance), which matters for a search index where reads >> writes.

---

*Built for Advanced Data Structures course. All data structure implementations are from scratch with no external DS libraries.*
