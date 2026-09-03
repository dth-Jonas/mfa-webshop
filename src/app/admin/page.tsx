'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ChevronDown, ChevronUp, Package, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../lib/auth';

import AdminProductsPage from './products/page';
import OrderWindowsPage from './order-windows/page';

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
  userId?: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  items: OrderItem[];
}

export default function AdminPage() {
  const { user, loginWithGoogle } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'windows'>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email?.toLowerCase() === 'dth-jonas@gmx.de') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const orderSnap = await getDocs(collection(db, 'orders'));
      const fetchedOrders: Order[] = [];
      orderSnap.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedOrders.push({
          id: docSnap.id,
          createdAt: data.createdAt,
          customerName: data.customerName || data.name || 'Kunde',
          customerEmail: data.customerEmail || data.email || 'kunden@mail.de',
          userId: data.userId || 'unbekannt',
          totalAmount: data.totalAmount || 0,
          status: data.status || 'Eingegangen',
          paymentMethod: data.paymentMethod || 'offen',
          items: data.items || [],
        });
      });

      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setOrders(fetchedOrders);
    } catch (e) {
      console.error("Fehler beim Laden der Bestellungen:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error("Fehler beim Status:", e);
    }
  };

  const updatePayment = async (id: string, newPayment: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { paymentMethod: newPayment });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentMethod: newPayment } : o));
    } catch (e) {
      console.error("Fehler bei Bezahlung:", e);
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500 font-medium">Lade Berechtigungen & Dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md text-center space-y-4">
          <ShieldAlert size={48} className="mx-auto text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">Zugriff verweigert</h1>
          <p className="text-xs text-gray-500">
            {user ? (
              <>Eingeloggt als <span className="font-semibold text-gray-800">{user.email}</span>. Dieser Account ist kein Administrator.</>
            ) : (
              <>Du bist nicht eingeloggt.</>
            )}
            {' '}Bitte logge dich mit <span className="font-semibold text-gray-800">dth-jonas@gmx.de</span> ein.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
          >
            Mit Google als Admin anmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin-Dashboard</h1>
            <p className="text-xs text-gray-500">Eingeloggt als Admin: {user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Bestellübersicht ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Artikelmaske (mit Bild-Upload)
            </button>
            <button
              onClick={() => setActiveTab('windows')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'windows' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Bestellzeitfenster (Datum)
            </button>
          </div>
        </div>

        {/* Tab 1: BESTELLUNGEN */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={fetchOrders}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
              >
                <RefreshCw size={14} /> Aktualisieren
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                <div className="col-span-3">Kunde / Datum</div>
                <div className="col-span-3">Bestellte Artikel</div>
                <div className="col-span-2 text-right">Gesamtsumme</div>
                <div className="col-span-2 text-center">Bestellstatus</div>
                <div className="col-span-2 text-center">Bezahlung</div>
              </div>

              {loadingOrders ? (
                <div className="p-8 text-center text-xs text-gray-400">Lade Bestellungen direkt aus Firestore...</div>
              ) : orders.length === 0 ? (
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
                          <div className="col-span-3 flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            <div>
                              <div className="font-bold text-gray-900">{order.customerName}</div>
                              <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                            </div>
                          </div>

                          <div className="col-span-3 text-gray-700 font-medium cursor-pointer" onClick={() => toggleExpand(order.id)}>
                            {positionCount} {positionCount === 1 ? 'Position' : 'Positionen'} ({totalItems} {totalItems === 1 ? 'Artikel' : 'Artikel'})
                          </div>

                          <div className="col-span-2 text-right font-black text-gray-900">
                            {order.totalAmount?.toFixed(2)} €
                          </div>

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

                        {isExpanded && (
                          <div className="bg-gray-50/80 p-4 border-t border-gray-100">
                            <div className="text-xs text-gray-500 mb-2">
                              <strong>E-Mail:</strong> {order.customerEmail} | <strong>User-ID:</strong> {order.userId} | <strong>Bestell-ID:</strong> {order.id}
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
        )}

        {/* Tab 2 & 3: SPEZIALMASKEN */}
        {activeTab === 'products' && <AdminProductsPage />}
        {activeTab === 'windows' && <OrderWindowsPage />}

      </div>
    </div>
  );
}
