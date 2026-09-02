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
    // Lade direkt aus dem localStorage, damit im Checkout getätigte Bestellungen sofort angezeigt werden
    const loadOrders = () => {
      const savedOrders = localStorage.getItem('user_orders');
      if (savedOrders) {
        try {
          const parsed = JSON.parse(savedOrders);
          // Sortiere nach Datum absteigend (neueste zuerst)
          parsed.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setOrders(parsed);
        } catch (e) {
          console.error("Fehler beim Parsen der Bestellungen:", e);
        }
      }
    };

    loadOrders();
    // Event Listener für plötzliche Änderungen
    window.addEventListener('storage', loadOrders);
    return () => window.removeEventListener('storage', loadOrders);
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
    if (!dateVal) return 'Gerade eben';
    try {
      const date = new Date(dateVal);
      if (isNaN(date.getTime())) return 'Gerade eben';
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Gerade eben';
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = status || 'Eingegangen';
    let styles = 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'In Bearbeitung') styles = 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'Abgeschlossen') styles = 'bg-green-50 text-green-700 border-green-200';
    if (s === 'Storniert') styles = 'bg-red-50 text-red-700 border-red-200';

    return (
      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${styles} whitespace-nowrap`}>
        {s}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Meine Bestellungen</h1>
              <p className="text-xs text-gray-500">Übersicht & aktueller Status</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={14} /> Shop
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-medium text-gray-900">Keine Bestellungen vorhanden</h3>
            <p className="text-xs text-gray-500 mt-1 mb-5">Du hast in dieser Sitzung noch keine Produkte bestellt.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white w-full py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Jetzt einkaufen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isExpanded = !!expandedOrders[order.id];
              // Kurze und prägnante ID (letzte 6 Zeichen großgeschrieben)
              const shortId = order.id ? `#${order.id.slice(-6).toUpperCase()}` : '#BESTELLUNG';
              const itemCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden transition-all"
                >
                  <div 
                    onClick={() => toggleExpand(order.id)}
                    className="p-4 flex flex-col gap-3 cursor-pointer active:bg-gray-50/50"
                  >
                    {/* Zeile 1: ID, Status, Preis */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{shortId}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <span className="text-base font-black text-gray-900">
                        {order.totalAmount?.toFixed(2)} €
                      </span>
                    </div>

                    {/* Zeile 2: Meta-Infos */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(order.createdAt)}</span>
                        <span>•</span>
                        <span>Zahlung: <strong className="text-gray-700">{order.paymentMethod || 'offen'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <span>{itemCount} {itemCount === 1 ? 'Artikel' : 'Artikel'}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Aufklappbare Details */}
                  {isExpanded && (
                    <div className="bg-gray-50/80 border-t border-gray-100 p-3.5 space-y-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1">
                        Bestellte Artikel
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{item.productName || item.name || 'Artikel'}</div>
                              <div className="text-[11px] text-gray-500 truncate">
                                {[item.size ? `Gr. ${item.size}` : null, item.color].filter(Boolean).join(' • ') || 'Standard'}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-gray-500 text-[11px]">{item.quantity}x {item.price?.toFixed(2)} €</div>
                              <div className="font-bold text-gray-900">{((item.price || 0) * item.quantity).toFixed(2)} €</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Löschen-Button */}
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <Trash2 size={14} /> Aus Historie entfernen
                        </button>
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
