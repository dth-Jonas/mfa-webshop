'use client';

import { useAuth } from '../../../lib/auth';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface SummaryItem {
  name: string;
  size: string;
  color: string;
  quantity: number;
}

export default function AdminSupplierPage() {
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function calculateSupplierSummary() {
      try {
        const snapshot = await getDocs(collection(db, 'orders'));
        const aggregated: Record<string, SummaryItem> = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: OrderItem) => {
              const key = `${item.name}-${item.size || 'STD'}-${item.color || 'STD'}`;
              if (!aggregated[key]) {
                aggregated[key] = {
                  name: item.name,
                  size: item.size || 'Standard',
                  color: item.color || 'Standard',
                  quantity: 0,
                };
              }
              aggregated[key].quantity += item.quantity || 1;
            });
          }
        });

        setSummary(Object.values(aggregated));
      } catch (err) {
        console.error('Fehler beim Zusammenfassen:', err);
      } finally {
        setFetching(false);
      }
    }

    if (!loading) calculateSupplierSummary();
  }, [user, loading]);

  if (loading || fetching) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 text-sm">Lieferantenübersicht wird berechnet...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif] space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Sammelbestellung für Lieferanten</h1>
          <p className="text-xs text-gray-500 mt-1">Automatische Konsolidierung aller Artikel, Größen und Farben für die Großbestellung</p>
        </div>
        <Link 
          href="/admin" 
          className="inline-flex items-center justify-center min-h-[44px] px-4 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all"
        >
          ← Zurück zum Control Center
        </Link>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-gray-50/80 border-b border-gray-200/80 flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-gray-500">Artikel & Varianten</span>
          <span className="text-xs font-bold uppercase text-gray-500">Gesamtstückzahl</span>
        </div>
        <div className="divide-y divide-gray-100">
          {summary.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">Keine Bestelldaten vorhanden.</div>
          ) : (
            summary.map((item, idx) => (
              <div key={idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50">
                <div>
                  <span className="font-bold text-sm text-gray-900 block">{item.name}</span>
                  <span className="text-xs text-gray-500">Größe: {item.size} • Farbe: {item.color}</span>
                </div>
                <div className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-xs font-extrabold">
                  {item.quantity} Stk.
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
