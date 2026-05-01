// src/pages/FireDetection.js
import React from 'react';
import { SectionHeader } from '../components/Cards';

const zones = ['Zone 1\nPump A', 'Zone 2\nPump B', 'Zone 3\nPump C', 'Zone 4\nStorage', 'Zone 5\nEntry', 'Zone 6\nOffice'];

export default function FireDetection({ data }) {
  // For demo: if fire is true, zone 1 is affected (in real system you'd have per-zone sensors)
  const affectedZones = data.fire ? [0] : [];

  const bucketStatus = data.fire ? 'DEPLOYED' : 'READY';
  const bucketColor = data.fire ? 'var(--danger)' : 'var(--safe)';
  const bucketBg = data.fire ? 'var(--danger-bg)' : 'var(--safe-bg)';

  return (
    <div className="animate-in">
      <SectionHeader title="Fire Detection & Analysis" subtitle="Zone-based fire monitoring and suppression status" />

      {/* Fire alert banner */}
      {data.fire && (
        <div style={{
          background: 'var(--danger-bg)', border: '2px solid var(--danger)', borderRadius: 'var(--radius)',
          padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
          animation: 'pulse-dot 1s infinite',
        }}>
          <span style={{ fontSize: 28 }}>🔥</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>FIRE DETECTED — CRITICAL ALERT</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Sand bucket suppression has been automatically activated. Evacuate immediately.</div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Fire Zones', value: affectedZones.length, color: data.fire ? 'var(--danger)' : 'var(--safe)' },
          { label: 'Total Zones', value: 6, color: 'var(--text)' },
          { label: 'Flame Sensor', value: data.fire ? 'FIRE' : 'CLEAR', color: data.fire ? 'var(--danger)' : 'var(--safe)' },
          { label: 'Sand Bucket', value: bucketStatus, color: bucketColor },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Zone grid */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Station Zone Map</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Click a zone for details. Red = fire detected.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {zones.map((zone, i) => {
            const isAffected = affectedZones.includes(i);
            return (
              <div key={i} style={{
                padding: '18px 14px', borderRadius: 10, textAlign: 'center',
                background: isAffected ? 'var(--danger-bg)' : 'var(--surface2)',
                border: `2px solid ${isAffected ? 'var(--danger)' : 'var(--border)'}`,
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{isAffected ? '🔥' : '✅'}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: isAffected ? 'var(--danger)' : 'var(--text)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>{zone}</div>
                <div style={{ fontSize: 10, marginTop: 6, color: isAffected ? 'var(--danger)' : 'var(--safe)', fontWeight: 600 }}>
                  {isAffected ? 'DANGER' : 'SAFE'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sand bucket suppression status */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sand Bucket Suppression System</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {zones.map((zone, i) => {
            const isDeployed = data.fire && i === 0;
            return (
              <div key={i} style={{
                padding: '12px', borderRadius: 8, textAlign: 'center',
                background: isDeployed ? 'var(--danger-bg)' : 'var(--safe-bg)',
                border: `1px solid ${isDeployed ? 'var(--danger)' : '#BBE5C8'}`,
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{isDeployed ? '🪣' : '🟢'}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: isDeployed ? 'var(--danger)' : 'var(--safe)' }}>
                  {isDeployed ? 'DEPLOYED' : 'READY'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{zone.split('\n')[0]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
          <strong>Servo Motor (SG90):</strong> Currently at {data.fire ? '90° (drop position — sand released)' : '0° (hold position — sand retained)'}
        </div>
      </div>
    </div>
  );
}
