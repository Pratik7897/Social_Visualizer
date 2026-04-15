import React, { useState, useEffect } from 'react';
import { dsAPI, postsAPI } from '../utils/api';
import AVLTreeViz from '../components/dsvis/AVLTreeViz';
import GraphViz from '../components/dsvis/GraphViz';
import BTreeViz from '../components/dsvis/BTreeViz';
import { useAuth } from '../hooks/useAuth';

const DS_INFO = {
  avl: {
    name: 'AVL Tree',
    color: '#C17F4A',
    light: '#F5E6D3',
    complexity: 'O(log n)',
    usage: 'User search engine',
    description: 'Self-balancing BST. Every insertion triggers rotations to keep height ≤ log₂(n). Used for prefix-search over usernames.',
    properties: ['Height balanced: |BF| ≤ 1', 'Search: O(log n)', 'Insert: O(log n)', 'Rotations keep tree balanced'],
  },
  graph: {
    name: 'Graph (Adjacency List)',
    color: '#3D7A6F',
    light: '#D6EDEA',
    complexity: 'O(V + E)',
    usage: 'Social network',
    description: 'Undirected graph via adjacency list. BFS finds friend suggestions (level 2 nodes). DFS traverses connected components.',
    properties: ['Undirected, unweighted', 'BFS: people you may know', 'DFS: connected components', 'Shortest path: degrees of separation'],
  },
  btree: {
    name: 'B-Tree (Order 3)',
    color: '#C4635A',
    light: '#F5E0DE',
    complexity: 'O(log n)',
    usage: 'Post index',
    description: 'Balanced multi-way tree (t=3, max 5 keys/node). Posts indexed by timestamp. Enables range queries like "posts from last week".',
    properties: ['Min 2 keys, max 5 keys per node', 'All leaves same depth', 'Range queries: O(log n + k)', 'Splits propagate upward'],
  },
};

