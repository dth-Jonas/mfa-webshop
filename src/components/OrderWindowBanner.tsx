'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OrderWindow } from '../lib/types';

export default function OrderWindowBanner() {
  const [activeWindow, setActiveWindow] = useState<OrderWindow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suche nach dem aktuell aktiven Bestellfenster
    const q = query(collection(db, 'orderWindows'), where('isActive', '==', true));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        setActiveWindow({ id: docData.id, ...docData.data() } as OrderWindow);
      } else {
        setActiveWindow(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading || !activeWindow) return null;

  return (
    <div className="bg-blue-600 text-white text-center py-2 px-4 text-xs font-bold shadow-sm">
      🔔 {activeWindow.title} – Bestellungen sind noch bis zum {new Date(activeWindow.endDate).toLocaleDateString('de-DE')} möglich!
    </div>
  );
}
