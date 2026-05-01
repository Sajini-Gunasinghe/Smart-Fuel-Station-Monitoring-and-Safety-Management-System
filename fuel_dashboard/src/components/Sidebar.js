// src/components/Sidebar.js
import React from 'react';

const navItems = [
  { id: 'overview', label: 'Overview',          icon: '⬡' },
  { id: 'safety',   label: 'Safety Monitoring',  icon: '◈' },
  { id: 'fire',     label: 'Fire Detection',     icon: '◉' },
  { id: 'queue',    label: 'Queue Monitor',      icon: '▤' },
  { id: 'alerts',   label: 'Alerts & Reports',   icon: '◎' },
  { id: 'ml',       label: 'ML Insights',        icon: '◆' },
  { id: 'chat',     label: 'AI Assistant',       icon: '◐' },
];

export default function Sidebar({ page, setPage, safetyStatus, connected, alertCount, mlReady }) {
  const statusColor = safetyStatus === 'SAFE'    ? 'var(--safe)'
                    : safetyStatus === 'WARNING'  ? 'var(--warn)'
                    : 'var(--danger)';

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'var(--surface)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#fff', fontWeight: 600, flexShrink: 0,
          }}>⛽</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>SmartFuel</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.2 }}>Station Monitor</div>
          </div>
        </div>
      </div>

      {/* Connection */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12,
          color: connected ? 'var(--safe)' : 'var(--danger)' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? 'var(--safe)' : 'var(--danger)',
            display: 'inline-block',
            animation: connected ? 'pulse-dot 2s infinite' : 'none',
          }}/>
          {connected ? 'Live — Firebase connected' : 'Disconnected'}
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6,
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>Station Status</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: safetyStatus === 'SAFE'    ? 'var(--safe-bg)'
                    : safetyStatus === 'WARNING'  ? 'var(--warn-bg)'
                    : 'var(--danger-bg)',
          color: statusColor,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
            background: statusColor, display: 'inline-block' }}/>
          {safetyStatus}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: page === item.id ? 'var(--accent-light)' : 'transparent',
            color: page === item.id ? 'var(--accent)' : 'var(--text2)',
            fontWeight: page === item.id ? 600 : 400, fontSize: 13,
            marginBottom: 2, transition: 'all 0.15s ease', textAlign: 'left',
          }}>
            <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>
              {item.icon}
            </span>
            {item.label}
            {item.id === 'alerts' && alertCount > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--danger)', color: '#fff',
                borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700,
              }}>{alertCount}</span>
            )}
            {item.id === 'ml' && (
              <span style={{
                marginLeft: 'auto',
                background: mlReady ? 'var(--safe-bg)' : 'var(--surface2)',
                color: mlReady ? 'var(--safe)' : 'var(--text3)',
                border: `1px solid ${mlReady ? '#BBE5C8' : 'var(--border)'}`,
                borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700,
              }}>{mlReady ? 'LIVE' : 'PENDING'}</span>
            )}
            {item.id === 'chat' && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700,
              }}>AI</span>
            )}
          </button>
        ))}
      </nav>

  
    </aside>
  );
}