export default function DSVizPage() {
  const { user } = useAuth();
  const currentUserId = user?.id?.toString();
  const [tab, setTab] = useState('avl');
  const [avlData, setAvlData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [btreeData, setBtreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bfsTarget, setBfsTarget] = useState('');
  const [bfsResult, setBfsResult] = useState(null);
  const [traversalMode, setTraversalMode] = useState('bfs');
  const [traversalStep, setTraversalStep] = useState(0);
  const [traversalPlaying, setTraversalPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState({}); // id -> user data mapping
  const [dijkstraFrom, setDijkstraFrom] = useState('');
  const [dijkstraTo, setDijkstraTo] = useState('');
  const [dijkstraResult, setDijkstraResult] = useState('');
  const [showInfo, setShowInfo] = useState(true);

  const animationDelay = 600 / speed;

  useEffect(() => {
    loadData(tab);
  }, [tab]);

  const loadData = async (t) => {
    setLoading(true);
    try {
      if (t === 'avl') {
        const res = await dsAPI.getAVL();
        if (res.data.inorder) {
          const userMap = {};
          res.data.inorder.forEach(u => { 
            // AVL inorder returns { key: username, value: userId }
            const uid = u.value?.toString();
            if (uid) userMap[uid] = { id: uid, username: u.key, displayName: u.key }; 
          });
          console.log(`[DSViz] Loaded ${Object.keys(userMap).length} users into map`);
          setAllUsers(userMap);
          setAvlData(res.data);
          const shuffled = [...res.data.inorder].sort(() => 0.5 - Math.random()).slice(0, 15);
          setPendingUsers(shuffled.map(n => n.key));
        }
      } else if (t === 'graph') {
        const res = await dsAPI.getGraph();
        
        let uMap = allUsers;
        if (Object.keys(uMap).length === 0) {
           const avlRes = await dsAPI.getAVL();
           if (avlRes.data.inorder) {
             const freshMap = {};
             avlRes.data.inorder.forEach(u => { 
               const uid = u.value?.toString();
               if (uid) freshMap[uid] = { id: uid, username: u.key, displayName: u.key }; 
             });
             setAllUsers(freshMap);
             uMap = freshMap;
           }
        }

        const enrichedNodes = res.data.graphData.nodes.map(n => {
          const nid = n.id.toString();
          const u = uMap[nid];
          return {
            ...n,
            username: u ? u.username : `User_${nid}`, 
            displayName: u ? u.displayName : `User ${nid}`
          };
        });

        setGraphData({
          ...res.data,
          graphData: { ...res.data.graphData, nodes: enrichedNodes }
        });
      }
      
      // Auto-set Dijkstra FROM to current user if available and in list
      if (t === 'graph' && !dijkstraFrom && currentUserId) {
        setDijkstraFrom(currentUserId);
      }
    } catch (err) {
      console.error('Error loading DSViz data:', err);
    } finally {
      setLoading(false);
    }
  };

  const info = DS_INFO[tab];

  // Traversal animation
  useEffect(() => {
    if (!traversalPlaying) return;
    const log = graphData?.[traversalMode]?.traversalLog || [];
    if (traversalStep >= log.length) { setTraversalPlaying(false); return; }
    const timer = setTimeout(() => setTraversalStep(s => s + 1), 800);
    return () => clearTimeout(timer);
  }, [traversalPlaying, traversalStep, graphData, traversalMode]);

  const startTraversal = () => {
    setTraversalStep(0);
    setTraversalPlaying(true);
  };

  const handleDijkstra = () => {
    if (!dijkstraFrom || !dijkstraTo || !graphData) return;
    setTraversalPlaying(false); // Stop current animation
    setTraversalStep(0);
    setDijkstraResult('');

    const nodes = graphData.graphData.nodes;
    const edges = graphData.graphData.edges;
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      adj[e.source].push(e.target);
      adj[e.target].push(e.source);
    });

    const dist = {};
    const prev = {};
    const queue = new Set(nodes.map(n => n.id.toString()));
    const log = [];

    nodes.forEach(n => { 
      const id = n.id.toString();
      dist[id] = Infinity; 
      prev[id] = null; 
    });
    dist[dijkstraFrom] = 0;

    log.push({ action: 'discovery', node: dijkstraFrom, label: allUsers[dijkstraFrom]?.username || dijkstraFrom });

    while (queue.size > 0) {
      // Find min dist node in queue
      let u = null;
      for (const nodeId of queue) {
        if (u === null || dist[nodeId] < dist[u]) u = nodeId;
      }

      if (u === null || dist[u] === Infinity) break;
      queue.delete(u);
      
      const uname = allUsers[u]?.username || u;
      log.push({ action: 'settle', node: u, label: uname });

      if (u === dijkstraTo) break;

      // Sort neighbors for deterministic pathfinding (matching backend logic)
      [...adj[u]].sort().forEach(v => {
        const vid = v.toString();
        if (queue.has(vid)) {
          const vname = allUsers[vid]?.username || vid;
          log.push({ action: 'relax', node: vid, from: u, label: vname });
          if (dist[u] + 1 < dist[vid]) {
            dist[vid] = dist[u] + 1;
            prev[vid] = u;
          }
        }
      });
    }

    // Path Reconstruction
    const path = [];
    let curr = dijkstraTo;
    while (curr) {
      path.unshift(curr);
      curr = prev[curr];
    }

    if (path[0] === dijkstraFrom) {
      const pathNames = path.map(id => allUsers[id]?.username || id);
      setDijkstraResult(`Shortest path: ${pathNames.join(' → ')} (${path.length - 1} hops)`);
      path.forEach((nodeId, idx) => {
         log.push({ action: 'path', node: nodeId, from: path[idx-1], sequence: idx });
      });
      console.log('Dijkstra complete:', pathNames);
    } else {
      setDijkstraResult('No path found.');
    }

    setGraphData(prev => ({ ...prev, dijkstra: { traversalLog: log } }));
    setTraversalMode('dijkstra');
    setTraversalStep(0);
    setTimeout(() => setTraversalPlaying(true), 100);
  };

  // Auto-scroll log
  useEffect(() => {
    const container = document.getElementById('traversal-log-container');
    if (container) container.scrollTop = 0; // Since log is reversed, top is newest
  }, [traversalStep]);

  return (
    <div className="page-wide fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.75rem', marginBottom: 6 }}>
          Data Structure Visualizer
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Live view of the data structures powering Social Connect
        </p>
      </div>

      {/* Speed Slider */}
      <div style={{ 
        display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, 
        padding: '12px 20px', background: 'white', borderRadius: 12, border: '1px solid var(--cream-border)',
        maxWidth: 400
      }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Animation Speed:</span>
        <div style={{ display: 'flex', gap: 4, background: 'var(--cream-dark)', padding: 4, borderRadius: 8 }}>
          {[1, 2, 4].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              padding: '6px 12px', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
              background: speed === s ? 'var(--accent)' : 'transparent',
              color: speed === s ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              {s}x
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>({animationDelay.toFixed(0)}ms delay)</span>
      </div>

      {/* DS tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {Object.entries(DS_INFO).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              border: '1px solid',
              transition: 'all 0.18s',
              borderColor: tab === key ? info.color : 'var(--cream-border)',
              background: tab === key ? info.light : 'white',
              color: tab === key ? info.color : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {info.name}
          </button>
        ))}
      </div>

      <style>{`
        .ds-viz-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: start;
          transition: all 0.3s ease;
        }
        .ds-viz-layout.full-width {
          grid-template-columns: 1fr;
        }
        .info-toggle-btn {
          display: none;
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        @media (max-width: 1100px) {
          .ds-viz-layout {
            grid-template-columns: 1fr;
          }
          .info-toggle-btn {
            display: flex;
          }
          .ds-side-panel {
            display: ${showInfo ? 'flex' : 'none'};
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 400px;
            z-index: 101;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          .ds-overlay {
            display: ${showInfo ? 'block' : 'none'};
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(4px);
            z-index: 100;
          }
        }
      `}</style>
      
      {/* Info Toggle Overlay */}
      <div className="ds-overlay" onClick={() => setShowInfo(false)} />
      <button className="info-toggle-btn" onClick={() => setShowInfo(!showInfo)}>
        {showInfo ? '✕' : 'ℹ'}
      </button>

      <div className={`ds-viz-layout ${!showInfo ? 'full-width' : ''}`}>
        {/* Main visualization */}
        <div>
          <div className="card" style={{ padding: '24px', marginBottom: 20, minHeight: '550px', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div className="loading-center" style={{ minHeight: '500px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : (
              <>
                {/* AVL Tree */}
                {tab === 'avl' && avlData && (
                  <div>
                    <AVLTreeViz initialPending={pendingUsers} speed={speed} />
                  </div>
                )}

                {/* Graph */}
                {tab === 'graph' && graphData && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 2 }}>Social Graph — Your Network</h2>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                          Exploring {graphData.stats.totalUsers} users centered around <strong>{user?.username || 'your profile'}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                         {!traversalPlaying ? (
                           <>
                             <button onClick={() => { setTraversalStep(0); setTraversalPlaying(true); }} className="btn btn-primary btn-sm">▶ Animate {traversalMode.toUpperCase()}</button>
                           </>
                         ) : (
                           <button onClick={() => setTraversalPlaying(false)} className="btn btn-secondary btn-sm">⏸ Pause</button>
                         )}
                         <button onClick={() => { setTraversalStep(0); setTraversalPlaying(false); }} className="btn btn-ghost btn-sm">Reset</button>
                      </div>
                    </div>

                      <GraphViz 
                        graphData={graphData.graphData} 
                        currentUserId={currentUserId}
                        traversalLog={graphData[traversalMode]?.traversalLog || []}
                      traversalStep={traversalStep}
                      onNodeClick={(id) => { console.log('BFS from', id); /* implement interactive BFS if needed */ }}
                      height={500} 
                    />

                    {/* Traversal selector */}
                    <div style={{ marginTop: 20, padding: '16px', background: 'var(--cream-dark)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                        <div className="tab-bar" style={{ margin: 0 }}>
                          <button className={`tab ${traversalMode === 'bfs' ? 'active' : ''}`} onClick={() => { setTraversalMode('bfs'); setTraversalStep(0); setDijkstraResult(''); }}>BFS</button>
                          <button className={`tab ${traversalMode === 'dfs' ? 'active' : ''}`} onClick={() => { setTraversalMode('dfs'); setTraversalStep(0); setDijkstraResult(''); }}>DFS</button>
                          <button className={`tab ${traversalMode === 'dijkstra' ? 'active' : ''}`} onClick={() => { setTraversalMode('dijkstra'); setTraversalStep(0); }}>Dijkstra</button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Step {traversalStep} / {graphData[traversalMode]?.traversalLog?.length || 0}</div>
                      </div>

                      {traversalMode === 'dijkstra' && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: '0.6875rem', fontWeight: 700, opacity: 0.6 }}>FROM</label>
                            <select value={dijkstraFrom} onChange={e => setDijkstraFrom(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--cream-border)', fontSize: '0.8125rem' }}>
                              <option value="">Select...</option>
                              {Object.values(allUsers)
                                .sort((a, b) => a.username.localeCompare(b.username))
                                .map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                          </div>
                          <div style={{ fontSize: '1.2rem', marginTop: 15 }}>→</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: '0.6875rem', fontWeight: 700, opacity: 0.6 }}>TO</label>
                            <select value={dijkstraTo} onChange={e => setDijkstraTo(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--cream-border)', fontSize: '0.8125rem' }}>
                              <option value="">Select...</option>
                              {Object.values(allUsers)
                                .sort((a, b) => a.username.localeCompare(b.username))
                                .map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                          </div>
                          <button onClick={handleDijkstra} className="btn btn-primary" style={{ marginTop: 15 }}>Find Path</button>
                        </div>
                      )}

                      {dijkstraResult && (
                        <div style={{ padding: '10px 14px', background: 'rgba(216, 90, 48, 0.1)', border: '1px solid rgba(216, 90, 48, 0.2)', color: '#D85A30', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600, marginBottom: 16 }}>
                          {dijkstraResult}
                        </div>
                      )}
                      
                      {/* Traversal log (minimal) */}
                      <div id="traversal-log-container" style={{ maxHeight: 100, overflowY: 'auto', fontSize: '0.8125rem', scrollBehavior: 'smooth' }}>
                         {(graphData[traversalMode]?.traversalLog || []).slice(0, traversalStep).reverse().map((entry, i) => (
                           <div 
                             key={i} 
                             style={{ 
                               padding: '4px 8px', borderBottom: '1px solid rgba(0,0,0,0.05)', 
                               opacity: i === 0 ? 1 : 0.6,
                               background: i === 0 ? 'rgba(29, 158, 117, 0.1)' : 'transparent',
                               borderRadius: 4
                             }}
                           >
                             <span style={{ fontWeight: 700, color: i === 0 ? '#1D9E75' : 'var(--accent)' }}>[{entry.action}]</span> {entry.label || entry.node}
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* B-Tree */}
                {tab === 'btree' && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 2 }}>B-Tree — Post Timestamp Index</h2>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                        Optimized multi-way search tree for large indices
                      </div>
                    </div>
                    <BTreeViz speed={speed} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="ds-side-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ds-panel">
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--stone)', marginBottom: 4 }}>
              Data Structure
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: 2 }}>{info.name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--stone)', marginBottom: 16 }}>{info.usage}</div>

            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--stone)', marginBottom: 6 }}>
              Complexity
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace', marginBottom: 16 }}>
              {info.complexity}
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--cream-dark)', lineHeight: 1.7, marginBottom: 16 }}>
              {info.description}
            </div>

            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--stone)', marginBottom: 8 }}>
              Key Properties
            </div>
            {info.properties.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ color: 'var(--accent)', fontSize: '0.75rem', marginTop: 2 }}>◆</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--cream-dark)', lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>

          {/* Why this DS? */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 10 }}>Why {info.name.split(' ')[0]}?</div>
            {tab === 'avl' && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Regular BST can degrade to O(n) on sorted input (e.g., inserting users A→Z alphabetically). AVL self-balancing via rotations guarantees O(log n) always.
              </p>
            )}
            {tab === 'graph' && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Social networks are inherently graph problems. Friendships = undirected edges. BFS levels = degrees of connection. Adjacency list is optimal for sparse graphs.
              </p>
            )}
            {tab === 'btree' && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                B-Trees minimize I/O by storing many keys per node. Ideal for disk-backed storage or range queries like "posts from last 7 days" — finds the range start in O(log n) then scans forward.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
