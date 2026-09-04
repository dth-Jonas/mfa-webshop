'use client';

import { useAuth } from '../../../lib/auth';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';

interface Order {
  id: string;
  userEmail?: string;
  createdAt: any;
  totalAmount: number;
  status?: string;
  items?: any[];
}

export default function AdminOrdersOverviewPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const snapshot = await getDocs(collection(db, 'orders'));
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Order[];
        setOrders(list);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    if (!loading) fetchOrders();
  }, [user, loading]);

  if (loading || fetching) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 text-sm">Bestellungen laden...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif] space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Bestellübersicht (Kompakt)</h1>
          <p className="text-xs text-gray-500 mt-1">Schnellübersicht über alle im System registrierten Bestellungen</p>
        </div>
        <Link 
          href="/admin" 
          className="inline-flex items-center justify-center min-h-[44px] px-4 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all"
        >
          ← Zurück zum Control Center
        </Link>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="divide-y divide-gray-100">
          {orders.map((o) => (
            <div key={o.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50/50">
              <div>
                <span className="font-bold text-sm text-gray-900 block">{o.userEmail || 'Keine E-Mail'}</span>
                <span className="text-xs text-gray-400 font-mono">ID: {o.id}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-blue-600 block">{o.totalAmount?.toFixed(2)} €</span>
                <span className="text-xs text-gray-500">{o.items?.length || 0} Positionen</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
