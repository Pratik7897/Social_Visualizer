import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { postsAPI, usersAPI, friendsAPI } from '../utils/api';
import Avatar from '../components/layout/Avatar';

function PostCard({ post, currentUserId, onLike, onDelete }) {
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId));
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const handleLike = async () => {
    const res = await onLike(post._id);
    setLiked(res.liked);
    setLikeCount(res.likeCount);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="card fade-in" style={{ padding: '20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Link to={`/profile/${post.author._id}`}>
          <Avatar user={post.author} size="md" />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link to={`/profile/${post.author._id}`} style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              {post.author.displayName}
            </Link>
            <span style={{ color: 'var(--stone)', fontSize: '0.8125rem' }}>@{post.author.username}</span>
            <span style={{ color: 'var(--stone)', fontSize: '0.8125rem', marginLeft: 'auto' }}>{timeAgo(post.createdAt)}</span>
          </div>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 14 }}>
            {post.content}
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleLike} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 100, fontSize: '0.8125rem', fontWeight: 500,
              background: liked ? 'var(--rose-light)' : 'var(--cream-dark)',
              color: liked ? 'var(--rose)' : 'var(--muted)',
              transition: 'all 0.15s', border: 'none', cursor: 'pointer',
            }}>
              {liked ? '♥' : '♡'} {likeCount}
            </button>
            {post.author._id === currentUserId && (
              <button onClick={() => onDelete(post._id)} style={{
                marginLeft: 'auto', padding: '5px 10px', borderRadius: 6,
                fontSize: '0.75rem', color: 'var(--stone)', background: 'none', cursor: 'pointer',
              }}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposePost({ onPost }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await onPost(content);
    setContent('');
    setLoading(false);
  };

  return (
    <div className="card" style={{ padding: '20px', marginBottom: 24 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Avatar user={user} size="md" />
          <div style={{ flex: 1 }}>
            <textarea
              className="input"
              placeholder="Share something with your network…"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              style={{ resize: 'none', marginBottom: 10 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: content.length > 450 ? 'var(--rose)' : 'var(--stone)' }}>
                {content.length}/500
              </span>
              <button type="submit" className="btn btn-primary btn-sm" disabled={!content.trim() || loading}>
                {loading ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      postsAPI.getFeed(),
      usersAPI.suggestions(),
      friendsAPI.getRequests(),
    ]).then(([feedRes, suggestRes, reqRes]) => {
      setPosts(feedRes.data.posts);
      setSuggestions(suggestRes.data.suggestions.slice(0, 5));
      setRequests(reqRes.data.requests.slice(0, 3));
    }).finally(() => setLoading(false));
  }, []);

  const handlePost = async (content) => {
    try {
      const res = await postsAPI.create({ content });
      setPosts(prev => [res.data.post, ...prev]);
      addToast('Posted!', 'success');
    } catch { addToast('Failed to post', 'error'); }
  };

  const handleLike = async (postId) => {
    const res = await postsAPI.like(postId);
    return res.data;
  };

  const handleDelete = async (postId) => {
    await postsAPI.delete(postId);
    setPosts(prev => prev.filter(p => p._id !== postId));
    addToast('Post deleted', 'info');
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendsAPI.sendRequest(userId);
      setSuggestions(prev => prev.filter(s => s._id !== userId));
      addToast('Friend request sent!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleAccept = async (friendship) => {
    await friendsAPI.accept(friendship._id);
    setRequests(prev => prev.filter(r => r._id !== friendship._id));
    addToast(`You and ${friendship.requester.displayName} are now friends!`, 'success');
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', gap: 24, padding: '32px 32px 32px 32px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Feed */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400 }}>
            Good to see you, <em>{user?.displayName?.split(' ')[0]}</em>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 4 }}>
            {posts.length} posts from your network
          </p>
        </div>

        <ComposePost onPost={handlePost} />

        {posts.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">◈</div>
            <p>No posts yet. Connect with people to see their updates.</p>
            <Link to="/search" className="btn btn-primary btn-sm" style={{ marginTop: 16, display: 'inline-flex' }}>Find people</Link>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post._id} post={post} currentUserId={user?._id}
              onLike={handleLike} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Sidebar */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 14, color: 'var(--text-secondary)' }}>Your profile</div>
          <Link to={`/profile/${user?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Avatar user={user} size="md" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{user?.displayName}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>@{user?.username}</div>
            </div>
          </Link>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Friends', value: user?.friendCount || 0 },
              { label: 'Posts', value: user?.postCount || 0 },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center', padding: '10px', background: 'var(--cream-dark)', borderRadius: 8 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Friend Requests */}
        {requests.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 14, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Friend Requests
              <span className="badge badge-accent">{requests.length}</span>
            </div>
            {requests.map(req => (
              <div key={req._id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <Avatar user={req.requester} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.requester.displayName}
                  </div>
                </div>
                <button onClick={() => handleAccept(req)} className="btn btn-primary btn-sm">Accept</button>
              </div>
            ))}
            <Link to="/friends" style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 500 }}>View all →</Link>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 14, color: 'var(--text-secondary)' }}>
              People you may know
            </div>
            {suggestions.map(sug => (
              <div key={sug._id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <Link to={`/profile/${sug._id}`}>
                  <Avatar user={sug} size="sm" />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sug.displayName}
                  </div>
                  {sug.mutualCount > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{sug.mutualCount} mutual</div>
                  )}
                </div>
                <button onClick={() => handleSendRequest(sug._id)} className="btn btn-secondary btn-sm">+</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
