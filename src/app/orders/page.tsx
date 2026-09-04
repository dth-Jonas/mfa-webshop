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
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400 font-medium text-sm">
        Bestellungen werden geladen...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 flex flex-col min-h-screen justify-between font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif] selection:bg-blue-500 selection:text-white">
      <div className="space-y-6">
        {/* Navigation / Header im iOS Segmented Style */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Meine Bestellungen
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[240px] sm:max-w-none">
              {user?.email}
            </p>
          </div>
          <Link 
            href="/" 
            className="inline-flex items-center min-h-[44px] px-3.5 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 active:bg-blue-100 rounded-full transition-all touch-manipulation focus:outline-none"
          >
            ← Zurück zum Shop
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <p className="text-gray-900 font-semibold text-base">Keine Bestellungen</p>
            <p className="text-gray-400 text-xs">Du hast noch keine Bestellungen in deinem Konto hinterlegt.</p>
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
                <div 
                  key={order.id} 
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden [-webkit-tap-highlight-color:transparent]"
                >
                  {/* Apple HIG Click Target (Mindestens 44px Höhe, komfortables Spacing) */}
                  <div 
                    onClick={() => toggleExpand(order.id)}
                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer active:bg-gray-50/80 transition-colors touch-manipulation min-h-[44px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-bold">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">Datum & Uhrzeit</span>
                        <span className="font-semibold text-xs sm:text-sm text-gray-900">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">Gesamtsumme</span>
                      <span className="text-sm sm:text-base font-bold text-blue-600">
                        {order.totalAmount?.toFixed(2)} €
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">Umfang</span>
                      <span className="text-xs font-medium text-gray-600">
                        {positionsCount} Pos. ({totalItemsCount} Art.)
                      </span>
                    </div>

                    <div className="text-xs text-blue-600 font-semibold ml-auto sm:ml-0">
                      {isExpanded ? 'Verbergen' : 'Details'}
                    </div>
                  </div>

                  {/* Ausgeklappte iOS Card Section */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/60 p-4 sm:p-5 space-y-4">
                      {/* Meta Information Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                        <div>
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">Bestell-ID</span>
                          <span className="font-mono text-xs text-gray-800 font-bold select-all">{order.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block mb-0.5">Status</span>
                            <span className="inline-block bg-blue-50 text-blue-700 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-blue-100 capitalize">
                              {status}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block mb-0.5">Bezahlung</span>
                            <span className="inline-block bg-amber-50 text-amber-700 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-amber-100 capitalize">
                              {payment}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                          Bestellte Artikel
                        </h4>
                        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100 shadow-2xs overflow-hidden">
                          {order.items?.map((item, idx) => {
                            const itemTotal = (item.price || 0) * (item.quantity || 1);
                            return (
                              <div key={idx} className="p-3.5 flex justify-between items-center text-xs sm:text-sm min-h-[44px]">
                                <div>
                                  <span className="font-semibold text-gray-900 block">{item.name}</span>
                                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                                    {item.size ? `Größe: ${item.size}` : ''}
                                    {item.size && item.color ? ' • ' : ''}
                                    {item.color ? `Farbe: ${item.color}` : ''}
                                    {!item.size && !item.color ? 'Standard' : ''}
                                  </span>
                                </div>
                                <div className="text-right ml-4">
                                  <span className="font-bold text-gray-900 block">{itemTotal.toFixed(2)} €</span>
                                  <span className="text-[10px] text-gray-400 block">
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

      {/* Footer im Apple-Minimalist-Look */}
      <footer className="mt-12 pt-6 border-t border-gray-100 text-[11px] text-gray-400 space-y-3 pb-safe">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <span className="text-gray-400">App:</span> <span className="font-medium text-gray-700">MFA Webshop v1.2.0 MVP</span>
          </div>
          <div>
            <span className="text-gray-400">Entwickler:</span> <span className="font-medium text-gray-700">Jonas Salzer (RS Media)</span>
          </div>
        </div>
        <div className="border-t border-dashed border-gray-200/80 pt-3 text-center space-x-4">
          <Link href="/imprint" className="hover:text-gray-900 active:text-black underline min-h-[44px] inline-flex items-center">Impressum</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-gray-900 active:text-black underline min-h-[44px] inline-flex items-center">Datenschutz</Link>
        </div>
      </footer>
    </div>
  );
}
