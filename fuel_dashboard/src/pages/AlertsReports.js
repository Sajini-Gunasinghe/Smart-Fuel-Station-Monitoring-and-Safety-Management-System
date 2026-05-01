// src/pages/AlertsReports.js
import React, { useState } from 'react';
import { SectionHeader } from '../components/Cards';

export default function AlertsReports({ alerts, data }) {
  const [filter, setFilter] = useState('ALL');

  const severityColors = {
    danger: { bg: 'var(--danger-bg)', color: 'var(--danger)', border: '#F5B5B0' },
    warning: { bg: 'var(--warn-bg)', color: 'var(--warn)', border: '#FCD975' },
    safe: { bg: 'var(--safe-bg)', color: 'var(--safe)', border: '#BBE5C8' },
  };

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.severity === filter.toLowerCase());

  const counts = {
    danger: alerts.filter(a => a.severity === 'danger').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    safe: alerts.filter(a => a.severity === 'safe').length,
  };

  const handleExport = () => {
    const rows = [
      ['Time', 'Type', 'Severity', 'Message'],
      ...alerts.map(a => [a.time, a.type, a.severity.toUpperCase(), a.msg])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fuel_station_alerts.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in">
      <SectionHeader title="Alerts & Reports" subtitle="System event log and exportable incident reports" />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Alerts', value: alerts.length, color: 'var(--text)' },
          { label: 'Critical', value: counts.danger, color: 'var(--danger)' },
          { label: 'Warnings', value: counts.warning, color: 'var(--warn)' },
          { label: 'Resolved', value: counts.safe, color: 'var(--safe)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter + Export bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {['ALL', 'DANGER', 'WARNING', 'SAFE'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              background: filter === f ? 'var(--accent-light)' : 'var(--surface)',
              color: filter === f ? 'var(--accent)' : 'var(--text2)',
              fontSize: 12, fontWeight: filter === f ? 600 : 400, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>{f}</button>
          ))}
        </div>
        <button onClick={handleExport} style={{
          padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ↓ Export CSV
        </button>
      </div>

      {/* Alerts list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>No alerts recorded yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Alerts will appear here when sensor thresholds are exceeded</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Time', 'Alert Type', 'Severity', 'Description'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert, i) => {
                const c = severityColors[alert.severity] || severityColors.safe;
                return (
                  <tr key={alert.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{alert.time}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                        {alert.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ color: c.color, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{alert.severity}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{alert.msg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Current sensor state reference */}
      <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Current Sensor State</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: 'Fire', value: String(data.fire), bad: data.fire },
            { label: 'Gas Leak', value: String(data.gasLeak), bad: data.gasLeak },
            { label: 'High Pressure', value: String(data.highPressure), bad: data.highPressure },
            { label: 'Pressure Raw', value: data.pressureRaw, bad: false },
            { label: 'Queue Count', value: data.queueCount, bad: false },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', color: s.bad ? 'var(--danger)' : 'var(--text)' }}>
                {String(s.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
