'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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

const PAYMENT_STATUSES = [
  'OFFEN',
  'BARZAHLUNG',
  'PAYPAL',
  'ÜBERWEISUNG',
];

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Order[];

      fetched.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setOrders(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Fehler beim Laden der Admin-Bestellungen:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: newStatus,
        status: newStatus,
      });
    } catch (err) {
      console.error("Fehler beim Aktualisieren des Zahlungsstatus:", err);
      alert("Zahlungsstatus konnte nicht geändert werden.");
    } finally {
      setUpdatingId(null);
    }
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin - Bestellübersicht</h1>
          <p className="text-xs text-gray-500 mt-1">
            Gesamt: {orders.length} Bestellung(en)
          </p>
        </div>
        <Link href="/" className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all">
          ← Zum Shop
        </Link>
      </div>

      {loading ? (
        <p className="text-xs font-bold text-gray-400">Lade Bestellungen...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border text-center text-sm font-bold text-gray-400">
          Es liegen noch keine Bestellungen vor.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const currentStatus = order.paymentStatus || order.status || 'OFFEN';

            return (
              <div key={order.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                <div className="flex flex-wrap justify-between items-start border-b pb-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Kunde</span>
                    <p className="text-sm font-bold text-gray-900">{order.userName || 'Unbekannt'}</p>
                    <p className="text-xs text-gray-500">{order.userEmail}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bestelldatum</span>
                    <p className="text-xs font-bold text-gray-700 mt-0.5">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('de-DE') : 'Neu'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bestell-ID</span>
                    <p className="text-xs font-mono font-bold text-gray-600 mt-0.5">{order.id}</p>
                  </div>

                  <div className="min-w-[180px]">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Zahlungsstatus
                    </label>
                    <select
                      value={PAYMENT_STATUSES.includes(currentStatus) ? currentStatus : 'OFFEN'}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`w-full text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${getStatusBadgeStyle(
                        currentStatus
                      )} ${updatingId === order.id ? 'opacity-50' : ''}`}
                    >
                      {PAYMENT_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-white text-gray-900 font-medium">
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="divide-y border-b pb-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {item.size && `Größe: ${item.size}`} {item.color && `| Farbe: ${item.color}`}
                        </p>
                      </div>
                      <p className="font-bold text-gray-700">
                        {item.quantity}x {item.price?.toFixed(2)} €
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-1 text-sm font-black">
                  <span>Gesamtsumme:</span>
                  <span className="text-blue-600 text-base">{order.totalAmount?.toFixed(2)} €</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
