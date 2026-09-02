'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function SupplierPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Zusammenfassung für Lieferanten (Sammelbestellung nach Produkt, Größe, Farbe)
  const productSummary: Record<string, { count: number; details: Record<string, number> }> = {};

  orders.forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const key = item.name || 'Unbekanntes Produkt';
        const variantKey = `${item.size || 'Standard'} / ${item.color || 'Standard'}`;
        
        if (!productSummary[key]) {
          productSummary[key] = { count: 0, details: {} };
        }
        
        const qty = item.quantity || 1;
        productSummary[key].count += qty;
        productSummary[key].details[variantKey] = (productSummary[key].details[variantKey] || 0) + qty;
      });
    }
  });

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-black text-gray-900">📋 Packlisten & Abholzettel</h1>
        <button
          onClick={() => window.print()}
          className="bg-gray-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-800"
        >
          🖨️ Seite drucken
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Lade Bestelldaten...</p>
      ) : (
        <>
          {/* Lieferanten-Sammelliste */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">1. Lieferanten-Sammelliste (Gesamtmengen)</h2>
            {Object.keys(productSummary).length === 0 ? (
              <p className="text-xs text-gray-400">Keine Bestelldaten vorhanden.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(productSummary).map(([prodName, data]) => (
                  <div key={prodName} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-sm text-gray-900">{prodName}</h3>
                      <span className="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        Gesamt: {data.count} Stk.
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {Object.entries(data.details).map(([variant, count]) => (
                        <div key={variant} className="bg-white p-2 rounded-xl border text-gray-700">
                          <span className="font-semibold">{variant}:</span> <strong>{count}x</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Abholzettel pro Kunde */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">2. Abholzettel pro Kunde</h2>
            {orders.length === 0 ? (
              <p className="text-xs text-gray-400">Keine Bestellungen vorhanden.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((o) => (
                  <div key={o.id} className="p-4 border rounded-2xl space-y-2 bg-gray-50">
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{o.customerName || 'Kunde'}</p>
                        <p className="text-[11px] text-gray-500">{o.email || o.phone || 'Keine Kontaktdaten'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">ID: {o.id.slice(0, 8)}</span>
                    </div>
                    <ul className="text-xs space-y-1">
                      {o.items?.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between">
                          <span>{item.quantity || 1}x {item.name} ({item.size || '-'} / {item.color || '-'})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
