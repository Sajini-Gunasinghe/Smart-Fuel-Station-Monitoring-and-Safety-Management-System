// src/pages/QueueMonitor.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { SectionHeader } from '../components/Cards';

const MAX_CAPACITY = 15;

export default function QueueMonitor({ data, history }) {
  const queue = data.queueCount || 0;
  const loadPct = Math.min(100, Math.round((queue / MAX_CAPACITY) * 100));
  const queueStatus = loadPct >= 80 ? 'danger' : loadPct >= 50 ? 'warning' : 'safe';
  const statusColor = queueStatus === 'safe' ? 'var(--safe)' : queueStatus === 'warning' ? 'var(--warn)' : 'var(--danger)';

  // Vehicles as boxes
  const boxes = Array.from({ length: MAX_CAPACITY }, (_, i) => i < queue);

  return (
    <div className="animate-in">
      <SectionHeader title="Queue Monitoring" subtitle="Vehicle queue tracking via IR gate sensors" />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Vehicles in Queue', value: queue, unit: `/ ${MAX_CAPACITY} max`, color: statusColor },
          { label: 'Station Load', value: `${loadPct}%`, color: statusColor },
          { label: 'Queue Status', value: queueStatus.toUpperCase(), color: statusColor },
          { label: 'Available Spots', value: Math.max(0, MAX_CAPACITY - queue), color: 'var(--text)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</div>
            {s.unit && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.unit}</div>}
          </div>
        ))}
      </div>

      {/* Visual queue grid */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Station Capacity View</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Each box = 1 vehicle slot</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {boxes.map((occupied, i) => (
            <div key={i} style={{
              width: 44, height: 36, borderRadius: 6, border: `2px solid ${occupied ? statusColor : 'var(--border)'}`,
              background: occupied ? (queueStatus === 'safe' ? 'var(--safe-bg)' : queueStatus === 'warning' ? 'var(--warn-bg)' : 'var(--danger-bg)') : 'var(--surface2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.3s ease',
            }}>
              {occupied ? '🚗' : ''}
            </div>
          ))}
        </div>

        {/* Load bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
            <span>Station Load</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: statusColor }}>{loadPct}%</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: 'var(--surface2)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{
              height: '100%', borderRadius: 5, width: `${loadPct}%`,
              background: statusColor, transition: 'width 0.5s ease',
            }}/>
          </div>
        </div>
      </div>

      {/* Queue history chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Queue History</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Vehicle count over time</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
            <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, MAX_CAPACITY]}/>
            <Tooltip formatter={(v) => [`${v} vehicles`, 'Queue']} contentStyle={{ fontFamily: 'var(--font)', fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}/>
            <Bar dataKey="queueCount" radius={[3, 3, 0, 0]}>
              {history.map((entry, i) => (
                <Cell key={i} fill={entry.queueCount >= MAX_CAPACITY * 0.8 ? 'var(--danger)' : entry.queueCount >= MAX_CAPACITY * 0.5 ? 'var(--warn)' : '#2D7D46'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
