import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⌂', label: 'Home' },
  { to: '/friends', icon: '◈', label: 'Friends' },
  { to: '/search', icon: '◎', label: 'Search' },
  { to: '/ds-viz', icon: '⬡', label: 'DS Visualizer' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 'var(--nav-width)',
      background: 'var(--card-bg)',
      borderRight: '1px solid var(--card-border)',
      display: 'flex', flexDirection: 'column',
      padding: '0',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--cream-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.875rem', fontWeight: 700,
          }}>SC</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1rem', lineHeight: 1 }}>
              Social Connect
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>ADS Project</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9375rem',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--accent-dark)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-light)' : 'transparent',
              transition: 'all 0.15s ease',
              textDecoration: 'none',
            })}
          >
            <span style={{ fontSize: '1.1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* DS label */}
        <div style={{ marginTop: 16, paddingLeft: 12 }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Data Structures
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12 }}>
          {[
            { label: 'Graph', desc: 'Social network', color: 'var(--teal)' },
            { label: 'B-Tree', desc: 'Post indexing', color: 'var(--rose)' },
          ].map(ds => (
            <div key={ds.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ds.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.2 }}>{ds.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--stone)' }}>{ds.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User profile */}
      {user && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--cream-border)' }}>
          <NavLink
            to={`/profile/${user._id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 'var(--radius-sm)', transition: 'background 0.15s', textDecoration: 'none' }}
            className="hover-bg"
          >
            <Avatar user={user} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>@{user.username}</div>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '8px 12px', marginTop: 6, borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--muted)', background: 'transparent', textAlign: 'left', transition: 'all 0.15s' }}
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
