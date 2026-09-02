'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChevronDown, ChevronUp, Package, RefreshCw } from 'lucide-react';

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
  customerName?: string;
  customerEmail?: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  items: OrderItem[];
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const fetched: Order[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          createdAt: data.createdAt,
          customerName: data.customerName || data.name || 'Jonas S',
          customerEmail: data.customerEmail || data.email || 'kunder@mail.de',
          totalAmount: data.totalAmount || 0,
          status: data.status || 'Eingegangen',
          paymentMethod: data.paymentMethod || 'offen',
          items: data.items || [],
        });
      });

      fetched.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setOrders(fetched);
    } catch (e) {
      console.error("Fehler beim Laden der Admin-Bestellungen:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error("Fehler beim Aktualisieren des Status:", e);
    }
  };

  const updatePayment = async (id: string, newPayment: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { paymentMethod: newPayment });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentMethod: newPayment } : o));
    } catch (e) {
      console.error("Fehler beim Aktualisieren der Bezahlung:", e);
    }
  };

  const handleAdminResetOrders = async () => {
    if (!window.confirm("ACHTUNG: Möchtest du wirklich alle Bestellungen unwiderruflich aus der Datenbank löschen?")) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(doc(db, 'orders', document.id));
      });
      await batch.commit();
      localStorage.removeItem('user_orders');
      localStorage.removeItem('hidden_orders');
      alert("Alle Bestellungen wurden erfolgreich aus der Datenbank gelöscht.");
      fetchOrders();
    } catch (e) {
      console.error("Fehler beim Zurücksetzen:", e);
      alert("Fehler beim Löschen der Bestellungen.");
    }
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Gerade eben';
    try {
      const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500 font-medium">Lade Admin-Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Bestellverwaltung</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              title="Aktualisieren"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleAdminResetOrders}
              className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
            >
              Datenbank leeren (Reset)
            </button>
          </div>
        </div>

        {/* Bestellungen Liste */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Spaltenüberschriften */}
          <div className="grid grid-cols-12 gap-2 p-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
            <div className="col-span-3">Kunde / Datum</div>
            <div className="col-span-3">Bestellte Artikel</div>
            <div className="col-span-2 text-right">Gesamtsumme</div>
            <div className="col-span-2 text-center">Bestellstatus</div>
            <div className="col-span-2 text-center">Bezahlung</div>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package size={36} className="mx-auto text-gray-300 mb-2" />
              Keine Bestellungen in der Datenbank vorhanden.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const isExpanded = !!expandedOrders[order.id];
                const totalItems = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
                const positionCount = order.items?.length || 0;

                return (
                  <div key={order.id} className="transition-colors hover:bg-gray-50/50">
                    <div className="grid grid-cols-12 gap-2 p-4 items-center text-sm">
                      {/* Kunde & Datum */}
                      <div className="col-span-3 flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        <div>
                          <div className="font-bold text-gray-900">{order.customerName}</div>
                          <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                        </div>
                      </div>

                      {/* Kompakte Artikel-Vorschau (Positionen & Gesamtmenge) */}
                      <div className="col-span-3 text-gray-700 font-medium cursor-pointer" onClick={() => toggleExpand(order.id)}>
                        {positionCount} {positionCount === 1 ? 'Position' : 'Positionen'} ({totalItems} {totalItems === 1 ? 'Artikel' : 'Artikel'})
                      </div>

                      {/* Gesamtsumme */}
                      <div className="col-span-2 text-right font-black text-gray-900">
                        {order.totalAmount?.toFixed(2)} €
                      </div>

                      {/* Status Dropdown */}
                      <div className="col-span-2 text-center">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 cursor-pointer focus:outline-none"
                        >
                          <option value="Eingegangen">Eingegangen</option>
                          <option value="In Bearbeitung">In Bearbeitung</option>
                          <option value="Abgeschlossen">Abgeschlossen</option>
                          <option value="Storniert">Storniert</option>
                        </select>
                      </div>

                      {/* Bezahlung Dropdown */}
                      <div className="col-span-2 text-center">
                        <select
                          value={order.paymentMethod}
                          onChange={(e) => updatePayment(order.id, e.target.value)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 cursor-pointer focus:outline-none"
                        >
                          <option value="offen">offen</option>
                          <option value="bezahlt">bezahlt</option>
                        </select>
                      </div>
                    </div>

                    {/* Aufklappbare Artikel-Details */}
                    {isExpanded && (
                      <div className="bg-gray-50/80 p-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-2">
                          <strong>E-Mail:</strong> {order.customerEmail} | <strong>ID:</strong> {order.id}
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-400 border-b border-gray-100">
                              <tr>
                                <th className="p-2.5">Artikel</th>
                                <th className="p-2.5">Variante</th>
                                <th className="p-2.5 text-center">Menge</th>
                                <th className="p-2.5 text-right">Einzelpreis</th>
                                <th className="p-2.5 text-right">Gesamt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {order.items?.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="p-2.5 font-semibold text-gray-900">{item.productName || item.name}</td>
                                  <td className="p-2.5 text-gray-500">{[item.size ? `Größe ${item.size}` : null, item.color].filter(Boolean).join(' / ') || 'Standard'}</td>
                                  <td className="p-2.5 text-center font-bold text-gray-700">{item.quantity}</td>
                                  <td className="p-2.5 text-right text-gray-500">{item.price?.toFixed(2)} €</td>
                                  <td className="p-2.5 text-right font-bold text-gray-900">{((item.price || 0) * item.quantity).toFixed(2)} €</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
    </div>
  );
}
