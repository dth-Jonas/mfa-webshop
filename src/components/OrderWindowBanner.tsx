'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ActiveWindowData {
  title?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

export default function OrderWindowBanner() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [endDateFormatted, setEndDateFormatted] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Echtzeit-Listener auf die aktiven Fenster
    const q = query(collection(db, 'order_windows'), where('active', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // KEIN AKTIVES FENSTER GEFUNDEN -> SHOP IST DEDEFINITIV GESCHLOSSEN
        setIsOpen(false);
        setEndDateFormatted(null);
        setLoading(false);
        return;
      }

      const activeDoc = snapshot.docs[0].data() as ActiveWindowData;
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const start = activeDoc.startDate ? new Date(activeDoc.startDate) : null;
      const end = activeDoc.endDate ? new Date(activeDoc.endDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      // Prüfe, ob heute im aktiven Datumsbereich liegt
      const isWithinRange = (!start || now >= start) && (!end || now <= end);

      if (activeDoc.active && isWithinRange) {
        setIsOpen(true);
        if (activeDoc.endDate) {
          const formatted = new Date(activeDoc.endDate).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          setEndDateFormatted(formatted);
        }
      } else {
        setIsOpen(false);
        setEndDateFormatted(null);
      }

      setLoading(false);
    }, (err) => {
      console.error("Fehler beim Abrufen des Bestellfensters:", err);
      setIsOpen(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 text-xs font-semibold animate-pulse">
        Status wird geprüft...
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200/80 text-xs font-semibold shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span>Bestellfenster aktuell geschlossen</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold shadow-2xs">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span>
        Bestellfenster geöffnet {endDateFormatted ? `bis ${endDateFormatted}` : ''}
      </span>
    </div>
  );
}
