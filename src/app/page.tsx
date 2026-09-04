'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import OrderWindowBanner from '../components/OrderWindowBanner';

export default function HomePage() {
  const [isWindowActive, setIsWindowActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Echtzeit-Abfrage der Collection 'orderWindows'
    const unsubscribe = onSnapshot(
      collection(db, 'orderWindows'),
      (snapshot) => {
        if (snapshot.empty) {
          setIsWindowActive(false);
          setLoading(false);
          return;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Prüfen, ob mindestens ein aktives Fenster existiert, dessen Datum gültig ist
        const activeWin = snapshot.docs.map((doc) => doc.data()).find((w) => {
          if (!w.active) return false;
          const start = w.startDate ? new Date(w.startDate) : null;
          const end = w.endDate ? new Date(w.endDate) : null;
          if (start) start.setHours(0, 0, 0, 0);
          if (end) end.setHours(23, 59, 59, 999);

          return (!start || now >= start) && (!end || now <= end);
        });

        setIsWindowActive(!!activeWin);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore Error:', error);
        // Bei JEDEM Fehler -> Sicher sperren!
        setIsWindowActive(false);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text',sans-serif]">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-gray-900">MFA Shop</h1>
          <div>
            <OrderWindowBanner />
          </div>
        </header>

        {!loading && !isWindowActive && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-medium">
            ⚠️ Der Shop ist derzeit für Bestellungen geschlossen. Es können keine Produkte in den Warenkorb gelegt werden.
          </div>
        )}
      </div>
    </main>
  );
}
