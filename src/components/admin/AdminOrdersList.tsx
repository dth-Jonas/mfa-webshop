'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface OrderItem {
  id?: string;
  name?: string;
  productName?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  userName?: string;
  userEmail?: string;
  createdAt: any;
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  note?: string;
  items: OrderItem[];
}

const formatDate = (dateVal: any) => {
  if (!dateVal) return 'Unbekanntes Datum';
  try {
    const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    if (isNaN(date.getTime())) return 'Unbekanntes Datum';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Unbekanntes Datum';
  }
};


  const updatePaymentMethod = async (orderId: string, newMethod: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentMethod: newMethod
      });
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Zahlungsart:", error);
    }
  };

export default function AdminOrdersList({ orders, onDeleteOrder, onStatusChange }: any) {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="p-4 w-10"></th>
            <th className="p-4">Kunde / Datum</th>
            <th className="p-4">Bestellte Artikel (Vorschau)</th>
            <th className="p-4">Gesamtsumme</th>
            <th className="p-4">Bestellstatus</th>
            <th className="p-4">Bezahlung</th>
            <th className="p-4 text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {orders && orders.map((order: Order) => {
            const isExpanded = !!expandedOrders[order.id];

            return (
              <React.Fragment key={order.id}>
                <tr 
                  className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <td className="p-4 text-gray-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">{order.userName || 'Unbekannter Kunde'}</div>
                    <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="text-gray-700">
                          <span className="font-semibold">{item.quantity}x</span>{' '}
                          <span className="font-medium">{item.productName || item.name || 'Artikel'}</span>{' '}
                          <span className="text-xs text-gray-500">
                            ({[item.size ? `Gr. ${item.size}` : null, item.color].filter(Boolean).join(', ')})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    {order.totalAmount?.toFixed(2)} €
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <!-- Admin Zahlungsart -->
<select
                      value={order.status || 'Offen'}
                      onChange={(e) => onStatusChange && onStatusChange(order.id, 'status', e.target.value)}
                      className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-200 focus:outline-none"
                    >
                      <option value="Offen">Offen</option>
                      <option value="In Bearbeitung">In Bearbeitung</option>
                      <option value="Abgeschlossen">Abgeschlossen</option>
                      <option value="Storniert">Storniert</option>
                    </select>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-red-100">
                      ⚠️ {order.paymentStatus || 'Offen'}
                    </span>
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onDeleteOrder && onDeleteOrder(order.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Bestellung löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="bg-slate-50/60 border-b border-gray-100">
                    <td></td>
                    <td colSpan={6} className="p-4 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Details zur Bestellung ({order.id})
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                        <div className="text-xs text-gray-600">
                          <strong>E-Mail:</strong> {order.userEmail || 'Nicht angegeben'}
                        </div>
                        {order.note && (
                          <div className="text-xs text-amber-800 bg-amber-50/50 p-2 rounded border border-amber-200/60">
                            <strong>Anmerkung des Kunden:</strong> {order.note}
                          </div>
                        )}
                        <div className="mt-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400 border-b border-gray-100 text-left">
                                <th className="pb-1">Artikel</th>
                                <th className="pb-1">Variante</th>
                                <th className="pb-1">Menge</th>
                                <th className="pb-1 text-right">Einzelpreis</th>
                                <th className="pb-1 text-right">Gesamt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {order.items?.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="py-1.5 font-medium">{item.productName || item.name || 'Artikel'}</td>
                                  <td className="py-1.5 text-gray-500">
                                    {[item.size ? `Größe ${item.size}` : null, item.color].filter(Boolean).join(' / ') || '-'}
                                  </td>
                                  <td className="py-1.5">{item.quantity}</td>
                                  <td className="py-1.5 text-right">{item.price?.toFixed(2)} €</td>
                                  <td className="py-1.5 text-right font-semibold">
                                    {((item.price || 0) * item.quantity).toFixed(2)} €
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
