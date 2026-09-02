'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot , orderBy } from 'firebase/firestore';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { Order } from '../../lib/types';
import Link from 'next/link';

export default function MyOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubOrders = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[];

          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          setOrders(items);
          setLoading(false);
        });

        return () => unsubOrders();
      } else {
        setOrders([]);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      alert('Anmeldung fehlgeschlagen.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
        <p className="text-gray-400 text-sm font-bold">Lade Bestellungen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans pb-16">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/shop" className="text-xs font-bold text-gray-500 hover:text-gray-900">
              ← Zurück zum Shop
            </Link>
            <h1 className="text-xl font-black text-gray-900">📦 Meine Bestellungen</h1>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-xs font-bold text-gray-900">{user.displayName}</p>
              <p className="text-[10px] text-gray-500">{user.email}</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        {!user ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-4">
            <p className="text-sm font-bold text-gray-600">
              Bitte melde dich an, um deine bisherigen Bestellungen zu sehen.
            </p>
            <button
              onClick={handleGoogleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Mit Google anmelden
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-3">
            <p className="text-2xl">🛍️</p>
            <h2 className="font-bold text-gray-900 text-base">Keine Bestellungen gefunden</h2>
            <p className="text-xs text-gray-500">Du hast bisher noch keine Produkte bestellt.</p>
            <Link
              href="/shop"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
            >
              Jetzt im Shop stöbern
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-gray-400 block">
                      Bestell-ID: {order.id}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      Bestellt am: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('de-DE') : 'Unbekannt'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        order.status === 'versendet'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'in bearbeitung'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'storniert'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      Status: {order.status || 'offen'}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        order.paid ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {order.paid ? 'Bezahlt' : 'Offen'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Bestellte Artikel</p>
                  <ul className="divide-y divide-gray-50 text-xs">
                    {(order.items || []).map((item: any, idx: number) => {
                      const itemPrice = Number(item.unitPrice ?? item.price ?? 0);
                      const qty = Number(item.quantity || 1);

                      return (
                        <li key={idx} className="py-2 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-900">{item.productName || item.name || 'Artikel'}</span>
                            <span className="text-gray-500 ml-2">
                              ({qty}x {itemPrice.toFixed(2)} €)
                            </span>
                            {(item.size || item.color) && (
                              <p className="text-[10px] text-gray-400">
                                {item.size && `Größe: ${item.size} `}
                                {item.color && `Farbe: ${item.color}`}
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-gray-900">
                            {(itemPrice * qty).toFixed(2)} €
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {order.note && (
                  <div className="bg-gray-50 p-3 rounded-2xl text-xs text-gray-600">
                    <strong>Bemerkung:</strong> {order.note}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">Gesamtsumme</span>
                  <span className="text-base font-black text-blue-600">
                    {Number(order.totalPrice ?? order.totalAmount ?? 0).toFixed(2)} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
