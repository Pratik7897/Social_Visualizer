import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NODE_RADIUS = 22;
const H_GAP = 12;
const V_GAP = 58;

// --- AVL LOGIC HELPERS ---
class AVLNode {
  constructor(key) {
    this.key = key;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

function getHeight(node) {
  return node ? node.height : 0;
}

function getBalance(node) {
  return node ? getHeight(node.left) - getHeight(node.right) : 0;
}

function updateHeight(node) {
  node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

// Layout logic (same as before but adapted for local state)
function layoutTree(node, depth = 0, counter = { val: 0 }) {
  if (!node) return null;
  const left = layoutTree(node.left, depth + 1, counter);
  const x = counter.val++;
  const right = layoutTree(node.right, depth + 1, counter);
  return { ...node, x, y: depth, left, right };
}

function collectNodes(node, nodes = [], edges = []) {
  if (!node) return;
  nodes.push(node);
  if (node.left) {
    edges.push({ from: node, to: node.left, id: `${node.key}-${node.left.key}` });
    collectNodes(node.left, nodes, edges);
  }
  if (node.right) {
    edges.push({ from: node, to: node.right, id: `${node.key}-${node.right.key}` });
    collectNodes(node.right, nodes, edges);
  }
  return { nodes, edges };
}

export default function AVLTreeViz({ initialPending = [], speed = 1 }) {
  const [root, setRoot] = useState(null);
  const [pending, setPending] = useState(initialPending);
  const [animating, setAnimating] = useState(false);
  const [activeNode, setActiveNode] = useState(null); // Node currently being visited
  const [rotationNode, setRotationNode] = useState(null); // Node where rotation is occurring
  const [rotationType, setRotationType] = useState(null);
  const [searchMatch, setSearchMatch] = useState(null);
  const [insertInput, setInsertInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteInput, setDeleteInput] = useState('');

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms / speed));

  // --- AVL OPERATIONS WITH ANIMATION ---
  
  const rightRotate = async (y) => {
    setRotationNode(y.key);
    setRotationType('Right Rotate');
    await delay(1000);
    
    let x = y.left;
    let T2 = x.right;
    x.right = y;
    y.left = T2;
    updateHeight(y);
    updateHeight(x);
    
    setRotationNode(null);
    setRotationType(null);
    return x;
  };

  const leftRotate = async (x) => {
    setRotationNode(x.key);
    setRotationType('Left Rotate');
    await delay(1000);
    
    let y = x.right;
    let T2 = y.left;
    y.left = x;
    x.right = T2;
    updateHeight(x);
    updateHeight(y);
    
    setRotationNode(null);
    setRotationType(null);
    return y;
  };

  const insert = async (node, key) => {
    if (!node) return new AVLNode(key);

    setActiveNode(node.key);
    await delay(700);

    if (key < node.key) {
      node.left = await insert(node.left, key);
    } else if (key > node.key) {
      node.right = await insert(node.right, key);
    } else {
      return node; // Duplicate
    }

    updateHeight(node);
    let balance = getBalance(node);

    // Left Left
    if (balance > 1 && key < node.left.key) {
      return await rightRotate(node);
    }
    // Right Right
    if (balance < -1 && key > node.right.key) {
      return await leftRotate(node);
    }
    // Left Right
    if (balance > 1 && key > node.left.key) {
      node.left = await leftRotate(node.left);
      return await rightRotate(node);
    }
    // Right Left
    if (balance < -1 && key < node.right.key) {
      node.right = await rightRotate(node.right);
      return await leftRotate(node);
    }

    return node;
  };

  const handleInsert = async (key) => {
    if (!key || animating) return;
    setAnimating(true);
    setSearchMatch(null);
    const newRoot = await insert(root, key);
    setRoot({ ...newRoot }); // Trigger re-render
    setActiveNode(null);
    setAnimating(false);
  };

  const handleGenerate = async () => {
    if (animating || pending.length === 0) return;
    setAnimating(true);
    let currentRoot = root;
    const usersToInsert = [...pending];
    setPending([]);
    
    for (const user of usersToInsert) {
      currentRoot = await insert(currentRoot, user);
      setRoot({ ...currentRoot });
      setActiveNode(null);
      await delay(400);
    }
    setAnimating(false);
  };

  const handleSearch = async (key) => {
    if (!key || animating) return;
    setAnimating(true);
    let curr = root;
    while (curr) {
      setActiveNode(curr.key);
      await delay(700);
      if (key === curr.key) {
        setSearchMatch(curr.key);
        break;
      }
      curr = key < curr.key ? curr.left : curr.right;
    }
    if (!curr) setActiveNode('not-found');
    await delay(1000);
    setActiveNode(null);
    setAnimating(false);
  };

  // --- LAYOUT COMPUTATION ---
  const layout = useMemo(() => {
    if (!root) return null;
    const laid = layoutTree(root);
    const { nodes, edges } = collectNodes(laid);
    
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    const xScale = NODE_RADIUS * 2 + H_GAP;
    const yScale = NODE_RADIUS * 2 + V_GAP;
    const offsetX = NODE_RADIUS + 10;
    const offsetY = NODE_RADIUS + 10;
    
    const mappedNodes = nodes.map(n => ({
      ...n,
      px: (n.x - minX) * xScale + offsetX,
      py: n.y * yScale + offsetY,
      balance: getBalance(n)
    }));
    
    const nodeMap = {};
    mappedNodes.forEach(n => { nodeMap[n.key] = n; });
    
    const mappedEdges = edges.map(e => ({
      id: e.id,
      x1: nodeMap[e.from.key]?.px,
      y1: nodeMap[e.from.key]?.py,
      x2: nodeMap[e.to.key]?.px,
      y2: nodeMap[e.to.key]?.py,
    }));
    
    const w = (maxX - minX + 1) * xScale + offsetX + 10;
    const h = (maxY + 1) * yScale + offsetY + 20;
    return { nodes: mappedNodes, edges: mappedEdges, w, h };
  }, [root]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, background: 'var(--cream-dark)', padding: '6px 12px', borderRadius: 10 }}>
          <input 
            value={insertInput} 
            onChange={e => setInsertInput(e.target.value)} 
            placeholder="User..." 
            style={{ width: 80, border: 'none', background: 'transparent', fontSize: '0.8125rem', outline: 'none' }}
          />
          <button onClick={() => { handleInsert(insertInput); setInsertInput(''); }} className="btn btn-primary btn-sm" disabled={animating}>Insert</button>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'var(--cream-dark)', padding: '6px 12px', borderRadius: 10 }}>
          <input 
            value={searchInput} 
            onChange={e => setSearchInput(e.target.value)} 
            placeholder="Search..." 
            style={{ width: 80, border: 'none', background: 'transparent', fontSize: '0.8125rem', outline: 'none' }}
          />
          <button onClick={() => { handleSearch(searchInput); setSearchInput(''); }} className="btn btn-secondary btn-sm" disabled={animating}>Search</button>
        </div>
        <button onClick={handleGenerate} className="btn btn-primary btn-sm" disabled={animating || pending.length === 0}>
          Generate AVL Tree
        </button>
      </div>

      {/* Canvas */}
      <div style={{ 
        position: 'relative', background: 'var(--cream)', borderRadius: 16, 
        border: '1px solid var(--cream-border)', overflowX: 'auto', minHeight: '500px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {!layout ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>🌲</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>Click 'Generate AVL Tree' to animate insertions.</p>
          </div>
        ) : (
          <svg 
            width="100%" 
            height="500" 
            viewBox={`0 0 ${Math.max(layout.w, 400)} ${Math.max(layout.h, 500)}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block', margin: '0 auto' }}
          >
            <AnimatePresence>
              {layout.edges.map(e => (
                <motion.line
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  stroke="var(--cream-border)"
                  strokeWidth={1.5}
                />
              ))}
              {layout.nodes.map(node => {
                const isSearching = activeNode === node.key;
                const isRotating = rotationNode === node.key;
                const isMatch = searchMatch === node.key;
                
                let fill = 'white';
                let stroke = 'var(--cream-border)';
                let textColor = 'var(--text-primary)';
                
                if (isSearching) { fill = 'var(--teal-light)'; stroke = 'var(--teal)'; }
                if (isRotating) { fill = '#FDE68A'; stroke = '#F59E0B'; }
                if (isMatch) { fill = '#FCA5A5'; stroke = '#EF4444'; textColor = 'white'; }

                return (
                  <motion.g 
                    key={node.key} 
                    layout
                    initial={{ scale: 0 }} 
                    animate={{ x: node.px, y: node.py, scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <motion.circle
                      r={NODE_RADIUS}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSearching || isRotating ? 3 : 1.5}
                      animate={{ scale: isSearching ? [1, 1.1, 1] : 1 }}
                    />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fill={textColor} fontFamily="monospace">
                      {node.key.slice(0, 6)}
                    </text>
                    
                    {/* BF indicator */}
                    <g transform={`translate(${NODE_RADIUS}, -${NODE_RADIUS})`}>
                      <circle r={7} fill="white" stroke="var(--cream-border)" />
                      <text textAnchor="middle" dominantBaseline="central" fontSize={7} fontWeight={800} fill="var(--muted)">
                        {node.balance > 0 ? '+' : ''}{node.balance}
                      </text>
                    </g>

                    {/* Rotation Label */}
                    {isRotating && rotationType && (
                      <motion.g initial={{ y: -40, opacity: 0 }} animate={{ y: -50, opacity: 1 }} exit={{ opacity: 0 }}>
                        <rect x={-35} y={-10} width={70} height={20} rx={10} fill="#F59E0B" />
                        <text textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={700} fill="white">
                          {rotationType}
                        </text>
                      </motion.g>
                    )}
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </svg>
        )}
      </div>

      {/* Pending Pool */}
      {pending.length > 0 && (
        <div style={{ padding: '16px', background: 'var(--cream-dark)', borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase' }}>
            Pending Insertion Pool
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {pending.map((user, i) => (
              <motion.span
                key={user}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  padding: '4px 12px', background: 'white', borderRadius: 100, fontSize: '0.75rem',
                  border: '1px solid var(--cream-border)', color: 'var(--text-secondary)',
                  cursor: animating ? 'default' : 'pointer',
                }}
                whileHover={!animating ? { y: -2, background: 'var(--accent-light)', color: 'var(--accent)' } : {}}
                onClick={() => !animating && handleInsert(user)}
              >
                {user}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
