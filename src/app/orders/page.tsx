'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  createdAt: any;
  items: OrderItem[];
}

export default function UserOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Datum unbekannt';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-gray-50/50 p-3 sm:p-6 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <div className="max-w-xl mx-auto space-y-4">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
          >
            ← Zurück zum Dashboard
          </Link>
        </div>

        {!user ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-200/80 shadow-xs">
            <p className="text-xs font-semibold text-gray-600">Bitte melde dich an, um deine Bestellungen einzusehen.</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400 border border-gray-200/80">
            Bestellungen werden geladen...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200/80 space-y-2">
            <span className="text-3xl block">📦</span>
            <h2 className="font-bold text-gray-900 text-sm">Keine Bestellungen vorhanden</h2>
            <p className="text-xs text-gray-400">Du hast bisher noch keine Bestellungen aufgegeben.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isExpanded = expandedOrders[order.id] ?? true; // Standardmäßig geöffnet
              const totalItemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3"
                >
                  {/* Top Bar: Datum, Gesamtsumme, Umfang & Details Toggle */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Datum & Uhrzeit</span>
                        <span className="font-bold text-gray-800">{formatDate(order.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Gesamtsumme</span>
                        <span className="font-black text-blue-600">
                          {order.totalAmount ? `${order.totalAmount.toFixed(2)} €` : '0.00 €'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Umfang</span>
                        <span className="text-gray-600 font-medium">
                          {order.items?.length || 0} Pos. ({totalItemsCount} Art.)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {isExpanded ? 'Verbergen' : 'Details'}
                    </button>
                  </div>

                  {/* Details Section */}
                  {isExpanded && (
                    <div className="space-y-3 pt-1">
                      {/* ID, Status & Bezahlung */}
                      <div className="grid grid-cols-3 gap-2 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Bestell-ID</span>
                          <span className="font-mono text-[11px] font-bold text-gray-700 truncate block">
                            {order.id}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Status</span>
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-800">
                            {order.status || 'Eingegangen'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Bezahlung</span>
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900">
                            {order.paymentStatus || 'Offen'}
                          </span>
                        </div>
                      </div>

                      {/* Bestellte Artikel */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Bestellte Artikel</span>
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-gray-50/40 p-2 rounded-lg">
                            <div>
                              <p className="font-bold text-gray-900">{item.name}</p>
                              <p className="text-[10px] text-gray-400">
                                {item.size ? `Größe: ${item.size}` : ''} {item.color ? `| Farbe: ${item.color}` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-800">{(item.price * item.quantity).toFixed(2)} €</span>
                              <p className="text-[10px] text-gray-400">{item.quantity}x a {item.price.toFixed(2)} €</p>
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
    </main>
  );
}
