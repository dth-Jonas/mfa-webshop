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
  paymentStatus?: string;
  createdAt: any;
}

export default function UserOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

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

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const getStatusBadgeStyle = (status: string) => {
    const uppercaseStatus = status.toUpperCase();
    switch (uppercaseStatus) {
      case 'BARZAHLUNG':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PAYPAL':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ÜBERWEISUNG':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

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
          {orders.map((order) => {
            const currentPaymentStatus = order.paymentStatus || order.status || 'OFFEN';
            const isExpanded = !!expandedOrders[order.id];
            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <div key={order.id} className="bg-white rounded-3xl border shadow-sm transition-all overflow-hidden">
                {/* Header-Zeile (Klickbar zum Auf-/Zuklappen) */}
                <div
                  onClick={() => toggleOrder(order.id)}
                  className="p-6 cursor-pointer hover:bg-gray-50/80 transition-colors flex flex-wrap justify-between items-center gap-4 select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-bold transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                      ▶
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bestell-ID</span>
                      <span className="text-xs font-mono font-bold text-gray-700">{order.id}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Datum & Uhrzeit</span>
                    <span className="text-xs font-bold text-gray-700">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('de-DE') : 'Neu'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gesamtsumme</span>
                    <span className="text-sm font-black text-blue-600">
                      {order.totalAmount?.toFixed(2)} € <span className="text-[10px] text-gray-400 font-normal">({itemCount} Art.)</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Zahlungsstatus</span>
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadgeStyle(currentPaymentStatus)}`}>
                      {currentPaymentStatus}
                    </span>
                  </div>
                </div>

                {/* Ausklappbarer Bereich für Artikel-Details */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 p-6 space-y-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Bestellte Artikel
                    </span>
                    <div className="divide-y bg-white rounded-2xl border px-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="py-3 flex justify-between items-center text-xs">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
