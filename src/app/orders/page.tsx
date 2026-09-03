'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';

interface OrderItem {
  cartId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: any;
}

export default function UserOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Nur Bestellungen laden, die dem aktuell eingeloggten Nutzer gehören
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      // Nach Datum sortieren (neueste zuerst)
      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setOrders(fetchedOrders);
      setLoading(false);
    }, (err) => {
      console.error("Fehler beim Laden der Bestellungen:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <p className="text-sm font-bold text-gray-500">Bitte melde dich an, um deine Bestellungen zu sehen.</p>
        <Link href="/" className="inline-block bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
          Zur Startseite
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Meine Bestellungen</h1>
          <p className="text-xs text-gray-500 mt-0.5">Eingeloggt als {user.email}</p>
        </div>
        <Link href="/" className="text-xs font-bold text-gray-500 hover:text-gray-900">
          ← Zurück zum Shop
        </Link>
      </div>

      {loading ? (
        <p className="text-xs font-bold text-gray-400">Lade Bestellungen...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border text-center space-y-4">
          <p className="text-sm font-bold text-gray-400">Du hast bisher noch keine Bestellungen aufgegeben.</p>
          <Link href="/" className="inline-block bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
            Jetzt shoppen
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bestell-ID</span>
                  <span className="text-xs font-mono font-bold text-gray-700">{order.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Datum</span>
                  <span className="text-xs font-bold text-gray-700">
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('de-DE') : 'Neu'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {order.status || 'offen'}
                  </span>
                </div>
              </div>

              <div className="divide-y">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {item.size && `Größe: ${item.size}`} {item.color && `| Farbe: ${item.color}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-700">{item.quantity}x {item.price?.toFixed(2)} €</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 flex justify-between items-center text-sm font-black">
                <span>Gesamtsumme:</span>
                <span className="text-blue-600">{order.totalAmount?.toFixed(2)} €</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
