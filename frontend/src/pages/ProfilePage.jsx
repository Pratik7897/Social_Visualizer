import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usersAPI, postsAPI, friendsAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/layout/Avatar';
import GraphViz from '../components/dsvis/GraphViz';

function PostItem({ post, onDelete, isOwner }) {
  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d);
    const h = Math.floor(diff / 3600000);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };
  return (
    <div className="card" style={{ padding: '16px 20px', marginBottom: 12 }}>
      <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: 10 }}>{post.content}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--stone)' }}>
          {timeAgo(post.createdAt)} · {post.likeCount} likes
        </div>
        {isOwner && (
          <button onClick={() => onDelete(post._id)} style={{ fontSize: '0.75rem', color: 'var(--rose)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts');
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [isRequester, setIsRequester] = useState(null);
  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      usersAPI.getUser(id),
      postsAPI.getUserPosts(id),
      usersAPI.getUserGraph(id),
    ]).then(([uRes, pRes, gRes]) => {
      setProfile(uRes.data);
      setPosts(pRes.data.posts);
      setGraphData(gRes.data);
      setFriendshipStatus(uRes.data.friendshipStatus);
      setIsRequester(uRes.data.isRequester);
    }).catch(() => addToast('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSendRequest = async () => {
    await friendsAPI.sendRequest(id);
    setFriendshipStatus('pending');
    setIsRequester(true);
    addToast('Friend request sent!', 'success');
  };

  const handleAcceptRequest = async () => {
    const friendships = await friendsAPI.getRequests();
    const req = friendships.data.requests.find(r => r.requester._id === id);
    if (req) {
      await friendsAPI.accept(req._id);
      setFriendshipStatus('accepted');
      addToast('You are now friends!', 'success');
    }
  };

  const handleUnfriend = async () => {
    if (!window.confirm('Unfriend this person?')) return;
    await friendsAPI.unfriend(id);
    setFriendshipStatus(null);
    addToast('Unfriended', 'info');
  };

  const handleDeletePost = async (postId) => {
    await postsAPI.delete(postId);
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!profile) return <div className="page">User not found</div>;

  const { user, mutualFriends = [], mutualCount = 0, degreesOfSeparation } = profile;

  const renderActionButton = () => {
    if (isOwnProfile) return null;
    if (friendshipStatus === 'accepted') return (
      <button onClick={handleUnfriend} className="btn btn-secondary">◈ Friends</button>
    );
    if (friendshipStatus === 'pending' && isRequester) return (
      <button disabled className="btn btn-secondary">Request sent</button>
    );
    if (friendshipStatus === 'pending' && !isRequester) return (
      <button onClick={handleAcceptRequest} className="btn btn-primary">Accept Request</button>
    );
    return <button onClick={handleSendRequest} className="btn btn-primary">+ Connect</button>;
  };

  return (
    <div className="page fade-in">
      {/* Profile header */}
      <div className="card" style={{ padding: '28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar user={user} size="xl" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.2 }}>{user.displayName}</h1>
                <div style={{ fontSize: '0.9375rem', color: 'var(--muted)' }}>@{user.username}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>{renderActionButton()}</div>
            </div>
            {user.bio && <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>{user.bio}</p>}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {user.occupation && <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>💼 {user.occupation}</span>}
              {user.location && <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>📍 {user.location}</span>}
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Friends', value: user.friendCount || 0 },
            { label: 'Posts', value: user.postCount || 0 },
            { label: 'Mutual Friends', value: mutualCount },
            ...(!isOwnProfile && degreesOfSeparation > 0 ? [{ label: 'Degrees of Sep.', value: degreesOfSeparation }] : []),
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: 600, color: 'var(--accent)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mutual friends */}
        {mutualFriends.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex' }}>
              {mutualFriends.slice(0, 4).map((f, i) => (
                <Avatar key={f._id} user={f} size="sm" style={{ marginLeft: i > 0 ? -8 : 0, border: '2px solid white' }} />
              ))}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
              {mutualFriends[0].displayName}{mutualFriends.length > 1 ? ` and ${mutualFriends.length - 1} others` : ''} are mutual friends
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ maxWidth: 400 }}>
        {['posts', 'connections'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {tab === 'posts' && (
        <div>
          {posts.length === 0 ? (
            <div className="empty-state card"><div className="empty-state-icon">◎</div><p>No posts yet.</p></div>
          ) : posts.map(post => (
            <PostItem key={post._id} post={post} onDelete={handleDeletePost} isOwner={isOwnProfile} />
          ))}
        </div>
      )}

      {/* Graph connections */}
      {tab === 'connections' && graphData && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4 }}>Connection Graph</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
              Showing {graphData.nodes.length} nodes, {graphData.edges.length} edges — rendered using BFS traversal
            </div>
          </div>
          <GraphViz graphData={graphData} centerId={id} />
        </div>
      )}
    </div>
  );
}
