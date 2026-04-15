import React, { useState } from 'react';
import { motion } from 'framer-motion';

const KEY_H = 32;
const KEY_TOTAL_W = 48;
const NODE_PADDING = 24;
const V_GAP = 80;
const H_GAP = 24;

// --- B-TREE LOGIC HELPERS ---
class BTreeNode {
  constructor(isLeaf = true) {
    this.keys = [];
    this.children = [];
    this.isLeaf = isLeaf;
  }
}

function splitChild(parent, i, node, m) {
  const t = Math.floor((m - 1) / 2);
  const newNode = new BTreeNode(node.isLeaf);
  
  // The median key index
  const midIndex = Math.floor(node.keys.length / 2);
  const midKey = node.keys[midIndex];

  // Move keys after midIndex to newNode
  newNode.keys = node.keys.slice(midIndex + 1);
  // Keep keys before midIndex in original node
  node.keys = node.keys.slice(0, midIndex);

  if (!node.isLeaf) {
    newNode.children = node.children.slice(midIndex + 1);
    node.children = node.children.slice(0, midIndex + 1);
  }

  parent.keys.splice(i, 0, midKey);
  parent.children.splice(i + 1, 0, newNode);
}

// Layout logic
function getSubtreeWidth(node) {
  if (!node || !node.keys) return 0;
  const nodeW = node.keys.length * KEY_TOTAL_W + NODE_PADDING;
  if (node.isLeaf || !node.children || !node.children.length) return Math.max(nodeW, 80);
  const childrenW = node.children.reduce((sum, c) => sum + (c ? getSubtreeWidth(c) : 0), 0) + (node.children.length - 1) * H_GAP;
  return Math.max(nodeW, childrenW);
}

