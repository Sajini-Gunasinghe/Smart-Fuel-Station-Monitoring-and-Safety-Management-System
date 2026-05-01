// src/hooks/useMLInsights.js
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export function useMLInsights() {
  const [mlData, setMlData] = useState(null);
  const [mlConnected, setMlConnected] = useState(false);

  useEffect(() => {
    const mlRef = ref(db, '/mlInsights');
    const unsub = onValue(mlRef, (snapshot) => {
      if (snapshot.exists()) {
        setMlData(snapshot.val());
        setMlConnected(true);
      }
    }, (error) => {
      console.error('ML insights read error:', error);
      setMlConnected(false);
    });
    return () => unsub();
  }, []);

  return { mlData, mlConnected };
}
