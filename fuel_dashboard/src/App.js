// src/App.js
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import SafetyMonitoring from './pages/SafetyMonitoring';
import FireDetection from './pages/FireDetection';
import QueueMonitor from './pages/QueueMonitor';
import AlertsReports from './pages/AlertsReports';
import MLInsights from './pages/MLInsights';
import ChatbotAgent from './pages/ChatbotAgent';
import FloatingChat from './components/FloatingChat';
import { useFirebaseData } from './hooks/useFirebaseData';
import { useMLInsights } from './hooks/useMLInsights';

export default function App() {
  const [page, setPage] = useState('overview');
  const { data, connected, history, alerts, safetyStatus } = useFirebaseData();
  const { mlData, mlConnected } = useMLInsights();

  const dangerAlerts = alerts.filter(a => a.severity === 'danger').length;

  const pages = {
    overview: <Overview data={data} safetyStatus={safetyStatus} connected={connected} history={history} />,
    safety:   <SafetyMonitoring data={data} history={history} />,
    fire:     <FireDetection data={data} />,
    queue:    <QueueMonitor data={data} history={history} />,
    alerts:   <AlertsReports alerts={alerts} data={data} />,
    ml:       <MLInsights />,
    chat:     <ChatbotAgent data={data} mlData={mlData} safetyStatus={safetyStatus} history={history} />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        page={page}
        setPage={setPage}
        safetyStatus={safetyStatus}
        connected={connected}
        alertCount={dangerAlerts}
        mlReady={mlConnected}
      />

      <main style={{
        marginLeft: 220, flex: 1, padding: '28px 32px',
        minHeight: '100vh', background: 'var(--bg)',
        maxWidth: 'calc(100vw - 220px)',
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 28 }}>
         
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
           
            {(data.fire || data.gasLeak) && (
              <div style={{
                padding: '5px 14px', borderRadius: 20,
                background: 'var(--danger-bg)', color: 'var(--danger)',
                fontSize: 12, fontWeight: 700, border: '1px solid var(--danger)',
                animation: 'pulse-dot 1s infinite',
              }}>
                ⚠ CRITICAL ALERT ACTIVE
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div key={page}>{pages[page]}</div>
      </main>

      {/* Floating chat widget — visible on ALL pages */}
      <FloatingChat
        data={data}
        mlData={mlData}
        safetyStatus={safetyStatus}
      />
    </div>
  );
}
