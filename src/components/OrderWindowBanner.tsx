'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface OrderWindow {
  title?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

export default function OrderWindowBanner() {
  const [activeWindow, setActiveWindow] = useState<OrderWindow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'orderWindows'),
      (snapshot) => {
        if (snapshot.empty) {
          setActiveWindow(null);
          setLoading(false);
          return;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const found = snapshot.docs
          .map((d) => d.data() as OrderWindow)
          .find((w) => {
            if (!w.active) return false;
            const start = w.startDate ? new Date(w.startDate) : null;
            const end = w.endDate ? new Date(w.endDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);

            return (!start || now >= start) && (!end || now <= end);
          });

        setActiveWindow(found || null);
        setLoading(false);
      },
      (err) => {
        console.error('Banner Firestore Error:', err);
        setActiveWindow(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 text-xs font-semibold animate-pulse">
        Status wird geprüft...
      </div>
    );
  }

  if (!activeWindow) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200/80 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span>Bestellfenster aktuell geschlossen</span>
      </div>
    );
  }

  const formattedEnd = activeWindow.endDate
    ? new Date(activeWindow.endDate).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span>Bestellfenster geöffnet {formattedEnd ? `bis ${formattedEnd}` : ''}</span>
    </div>
  );
}
