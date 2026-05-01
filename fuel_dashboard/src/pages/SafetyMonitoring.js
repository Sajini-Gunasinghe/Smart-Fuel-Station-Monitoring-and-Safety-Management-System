// src/pages/SafetyMonitoring.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
         CartesianGrid, AreaChart, Area } from 'recharts';
import { SectionHeader } from '../components/Cards';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <div style={{ color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontFamily: 'var(--mono)' }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Semicircle gauge — self contained, no overflow ────────────────
function GaugeChart({ label, pct, displayValue, unit, status }) {
  const C = {
    safe:    { track: '#BBE5C8', fill: '#2D7D46', text: '#2D7D46', bg: '#EBF7EF', border: '#BBE5C8' },
    warning: { track: '#FCD975', fill: '#B45309', text: '#B45309', bg: '#FEF3C7', border: '#FCD975' },
    danger:  { track: '#F5B5B0', fill: '#C0392B', text: '#C0392B', bg: '#FDECEA', border: '#F5B5B0' },
  };
  const c = C[status] || C.safe;

  const W  = 180;
  const H  = 110;
  const cx = W / 2;
  const cy = H - 8;
  const r  = 72;
  const sw = 13;

  const toRad  = d => d * Math.PI / 180;
  const pt     = d => ({ x: cx + r * Math.cos(toRad(d)), y: cy + r * Math.sin(toRad(d)) });
  const arc    = (d1, d2, laf) => { const s = pt(d1), e = pt(d2); return `M${s.x} ${s.y} A${r} ${r} 0 ${laf} 1 ${e.x} ${e.y}`; };

  // Zone arcs — safe 0-50%, warning 50-75%, danger 75-100%
  const zonePath = (p1, p2) => {
    const d1  = 180 - 180 * p1 / 100;
    const d2  = 180 - 180 * p2 / 100;
    const laf = (p2 - p1) > 50 ? 1 : 0;
    return arc(d1, d2, laf);
  };

  // Active fill arc
  const fillPath = () => {
    const safe = Math.min(100, Math.max(0, pct));
    if (safe === 0) return null;
    const d1  = 180;
    const d2  = 180 - 180 * safe / 100;
    const laf = safe > 50 ? 1 : 0;
    return arc(d1, d2, laf);
  };

  const fp = fillPath();

  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius)', padding: '14px 10px 14px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      boxShadow: 'var(--shadow)', transition: 'all 0.3s',
    }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Zone background arcs */}
        <path d={zonePath(0,  50)} fill="none" stroke="#BBE5C8" strokeWidth={sw} strokeLinecap="butt"/>
        <path d={zonePath(50, 75)} fill="none" stroke="#FCD975" strokeWidth={sw} strokeLinecap="butt"/>
        <path d={zonePath(75,100)} fill="none" stroke="#F5B5B0" strokeWidth={sw} strokeLinecap="butt"/>

        {/* Filled arc */}
        {fp && (
          <path d={fp} fill="none" stroke={c.fill} strokeWidth={sw}
            strokeLinecap="round" style={{ transition: 'all 0.6s ease' }}/>
        )}

        {/* Tick dividers between zones */}
        {[0, 50, 75, 100].map((p, i) => {
          const deg   = 180 - 180 * p / 100;
          const inner = { x: cx + (r - sw - 1) * Math.cos(toRad(deg)), y: cy + (r - sw - 1) * Math.sin(toRad(deg)) };
          const outer = { x: cx + (r + 1)       * Math.cos(toRad(deg)), y: cy + (r + 1)       * Math.sin(toRad(deg)) };
          return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
            stroke="var(--bg)" strokeWidth={2}/>;
        })}

        {/* Zone labels */}
        <text x={10}      y={cy + 14} textAnchor="middle" fontSize={8} fontWeight={700} fill="#2D7D46">SAFE</text>
        <text x={cx}      y={cy - r + 2} textAnchor="middle" fontSize={8} fontWeight={700} fill="#B45309">WARN</text>
        <text x={W - 10}  y={cy + 14} textAnchor="middle" fontSize={8} fontWeight={700} fill="#C0392B">DANGER</text>

        {/* Centre value */}
        <text x={cx} y={cy - 24} textAnchor="middle" dominantBaseline="central"
          fontSize={20} fontWeight={700} fill={c.text} fontFamily="var(--mono)"
          style={{ transition: 'fill 0.3s' }}>
          {displayValue}
        </text>
        <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central"
          fontSize={9} fill="var(--text3)" fontFamily="var(--font)">
          {unit}
        </text>
      </svg>

      {/* Label */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)',
        marginTop: 2, textAlign: 'center' }}>{label}</div>

      {/* Status pill */}
      <div style={{
        marginTop: 8, padding: '3px 12px', borderRadius: 20,
        background: 'white', border: `1px solid ${c.border}`,
        fontSize: 10, fontWeight: 700, color: c.text,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%', background: c.fill,
          display: 'inline-block',
          animation: status !== 'safe' ? 'pulse-dot 1.5s infinite' : 'none',
        }}/>
        {status === 'safe' ? 'SAFE' : status === 'warning' ? 'WARNING' : 'DANGER'}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function SafetyMonitoring({ data, history }) {
  const pressureStatus = data.highPressure ? 'warning' : 'safe';
  const gasStatus      = data.gasLeak      ? 'danger'  : 'safe';
  const fireStatus     = data.fire         ? 'danger'  : 'safe';

  const gasPct      = Math.min(100, Math.round(((data.gasPPM      ?? 0) / 10000) * 100));
  const pressurePct = Math.min(100, Math.max(0, data.pressurePct ?? 0));

  return (
    <div className="animate-in">
      <SectionHeader title="Safety Monitoring" subtitle="Live sensor readings and historical trends"/>

      {/* 3 gauge charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <GaugeChart label="Gas Concentration"
          pct={gasPct} displayValue={`${gasPct}%`}
          unit={`${data.gasPPM ?? 0} PPM`} status={gasStatus}/>
        <GaugeChart label="Flame Sensor"
          pct={data.fire ? 100 : 0} displayValue={data.fire ? 'FIRE' : 'OK'}
          unit="IR Photodiode" status={fireStatus}/>
        <GaugeChart label="Tank Pressure"
          pct={pressurePct} displayValue={`${pressurePct}%`}
          unit={`Raw: ${data.pressureRaw ?? 0}`} status={pressureStatus}/>
      </div>

      {/* Gas trend */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Gas Concentration Trend</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
          Gas PPM over time · Safe &lt;3000 · Warning 3000–5000 · Danger &gt;5000
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#C0392B" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#C0392B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
            <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="gasPPM" name="Gas PPM" stroke="#C0392B" strokeWidth={2} fill="url(#gradG)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Safe',    range: '0–3,000',     color: '#2D7D46', bg: '#EBF7EF' },
            { label: 'Warning', range: '3,000–5,000', color: '#B45309', bg: '#FEF3C7' },
            { label: 'Danger',  range: '>5,000',      color: '#C0392B', bg: '#FDECEA' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 6, background: t.bg, fontSize: 11 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%',
                background: t.color, display: 'inline-block' }}/>
              <span style={{ color: t.color, fontWeight: 600 }}>{t.label}:</span>
              <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{t.range} PPM</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pressure trend */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Pressure Trend</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Raw HX711 sensor values over time</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#E8622A" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#E8622A" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
            <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="pressureRaw" name="Pressure" stroke="#E8622A" strokeWidth={2} fill="url(#gradP)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Queue trend */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Queue Count Trend</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Vehicles in station over time</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
            <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} allowDecimals={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Line type="stepAfter" dataKey="queueCount" name="Vehicles" stroke="#2D7D46" strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Hazard events */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Hazard Events Timeline</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>1 = active, 0 = clear</div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
            <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} domain={[0, 1.2]} ticks={[0, 1]}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Line type="stepAfter" dataKey="gas"  name="Gas Leak" stroke="#C0392B" strokeWidth={2} dot={false}/>
            <Line type="stepAfter" dataKey="fire" name="Fire"     stroke="#E8622A" strokeWidth={2} dot={false} strokeDasharray="4 2"/>
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 16, height: 2, background: '#C0392B', display: 'inline-block' }}/> Gas Leak
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 16, height: 2, background: '#E8622A', display: 'inline-block' }}/> Fire
          </span>
        </div>
      </div>
    </div>
  );
}
