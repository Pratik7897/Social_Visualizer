import React from 'react';

const COLORS = ['#C17F4A','#3D7A6F','#C4635A','#7A6A9B','#4A7A9B'];

export default function Avatar({ user, size = 'md', className = '' }) {
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    : '?';
  const colorIdx = user?.username ? user.username.charCodeAt(0) % COLORS.length : 0;
  const bg = COLORS[colorIdx];

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{ background: bg + '22', color: bg, border: `1.5px solid ${bg}33` }}
    >
      {initials}
    </div>
  );
}
