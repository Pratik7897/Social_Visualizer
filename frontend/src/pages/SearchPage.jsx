import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, friendsAPI } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/layout/Avatar';
import AVLTreeViz from '../components/dsvis/AVLTreeViz';

export default function SearchPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [avlData, setAvlData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [showTree, setShowTree] = useState(true);
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setAvlData(null); return; }
    setLoading(true);
    try {
      const res = await usersAPI.search(q);
      setResults(res.data.users);
      setAvlData(res.data.avlTree);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const handleRequest = async (userId) => {
    try {
      await friendsAPI.sendRequest(userId);
      setSentRequests(prev => new Set([...prev, userId]));
      addToast('Friend request sent!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  return (
    <div className="page-wide fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.75rem', marginBottom: 6 }}>
          Find People
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Search powered by an <strong style={{ color: 'var(--accent)' }}>AVL Self-Balancing Tree</strong> — O(log n) lookups
        </p>
      </div>

      {/* Search box */}
      <div style={{ position: 'relative', marginBottom: 28, maxWidth: 560 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', fontSize: '1rem' }}>◎</span>
        <input
          className="input"
          style={{ paddingLeft: 38, fontSize: '1rem', height: 48 }}
          placeholder="Search by username…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {loading && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner" style={{ width: 16, height: 16 }} />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' }}>
        {/* Results */}
        <div>
          {query && results.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-state-icon">◎</div>
              <p>No users found for "{query}"</p>
            </div>
          )}

          {!query && (
            <div style={{ color: 'var(--muted)', fontSize: '0.9375rem', padding: '20px 0' }}>
              Start typing to search users. The AVL tree will find matches instantly.
            </div>
          )}

          {results.map(u => (
            <div key={u._id} className="card fade-in" style={{ padding: '16px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link to={`/profile/${u._id}`}>
                <Avatar user={u} size="md" />
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/profile/${u._id}`} style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {u.displayName}
                </Link>
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>@{u.username}</div>
                {u.bio && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>}
                {u.mutualCount > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--teal)', marginTop: 4, fontWeight: 500 }}>
                    ◈ {u.mutualCount} mutual friend{u.mutualCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              {u._id !== user?._id && (
                <button
                  onClick={() => handleRequest(u._id)}
                  disabled={sentRequests.has(u._id)}
                  className={`btn btn-sm ${sentRequests.has(u._id) ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {sentRequests.has(u._id) ? 'Sent' : '+ Connect'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* AVL Tree Visualization Panel */}
        <div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--cream-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>AVL Tree Visualization</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Live search index</div>
              </div>
              <button onClick={() => setShowTree(p => !p)} className="btn btn-ghost btn-sm">
                {showTree ? 'Hide' : 'Show'}
              </button>
            </div>

            {showTree && (
              <div style={{ padding: '16px' }}>
                {/* DS Info */}
                <div style={{ background: 'var(--cream-dark)', borderRadius: 8, padding: '12px', marginBottom: 14, fontSize: '0.8125rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>How it works</div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Each <strong>username</strong> is inserted into the AVL tree alphabetically. When you type, the tree traverses from root → left/right child based on alphabetical comparison, returning prefix matches in <strong>O(log n)</strong>.
                  </div>
                  {query && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--accent-light)', borderRadius: 6, color: 'var(--accent-dark)', fontWeight: 500 }}>
                      Searching: "{query}" → {results.length} result{results.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {avlData ? (
                  <AVLTreeViz tree={avlData} searchQuery={query} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--stone)', fontSize: '0.875rem' }}>
                    Type to see the AVL tree search path
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
