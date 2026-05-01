// src/components/Cards.js
import React from 'react';

export function StatCard({ label, value, unit, status, icon }) {
  const colors = {
    safe: { bg: 'var(--safe-bg)', color: 'var(--safe)', border: '#BBE5C8' },
    warning: { bg: 'var(--warn-bg)', color: 'var(--warn)', border: '#FCD975' },
    danger: { bg: 'var(--danger-bg)', color: 'var(--danger)', border: '#F5B5B0' },
    neutral: { bg: 'var(--surface)', color: 'var(--text)', border: 'var(--border)' },
  };
  const c = colors[status] || colors.neutral;

  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--radius)',
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: 'var(--shadow)', transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 600, color: c.color, fontFamily: 'var(--mono)', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: 'var(--text3)' }}>{unit}</span>}
      </div>
      {status && (
        <div style={{ fontSize: 11, fontWeight: 600, color: c.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {status === 'safe' ? '✓ Safe' : status === 'warning' ? '⚠ Warning' : status === 'danger' ? '✕ Danger' : ''}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ label, active, activeColor = 'var(--danger)', activeBg = 'var(--danger-bg)' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', borderRadius: 'var(--radius-sm)',
      background: active ? activeBg : 'var(--surface2)',
      border: `1px solid ${active ? activeColor : 'var(--border)'}`,
      transition: 'all 0.3s ease',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: active ? activeColor : 'var(--text3)',
        display: 'inline-block',
        animation: active ? 'pulse-dot 1.5s infinite' : 'none',
      }}/>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? activeColor : 'var(--text2)' }}>
        {label}
      </span>
      <span style={{
        marginLeft: 'auto', fontSize: 11, fontWeight: 700,
        color: active ? activeColor : 'var(--text3)',
      }}>
        {active ? 'ACTIVE' : 'NORMAL'}
      </span>
    </div>
  );
}

// 3-zone gauge: safe (green) → warning (amber) → danger (red) zones on the arc
export function GaugeCard({ label, value, max, unit, status, rawValue, safeMax, warnMax }) {
  const pct = Math.min(100, Math.max(0, (value / 100)));

  const zoneColors = { safe: '#2D7D46', warning: '#B45309', danger: '#C0392B' };
  const needleColor = zoneColors[status] || '#6B6860';

  const W = 200, H = 140;
  const cx = W / 2, cy = H - 24;
  const r = 76;
  const toRad = deg => (deg * Math.PI) / 180;

  // Arc spans from 180° (left) to 0° (right) — a semicircle
  const arcStart = 180;
  const arcEnd = 0;
  const totalDeg = 180;

  const ptOnArc = (deg) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  // Zone boundaries in degrees (180 = far left = 0%, 0 = far right = 100%)
  // safe: 0–50%, warning: 50–75%, danger: 75–100%
  const safeDeg   = 180 - totalDeg * 0.50;  // 90°
  const warnDeg   = 180 - totalDeg * 0.75;  // 45°
  const endDeg    = 0;

  const arcPath = (startDeg, endDeg, radius, strokeW) => {
    const s = ptOnArc(startDeg);
    const e = ptOnArc(endDeg);
    const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
    // always sweep counter-clockwise (flag=0) from left to right
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 0 ${e.x} ${e.y}`;
  };

  // Needle angle: maps 0%→180°, 100%→0°
  const needleDeg = 180 - totalDeg * Math.min(1, Math.max(0, value / 100));
  const needleLen = r - 10;
  const needleTip = {
    x: cx + needleLen * Math.cos(toRad(needleDeg)),
    y: cy + needleLen * Math.sin(toRad(needleDeg)),
  };

  const statusLabel = status === 'safe' ? 'SAFE' : status === 'warning' ? 'WARNING' : 'DANGER';
  const statusBg = status === 'safe' ? '#EBF7EF' : status === 'warning' ? '#FEF3C7' : '#FDECEA';
  const statusBorder = status === 'safe' ? '#BBE5C8' : status === 'warning' ? '#FCD975' : '#F5B5B0';

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${statusBorder}`,
      borderRadius: 'var(--radius)', padding: '16px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      boxShadow: 'var(--shadow)', transition: 'border-color 0.4s ease',
      background: statusBg,
    }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Zone arcs — background track */}
        <path d={arcPath(180, safeDeg, r, 10)} fill="none" stroke="#BBE5C8" strokeWidth={10} strokeLinecap="butt"/>
        <path d={arcPath(safeDeg, warnDeg, r, 10)} fill="none" stroke="#FCD975" strokeWidth={10} strokeLinecap="butt"/>
        <path d={arcPath(warnDeg, 0, r, 10)} fill="none" stroke="#F5B5B0" strokeWidth={10} strokeLinecap="butt"/>

        {/* Active filled arc up to current value */}
        {value > 0 && (
          <path
            d={arcPath(180, needleDeg, r, 10)}
            fill="none"
            stroke={needleColor}
            strokeWidth={10}
            strokeLinecap="butt"
            style={{ transition: 'all 0.6s ease' }}
          />
        )}

        {/* Zone tick marks */}
        {[0, 50, 75, 100].map((pct, i) => {
          const deg = 180 - totalDeg * (pct / 100);
          const inner = { x: cx + (r - 16) * Math.cos(toRad(deg)), y: cy + (r - 16) * Math.sin(toRad(deg)) };
          const outer = { x: cx + (r + 2) * Math.cos(toRad(deg)), y: cy + (r + 2) * Math.sin(toRad(deg)) };
          return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#fff" strokeWidth={2}/>;
        })}

        {/* Zone labels below arc */}
        <text x={14} y={cy + 18} textAnchor="middle" fill="#2D7D46" fontSize={9} fontWeight={600}>SAFE</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="#B45309" fontSize={9} fontWeight={600}>WARN</text>
        <text x={W - 14} y={cy + 18} textAnchor="middle" fill="#C0392B" fontSize={9} fontWeight={600}>DANGER</text>

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleTip.x} y2={needleTip.y}
          stroke={needleColor} strokeWidth={2.5} strokeLinecap="round"
          style={{ transition: 'all 0.6s ease' }}
        />
        <circle cx={cx} cy={cy} r={5} fill={needleColor} style={{ transition: 'fill 0.4s ease' }}/>

        {/* Center value display */}
        <text x={cx} y={cy - 20} textAnchor="middle" fill={needleColor} fontFamily="monospace" fontSize={20} fontWeight={700}>
          {value}%
        </text>
        {rawValue !== undefined && (
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#9C9A94" fontFamily="monospace" fontSize={9}>
            raw: {rawValue}
          </text>
        )}
      </svg>

      {/* Label */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{label}</div>
      {unit && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{unit}</div>}

      {/* Status pill */}
      <div style={{
        marginTop: 8, padding: '4px 14px', borderRadius: 20,
        background: statusBg, border: `1px solid ${statusBorder}`,
        fontSize: 11, fontWeight: 700, color: needleColor,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: needleColor,
          display: 'inline-block',
          animation: status !== 'safe' ? 'pulse-dot 1.5s infinite' : 'none',
        }}/>
        {statusLabel}
      </div>
    </div>
  );
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--text3)' }}>{subtitle}</p>}
    </div>
  );
}