function BTreeNodeComp({ node, x, y, activeNodes, highlightKey, splittingNode }) {
  if (!node || !node.keys) return null;
  const nodeW = node.keys.length * KEY_TOTAL_W + NODE_PADDING;
  const boxX = x - nodeW / 2;
  const isActive = activeNodes.has(node);
  const isSplitting = splittingNode === node;
  
  let childPositions = [];
  if (!node.isLeaf && node.children.length) {
    const totalChildrenW = node.children.reduce((s, c) => s + getSubtreeWidth(c), 0) + (node.children.length - 1) * H_GAP;
    let startX = x - totalChildrenW / 2;
    childPositions = node.children.map(child => {
      const cw = getSubtreeWidth(child);
      const pos = startX + cw / 2;
      startX += cw + H_GAP;
      return pos;
    });
  }

  const bgColor = isSplitting ? '#FEF3C7' : (isActive ? '#E1EFFE' : 'white');
  const strokeColor = isSplitting ? '#D97706' : (isActive ? '#1C64F2' : 'var(--cream-border)');

  return (
    <motion.g layout transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
      {childPositions.map((cx, i) => (
        <motion.line 
          key={i} layout
          initial={{ opacity: 0 }}
          animate={{ x1: x, y1: y + KEY_H, x2: cx, y2: y + KEY_H + V_GAP, opacity: 1 }}
          stroke="var(--cream-border)" strokeWidth={1.5} strokeDasharray="4 2"
        />
      ))}
      
      <motion.rect 
        layout
        initial={false}
        animate={{ 
          x: boxX, y, width: nodeW, height: KEY_H,
          fill: bgColor, stroke: strokeColor,
          scale: isSplitting ? 1.1 : 1,
          strokeWidth: isSplitting || isActive ? 2 : 1.5
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        rx={6}
      />

      {node.keys.map((k, i) => {
        const isMatch = highlightKey === k;
        const keyCenterX = boxX + NODE_PADDING / 2 + i * KEY_TOTAL_W + KEY_TOTAL_W / 2 - 2;
        return (
          <motion.g key={`${k}-${i}`} layout>
            {i > 0 && (
               <line x1={boxX + NODE_PADDING / 2 + i * KEY_TOTAL_W - 2} y1={y + 4} x2={boxX + NODE_PADDING / 2 + i * KEY_TOTAL_W - 2} y2={y + KEY_H - 4} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
            )}
            <motion.text
              layout
              x={keyCenterX} y={y + KEY_H / 2}
              textAnchor="middle" dominantBaseline="central"
              fontSize={11} fontWeight={700} fill={isMatch ? '#D85A30' : 'var(--text-primary)'}
              fontFamily="monospace"
            >
              {k}
            </motion.text>
          </motion.g>
        );
      })}

      {!node.isLeaf && node.children.map((child, i) => (
        <BTreeNodeComp key={i} node={child} x={childPositions[i]} y={y + KEY_H + V_GAP} activeNodes={activeNodes} highlightKey={highlightKey} splittingNode={splittingNode} />
      ))}
    </motion.g>
  );
}

export default function BTreeViz({ speed = 1 }) {
  const [m, setM] = useState(3);
  const [root, setRoot] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [activeNodes, setActiveNodes] = useState(new Set());
  const [highlightKey, setHighlightKey] = useState(null);
  const [splittingNode, setSplittingNode] = useState(null);
  const [insertInput, setInsertInput] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms / speed));

  const splitChildWithAnim = async (parent, i, node, m) => {
    setSplittingNode(node);
    await delay(1000); // Slower split prep
    splitChild(parent, i, node, m);
    setSplittingNode(null);
    await delay(1000); // 1000ms split finish as per plan
  };

  const insertNonFullWithAnim = async (node, key, m) => {
    let i = node.keys.length - 1;
    if (node.isLeaf) {
      node.keys.push(null);
      while (i >= 0 && key < node.keys[i]) {
        node.keys[i + 1] = node.keys[i];
        i--;
      }
      node.keys[i + 1] = key;
      setRoot(r => ({ ...r }));
      await delay(600); // 600ms insert finish as per plan
    } else {
      while (i >= 0 && key < node.keys[i]) i--;
      i++;
      if (node.children[i].keys.length === m - 1) {
        await splitChildWithAnim(node, i, node.children[i], m);
        if (key > node.keys[i]) i++;
      }
      await insertNonFullWithAnim(node.children[i], key, m);
    }
  };

  const handleInsert = async (val) => {
    const key = parseInt(val);
    if (isNaN(key) || animating) return;
    setAnimating(true);
    setHighlightKey(null);
    
    if (!root) {
      const newRoot = new BTreeNode(true);
      newRoot.keys.push(key);
      setRoot(newRoot);
    } else if (root.keys.length === m - 1) {
      const newRoot = new BTreeNode(false);
      newRoot.children.push(root);
      await splitChildWithAnim(newRoot, 0, root, m);
      await insertNonFullWithAnim(newRoot, key, m);
      setRoot({ ...newRoot });
    } else {
      await insertNonFullWithAnim(root, key, m);
      setRoot(r => ({ ...r }));
    }
    setAnimating(false);
  };

  const handleSearch = async (val) => {
    const key = parseInt(val);
    if (isNaN(key) || animating) return;
    setAnimating(true);
    let curr = root;
    const path = new Set();
    while (curr) {
      path.add(curr);
      setActiveNodes(new Set(path));
      await delay(800); // Slower search steps
      const idx = curr.keys.findIndex(k => k === key);
      if (idx !== -1) {
        setHighlightKey(key);
        break;
      }
      if (curr.isLeaf) break;
      let i = 0;
      while (i < curr.keys.length && key > curr.keys[i]) i++;
      curr = curr.children[i];
    }
    await delay(1000);
    setActiveNodes(new Set());
    setHighlightKey(null);
    setAnimating(false);
  };

  const handleGenerate = async () => {
    if (animating) return;
    setRoot(null);
    setAnimating(true);
    const randomKeys = Array.from({ length: 12 }, () => Math.floor(Math.random() * 999));
    for (const key of randomKeys) {
       await handleInsert(key.toString());
    }
    setAnimating(false);
  };

  const treeWidth = root ? getSubtreeWidth(root) : 600;
  const canvasW = Math.max(treeWidth + 100, 800);
  const canvasH = 500;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Order:</div>
        <select value={m} onChange={e => { setM(parseInt(e.target.value)); setRoot(null); }} disabled={animating} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--cream-border)', fontSize: '0.8125rem' }}>
          <option value={3}>Order 3</option>
          <option value={4}>Order 4</option>
          <option value={5}>Order 5</option>
        </select>
        
        <div style={{ display: 'flex', gap: 6, background: 'var(--cream-dark)', padding: '6px 12px', borderRadius: 10 }}>
          <input value={insertInput} onChange={e => setInsertInput(e.target.value)} placeholder="Key..." style={{ width: 60, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem' }} />
          <button onClick={() => { handleInsert(insertInput); setInsertInput(''); }} className="btn btn-primary btn-sm" disabled={animating}>Insert</button>
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'var(--cream-dark)', padding: '6px 12px', borderRadius: 10 }}>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search..." style={{ width: 60, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem' }} />
          <button onClick={() => { handleSearch(searchInput); setSearchInput(''); }} className="btn btn-secondary btn-sm" disabled={animating}>Search</button>
        </div>

        <button onClick={handleGenerate} className="btn btn-primary btn-sm" disabled={animating}>Generate B-Tree</button>
        <button onClick={() => setRoot(null)} className="btn btn-ghost btn-sm" disabled={animating}>Clear</button>
      </div>

      {/* Viewport */}
      <div style={{ 
        background: 'var(--cream)', borderRadius: 16, border: '1px solid var(--cream-border)', 
        overflowX: 'auto', overflowY: 'visible', width: '100%', minHeight: '500px', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {!root ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>🌳</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>Select order and click 'Generate B-Tree' to start index simulation.</p>
          </div>
        ) : (
          <svg 
            width={canvasW} height={canvasH} 
            viewBox={`0 0 ${canvasW} ${canvasH}`}
            style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
          >
            <BTreeNodeComp 
               node={root} x={canvasW / 2} y={50} 
               activeNodes={activeNodes} highlightKey={highlightKey} 
               splittingNode={splittingNode} 
            />
          </svg>
        )}
      </div>
    </div>
  );
}
