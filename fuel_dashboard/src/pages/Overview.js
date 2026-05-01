// src/pages/Overview.js
import React from 'react';
import { StatCard, StatusBadge, SectionHeader, GaugeCard } from '../components/Cards';

export default function Overview({ data, safetyStatus, connected, history }) {
  const statusColors = {
    SAFE:    { bg: '#EBF7EF', color: '#2D7D46', border: '#BBE5C8' },
    WARNING: { bg: '#FEF3C7', color: '#B45309', border: '#FCD975' },
    DANGER:  { bg: '#FDECEA', color: '#C0392B', border: '#F5B5B0' },
  };
  const sc = statusColors[safetyStatus] || statusColors.SAFE;

  // Gas gauge — map gasPPM (0–10000) to 0–100%
  const gasPPM    = data.gasPPM ?? 0;
  const gasPct    = Math.min(100, Math.round((gasPPM / 10000) * 100));
  const gasStatus = data.gasLevel === 'DANGER'  ? 'danger'
                  : data.gasLevel === 'WARNING' ? 'warning'
                  : 'safe';

  // Pressure gauge — pressurePct already 0–100 from ESP32
  const pressurePct    = Math.min(100, Math.max(0, data.pressurePct ?? 0));
  const pressureStatus = data.pressureLevel === 'DANGER'  ? 'danger'
                       : data.pressureLevel === 'WARNING' ? 'warning'
                       : 'safe';

  return (
    <div className="animate-in">
      <SectionHeader title="Station Overview" subtitle="Real-time monitoring of all fuel station parameters" />

      {/* Status banner */}
      <div style={{
        background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 'var(--radius)',
        padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: sc.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#fff', flexShrink: 0,
        }}>
          {safetyStatus === 'SAFE' ? '✓' : safetyStatus === 'WARNING' ? '⚠' : '✕'}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: sc.color }}>Station Status: {safetyStatus}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
            {safetyStatus === 'SAFE'    && 'All systems operating normally. No hazards detected.'}
            {safetyStatus === 'WARNING' && 'Elevated reading detected. Monitor closely.'}
            {safetyStatus === 'DANGER'  && 'Critical hazard detected! Immediate action required.'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', textAlign: 'right' }}>
          <div>{connected ? '🟢 Firebase Live' : '🔴 Disconnected'}</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--mono)' }}>
            Last reading: {data.lastUpdated ?? 'N/A'}
          </div>
        </div>
      </div>

      {/* Gas + Pressure Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
        <GaugeCard
          label="Gas Concentration"
          value={gasPct}
          unit={`${gasPPM} PPM · MQ-2 Sensor`}
          status={gasStatus}
          rawValue={gasPPM}
        />
        <GaugeCard
          label="Tank Pressure"
          value={pressurePct}
          unit={`Raw: ${data.pressureRaw ?? 0} · HX711`}
          status={pressureStatus}
          rawValue={data.pressureRaw ?? 0}
        />
      </div>

      {/* Threshold legends */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          {
            title: '💨 Gas Thresholds (PPM)',
            zones: [
              { label: 'Safe',    range: '0 – 3,000',      color: '#2D7D46', bg: '#EBF7EF', border: '#BBE5C8' },
              { label: 'Warning', range: '3,000 – 5,000',  color: '#B45309', bg: '#FEF3C7', border: '#FCD975' },
              { label: 'Danger',  range: '> 5,000',        color: '#C0392B', bg: '#FDECEA', border: '#F5B5B0' },
            ],
          },
          {
            title: '🔵 Pressure Thresholds (raw)',
            zones: [
              { label: 'Safe',    range: '0 – 50,000',         color: '#2D7D46', bg: '#EBF7EF', border: '#BBE5C8' },
              { label: 'Warning', range: '50,000 – 300,000',   color: '#B45309', bg: '#FEF3C7', border: '#FCD975' },
              { label: 'Danger',  range: '> 800,000',          color: '#C0392B', bg: '#FDECEA', border: '#F5B5B0' },
            ],
          },
        ].map(({ title, zones }) => (
          <div key={title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>{title}</div>
            {zones.map(z => (
              <div key={z.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 6, marginBottom: 4,
                background: z.bg, border: `1px solid ${z.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: z.color, display: 'inline-block' }}/>
                  <span style={{ fontSize: 12, fontWeight: 600, color: z.color }}>{z.label}</span>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: z.color }}>{z.range}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Quick stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Fire Detected" value={data.fire     ? 'YES' : 'NO'} status={data.fire     ? 'danger' : 'safe'} icon="🔥" />
        <StatCard label="Gas Leak"      value={data.gasLeak  ? 'YES' : 'NO'} status={data.gasLeak  ? 'danger' : 'safe'} icon="💨" />
        <StatCard label="Hazard Type"   value={data.hazardType ?? 'NONE'}    status={data.hazardType && data.hazardType !== 'NONE' ? 'danger' : 'safe'} icon="⚠️" />
        <StatCard label="Queue Count"   value={data.queueCount ?? 0} unit="vehicles" status="neutral" icon="🚗" />
      </div>

      {/* Live sensor status */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text)' }}>Live Sensor Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <StatusBadge label="Flame Sensor"      active={data.fire}          activeColor="var(--danger)" activeBg="var(--danger-bg)" />
          <StatusBadge label="Gas Sensor (MQ-2)" active={data.gasLeak}       activeColor="var(--danger)" activeBg="var(--danger-bg)" />
          <StatusBadge label="Smoke Detected"    active={data.smokeDetected} activeColor="var(--warn)"   activeBg="var(--warn-bg)"   />
          <StatusBadge label="Pressure Sensor"   active={data.highPressure}  activeColor="var(--warn)"   activeBg="var(--warn-bg)"   />
          <StatusBadge label="Queue IR Sensors"  active={false}              activeColor="var(--accent)" activeBg="var(--accent-light)" />
        </div>
      </div>

      {/* Recent readings table */}
      {history.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text)' }}>Recent Readings</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  {['Time', 'Gas PPM', 'Gas Level', 'Pressure %', 'Press. Level', 'Queue', 'Fire'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text3)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 8).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', opacity: 1 - i * 0.07 }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: 'var(--text3)', fontSize: 11 }}>{row.time}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)' }}>{row.gasPPM ?? '—'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                        background: row.gasLevel === 'DANGER' ? '#FDECEA' : row.gasLevel === 'WARNING' ? '#FEF3C7' : '#EBF7EF',
                        color:      row.gasLevel === 'DANGER' ? '#C0392B' : row.gasLevel === 'WARNING' ? '#B45309' : '#2D7D46',
                      }}>{row.gasLevel ?? 'SAFE'}</span>
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)' }}>{row.pressurePct ?? 0}%</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                        background: row.pressureLevel === 'DANGER' ? '#FDECEA' : row.pressureLevel === 'WARNING' ? '#FEF3C7' : '#EBF7EF',
                        color:      row.pressureLevel === 'DANGER' ? '#C0392B' : row.pressureLevel === 'WARNING' ? '#B45309' : '#2D7D46',
                      }}>{row.pressureLevel ?? 'SAFE'}</span>
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)' }}>{row.queueCount}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ color: row.fire ? 'var(--danger)' : 'var(--safe)', fontWeight: row.fire ? 700 : 400 }}>
                        {row.fire ? '🔥 FIRE' : '✓ Clear'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
