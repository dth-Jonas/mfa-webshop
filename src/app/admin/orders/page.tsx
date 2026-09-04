'use client';

import { useAuth } from '../../../lib/auth';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';
import ClearOrdersButton from './clear-button';

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
  userId: string;
  userEmail?: string;
  createdAt: any;
  items: OrderItem[];
  totalAmount: number;
  status?: string;
  paymentStatus?: string;
}

export default function AdminOrdersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchAllOrders() {
      if (!user || !isAdmin) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const fetchedOrders = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Order[];

        fetchedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Fehler beim Laden aller Bestellungen:', error);
      } finally {
        setFetching(false);
      }
    }

    if (!authLoading) {
      fetchAllOrders();
    }
  }, [user, isAdmin, authLoading]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Status:', error);
      alert('Fehler beim Speichern des Status.');
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { paymentStatus: newPaymentStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o))
      );
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Zahlungsstatus:', error);
      alert('Fehler beim Speichern des Zahlungsstatus.');
    }
  };

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

  if (authLoading || fetching) {
    return <div className="p-8 text-center">Lade Admin-Bestellungen...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Zugriff verweigert. Nur für Administratoren.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bestellverwaltung (Admin)</h1>
          <p className="text-sm text-gray-500">Übersicht aller Kundenbestellungen</p>
        </div>
        <div className="flex items-center gap-4">
          <ClearOrdersButton />
          <Link href="/admin" className="text-sm text-gray-600 hover:text-black">
            ← Zurück zum Admin-Dashboard
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl border">
          <p className="text-gray-500">Keine Bestellungen vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = !!expandedOrders[order.id];
            const currentStatus = order.status || 'eingegangen';
            const currentPayment = order.paymentStatus || 'offen';

            return (
              <div key={order.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div 
                  className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600 text-xs">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <div>
                      <span className="text-xs text-gray-400 font-mono block">KUNDE / ID</span>
                      <span className="font-bold text-sm text-gray-800 block">{order.userEmail || order.userId}</span>
                      <span className="text-xs text-gray-500 font-mono">{order.id}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 font-mono block">DATUM</span>
                    <span className="text-sm font-medium">{formatDate(order.createdAt)}</span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 font-mono block">SUMME</span>
                    <span className="text-sm font-bold text-blue-600">
                      {order.totalAmount?.toFixed(2)} €
                    </span>
                    <span className="text-xs text-gray-400 block">
                      ({order.items?.length || 0} Artikel)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <span className="text-xs text-gray-400 font-mono block mb-1">STATUS</span>
                      <select
                        value={currentStatus}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-xs border rounded p-1 bg-white font-semibold text-blue-700 capitalize"
                      >
                        <option value="eingegangen">eingegangen</option>
                        <option value="in bearbeitung">in bearbeitung</option>
                        <option value="abholbereit">abholbereit</option>
                        <option value="abgeschlossen">abgeschlossen</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-xs text-gray-400 font-mono block mb-1">BEZAHLUNG</span>
                      <select
                        value={currentPayment}
                        onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                        className="text-xs border rounded p-1 bg-white font-semibold text-amber-700 capitalize"
                      >
                        <option value="offen">offen</option>
                        <option value="paypal">paypal</option>
                        <option value="bar">bar</option>
                        <option value="überweisung">überweisung</option>
                      </select>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-gray-50/50 p-4 sm:p-6 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Bestellte Artikel
                    </h4>
                    <div className="bg-white border rounded-lg divide-y">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center text-sm">
                          <div>
                            <span className="font-semibold block">{item.name}</span>
                            <span className="text-xs text-gray-500">
                              {item.size ? `Größe: ${item.size}` : ''}
                              {item.size && item.color ? ' | ' : ''}
                              {item.color ? `Farbe: ${item.color}` : ''}
                            </span>
                          </div>
                          <span className="font-bold">
                            {item.quantity}x {item.price?.toFixed(2)} €
                          </span>
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
