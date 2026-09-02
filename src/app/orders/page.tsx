'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Trash2, ShoppingBag, ArrowLeft, Clock, CreditCard, Package } from 'lucide-react';

interface OrderItem {
  productName?: string;
  name?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  createdAt: any;
  totalAmount: number;
  status?: string;
  paymentMethod?: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Lese Bestellungen aus localStorage oder Firebase (wie bisher implementiert)
    const savedOrders = localStorage.getItem('user_orders');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error("Fehler beim Laden der Bestellungen", e);
      }
    }
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteOrder = (id: string) => {
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    localStorage.setItem('user_orders', JSON.stringify(updated));
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Kürzlich';
    try {
      const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Kürzlich';
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = status || 'Eingegangen';
    let styles = 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'In Bearbeitung') styles = 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'Abgeschlossen') styles = 'bg-green-50 text-green-700 border-green-200';
    if (s === 'Storniert') styles = 'bg-red-50 text-red-700 border-red-200';

    return (
      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${styles}`}>
        {s}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="text-blue-600" /> Meine Bestellungen
            </h1>
            <p className="text-sm text-gray-500 mt-1">Übersicht deiner getätigten Käufe und deren aktueller Status</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 transition-all"
          >
            <ArrowLeft size={16} /> Zum Shop
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Keine Bestellungen vorhanden</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">Du hast bisher noch keine Produkte bestellt.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Jetzt einkaufen
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = !!expandedOrders[order.id];
              const shortId = order.id ? `#${order.id.slice(-6).toUpperCase()}` : '#ID';
              const itemCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden transition-all hover:shadow-md"
                >
                  <div 
                    onClick={() => toggleExpand(order.id)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-white"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-gray-900">Bestell-ID: {shortId}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1"><Clock size={13} /> {formatDate(order.createdAt)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><CreditCard size={13} /> Zahlung: <strong className="text-gray-700">{order.paymentMethod || 'offen'}</strong></span>
                          <span>•</span>
                          <span>{itemCount} {itemCount === 1 ? 'Artikel' : 'Artikel'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block sm:hidden">Gesamtsumme</span>
                        <span className="text-lg font-bold text-gray-900">{order.totalAmount?.toFixed(2)} €</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Bestellung aus Liste entfernen"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50/70 border-t border-gray-100 p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Bestellte Positionen</h4>
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="p-3.5 flex items-center justify-between text-sm">
                            <div>
                              <div className="font-semibold text-gray-900">{item.productName || item.name || 'Artikel'}</div>
                              <div className="text-xs text-gray-500">
                                {[item.size ? `Größe ${item.size}` : null, item.color].filter(Boolean).join(' • ') || 'Standard'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-600 text-xs">{item.quantity}x {item.price?.toFixed(2)} €</div>
                              <div className="font-bold text-gray-900">{((item.price || 0) * item.quantity).toFixed(2)} €</div>
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
    </div>
  );
}
