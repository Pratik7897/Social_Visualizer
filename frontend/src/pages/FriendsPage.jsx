import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { friendsAPI } from '../utils/api';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/layout/Avatar';

export default function FriendsPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([friendsAPI.getAll(), friendsAPI.getRequests(), friendsAPI.getSent()])
      .then(([fRes, rRes, sRes]) => {
        setFriends(fRes.data.friends);
        setRequests(rRes.data.requests);
        setSent(sRes.data.sent);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (req) => {
    await friendsAPI.accept(req._id);
    setRequests(prev => prev.filter(r => r._id !== req._id));
    const newFriend = { ...req.requester, mutualCount: 0 };
    setFriends(prev => [...prev, newFriend]);
    addToast(`You and ${req.requester.displayName} are now friends!`, 'success');
  };

  const handleReject = async (req) => {
    await friendsAPI.reject(req._id);
    setRequests(prev => prev.filter(r => r._id !== req._id));
    addToast('Request declined', 'info');
  };

  const handleUnfriend = async (friend) => {
    if (!window.confirm(`Unfriend ${friend.displayName}?`)) return;
    await friendsAPI.unfriend(friend._id);
    setFriends(prev => prev.filter(f => f._id !== friend._id));
    addToast('Unfriended', 'info');
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const TABS = [
    { key: 'friends', label: `Friends (${friends.length})` },
    { key: 'requests', label: `Requests${requests.length ? ` (${requests.length})` : ''}` },
    { key: 'sent', label: 'Sent' },
  ];

  return (
    <div className="page fade-in">
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.75rem', marginBottom: 24 }}>
        Your Network
      </h1>

      <div className="tab-bar" style={{ maxWidth: 400 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {friends.length === 0 ? (
            <div className="empty-state card" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state-icon">◈</div>
              <p>No friends yet. Search for people to connect!</p>
              <Link to="/search" className="btn btn-primary btn-sm" style={{ marginTop: 12, display: 'inline-flex' }}>Find People</Link>
            </div>
          ) : friends.map(friend => (
            <div key={friend._id} className="card" style={{ padding: '20px' }}>
              <Link to={`/profile/${friend._id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, textDecoration: 'none' }}>
                <Avatar user={friend} size="md" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{friend.displayName}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>@{friend.username}</div>
                </div>
              </Link>
              {friend.bio && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {friend.bio}
                </p>
              )}
              {friend.occupation && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: 12 }}>
                  {friend.occupation}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                {friend.mutualCount > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--teal)' }}>{friend.mutualCount} mutual</span>
                )}
                <button onClick={() => handleUnfriend(friend)} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: 'var(--rose)' }}>
                  Unfriend
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
          {requests.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon">◎</div>
              <p>No pending friend requests.</p>
            </div>
          ) : requests.map(req => (
            <div key={req._id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Link to={`/profile/${req.requester._id}`}>
                  <Avatar user={req.requester} size="md" />
                </Link>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{req.requester.displayName}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>@{req.requester.username}</div>
                  {req.requester.bio && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>{req.requester.bio}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleAccept(req)} className="btn btn-primary btn-sm">Accept</button>
                  <button onClick={() => handleReject(req)} className="btn btn-secondary btn-sm">Decline</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sent */}
      {tab === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
          {sent.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon">◎</div>
              <p>No pending sent requests.</p>
            </div>
          ) : sent.map(req => (
            <div key={req._id} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar user={req.recipient} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{req.recipient.displayName}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>@{req.recipient.username}</div>
              </div>
              <span className="badge badge-stone">Pending</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
