'use client';

import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchOrders(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchOrders = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedOrders = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Lade deine Bestellungen...</div>;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-xl border border-gray-100 text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Bitte melde dich an</h1>
        <p className="text-sm text-gray-500">Du musst eingeloggt sein, um deine Bestellungen einzusehen.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
          Zurück zum Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meine Bestellungen</h1>
          <p className="text-xs text-gray-500">Übersicht deiner Käufe und deren aktueller Status</p>
        </div>
        <Link href="/" className="text-xs text-blue-600 font-semibold hover:underline">
          ← Zurück zum Shop
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100 text-gray-500 space-y-3">
          <p>Du hast bisher noch keine Bestellungen aufgegeben.</p>
          <Link href="/" className="inline-block text-xs text-blue-600 font-semibold hover:underline">
            Jetzt im Shop stöbern
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-50 pb-3">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bestell-ID: {order.id}</span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                    Status: {order.status || 'Offen'}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-sm">
                    <div>
                      <span className="font-semibold text-gray-900">{item.quantity}x</span>{' '}
                      <span className="text-gray-700">{item.productName || item.name || 'Artikel'}</span>{' '}
                      <span className="text-xs text-gray-400">
                        ({[item.size ? `Gr. ${item.size}` : null, item.color].filter(Boolean).join(', ')})
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{((item.price || 0) * item.quantity).toFixed(2)} €</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-sm font-bold text-gray-900">
                <span>Gesamtsumme</span>
                <span>{order.totalAmount?.toFixed(2)} €</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
