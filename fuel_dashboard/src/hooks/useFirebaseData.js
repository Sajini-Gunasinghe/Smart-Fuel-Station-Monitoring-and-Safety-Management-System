// src/hooks/useFirebaseData.js
import { useState, useEffect, useRef } from 'react';
import { ref, query, limitToLast, onValue } from 'firebase/database';
import { db } from '../firebase';

export function useFirebaseData() {
  const [data, setData] = useState({
    fire: false,
    gasLeak: false,
    gasPPM: 0,
    pressureRaw: 0,
    pressurePct: 0,
    queueCount: 0,
    gasLevel: 'SAFE',
    pressureLevel: 'SAFE',
    highPressure: false,
    lastUpdated: null,
  });
  const [connected, setConnected] = useState(false);
  const [history, setHistory]     = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const prevData                   = useRef(null);

  useEffect(() => {
    // Read only the latest single record from sensorHistory
    const sensorRef = query(ref(db, '/sensorHistory'), limitToLast(1));

    const unsub = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const entries   = snapshot.val();
        const latestKey = Object.keys(entries)[0];
        const val       = entries[latestKey];

        // Derive fields not stored in the 10-field schema
        const gasLevel      = val.gasPPM > 5000        ? 'DANGER'
                            : val.gasPPM > 3000        ? 'WARNING' : 'SAFE';
        const pressureLevel = val.pressureRaw > 800000 ? 'DANGER'
                            : val.pressureRaw > 300000 ? 'WARNING' : 'SAFE';
        const highPressure  = val.pressureRaw > 800000;

        const fullData = {
          ...val,
          gasLevel,
          pressureLevel,
          highPressure,
          lastUpdated: latestKey,
        };

        setConnected(true);
        setData(fullData);

        // Build chart history for trend pages
        setHistory(prev => {
          const entry = {
            time: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            }),
            pressureRaw:   val.pressureRaw || 0,
            pressurePct:   val.pressurePct || 0,
            pressureLevel: pressureLevel,
            queueCount:    val.queueCount  || 0,
            gasPPM:        val.gasPPM      || 0,
            gasLevel:      gasLevel,
            gas:           val.gasLeak ? 1 : 0,
            fire:          val.fire    ? 1 : 0,
          };
          return [...prev, entry].slice(-20);
        });

        // Generate alerts when state changes
        if (prevData.current) {
          const prev = prevData.current;
          const now  = new Date().toLocaleTimeString();
          if (!prev.fire         && val.fire)       setAlerts(a => [{ id: Date.now(), type: 'FIRE',          severity: 'danger',  msg: 'Fire detected! Sand bucket deployed.',    time: now }, ...a].slice(0, 50));
          if (!prev.gasLeak      && val.gasLeak)    setAlerts(a => [{ id: Date.now(), type: 'GAS LEAK',      severity: 'danger',  msg: 'Gas leak confirmed.',                    time: now }, ...a].slice(0, 50));
          if (!prev.highPressure && highPressure)   setAlerts(a => [{ id: Date.now(), type: 'HIGH PRESSURE', severity: 'warning', msg: 'Tank pressure exceeded safe threshold.', time: now }, ...a].slice(0, 50));
          if (prev.fire          && !val.fire)      setAlerts(a => [{ id: Date.now(), type: 'FIRE CLEARED',  severity: 'safe',    msg: 'Fire condition resolved.',               time: now }, ...a].slice(0, 50));
          if (prev.gasLeak       && !val.gasLeak)   setAlerts(a => [{ id: Date.now(), type: 'GAS CLEARED',   severity: 'safe',    msg: 'Gas leak condition resolved.',           time: now }, ...a].slice(0, 50));
        }
        prevData.current = { ...val, highPressure };
      }
    }, (error) => {
      console.error('Firebase read error:', error);
      setConnected(false);
    });

    return () => unsub();
  }, []);

  const safetyStatus = data.fire         ? 'DANGER'
                     : data.gasLeak      ? 'DANGER'
                     : data.highPressure ? 'WARNING'
                     : 'SAFE';

  return { data, connected, history, alerts, safetyStatus };
}