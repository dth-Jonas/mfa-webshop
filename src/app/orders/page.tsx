'use client';

import { useAuth } from '../../lib/auth';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
  createdAt: any;
  items: OrderItem[];
  totalAmount: number;
  status?: string;
  paymentStatus?: string;
}

export default function CustomerOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchUserOrders() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const fetchedOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        
        fetchedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setOrders(fetchedOrders);
        if (fetchedOrders.length > 0) {
          setExpandedOrders({ [fetchedOrders[0].id]: true });
        }
      } catch (error) {
        console.error('Fehler beim Laden der Bestellungen:', error);
      } finally {
        setFetching(false);
      }
    }

    if (!loading) {
      fetchUserOrders();
    }
  }, [user, loading]);

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('de-DE', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading || fetching) {
    return <div className="p-8 text-center">Bestellungen werden geladen...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 flex flex-col min-h-screen justify-between">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Meine Bestellungen</h1>
            <p className="text-sm text-gray-500">Eingeloggt als {user?.email}</p>
          </div>
          <Link href="/" className="text-sm text-gray-600 hover:text-black">
            ← Zurück zum Shop
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border">
            <p className="text-gray-500">Du hast noch keine Bestellungen aufgegeben.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = !!expandedOrders[order.id];
              const payment = order.paymentStatus || 'offen';
              const status = order.status || 'eingegangen';
              
              const totalItemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              const positionsCount = order.items?.length || 0;

              return (
                <div key={order.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                  <div 
                    onClick={() => toggleExpand(order.id)}
                    className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600 text-xs">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <div>
                        <span className="text-xs text-gray-400 font-mono block">DATUM & UHRZEIT</span>
                        <span className="font-bold text-sm text-gray-800">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-400 font-mono block">GESAMTSUMME</span>
                      <span className="text-sm font-bold text-blue-600">
                        {order.totalAmount?.toFixed(2)} €
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-gray-400 font-mono block">UMFANG</span>
                      <span className="text-sm font-medium text-gray-700">
                        {positionsCount} Position{positionsCount === 1 ? '' : 'en'} ({totalItemsCount} Artikel)
                      </span>
                    </div>

                    <div className="text-xs text-blue-600 font-medium">
                      {isExpanded ? 'Details verbergen' : 'Details anzeigen'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-gray-50/50 p-4 sm:p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-lg border">
                        <div>
                          <span className="text-xs text-gray-400 font-mono block">BESTELL-ID</span>
                          <span className="font-mono text-xs text-gray-700 font-bold">{order.id}</span>
                        </div>
                        <div className="flex gap-2">
                          <div>
                            <span className="text-xs text-gray-400 font-mono block mb-1">STATUS</span>
                            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-200 capitalize">
                              {status}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 font-mono block mb-1">BEZAHLUNG</span>
                            <span className="inline-block bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-200 capitalize">
                              {payment}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Bestellte Artikel
                        </h4>
                        <div className="bg-white border rounded-lg divide-y">
                          {order.items?.map((item, idx) => {
                            const itemTotal = (item.price || 0) * (item.quantity || 1);
                            return (
                              <div key={idx} className="p-3 flex justify-between items-center text-sm">
                                <div>
                                  <span className="font-semibold block">{item.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {item.size ? `Größe: ${item.size}` : ''}
                                    {item.size && item.color ? ' | ' : ''}
                                    {item.color ? `Farbe: ${item.color}` : ''}
                                    {!item.size && !item.color ? 'Standard' : ''}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold block">{itemTotal.toFixed(2)} €</span>
                                  <span className="text-xs text-gray-400">
                                    {item.quantity}x à {item.price?.toFixed(2)} €
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* App & Entwickler Info Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-gray-400">App:</span> <span className="font-semibold text-gray-700">MFA Webshop v1.1.0 MVP</span>
          </div>
          <div>
            <span className="text-gray-400">Entwickler:</span> <span className="font-semibold text-gray-700">Jonas Salzer (RS Media)</span>
          </div>
        </div>
        <div className="border-t border-dashed border-gray-200 pt-3 text-center space-x-4">
          <Link href="/imprint" className="hover:text-black underline">Impressum</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-black underline">Datenschutz</Link>
        </div>
      </footer>
    </div>
  );
}
