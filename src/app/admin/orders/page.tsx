'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
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
  userName: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  createdAt: any;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];
      setOrders(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Status:', err);
      alert('Fehler beim Ändern des Status.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Möchtest du diese Bestellung wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
      alert('Fehler beim Löschen der Bestellung.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'Alle' || o.status === filterStatus;
    const matchesSearch =
      o.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center gap-1 mb-1"
            >
              ← Zurück zum Admin Dashboard
            </Link>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bestellungs-Verwaltung</h1>
            <p className="text-xs text-gray-400">Übersicht und Statusverwaltung aller Kundenbestellungen</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200/60">
              {orders.length} {orders.length === 1 ? 'Bestellung' : 'Bestellungen'} gesamt
            </span>
          </div>
        </div>

        {/* Filter & Suche Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
          <input
            type="text"
            placeholder="Nach Name, E-Mail oder ID suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['Alle', 'Offen', 'In Bearbeitung', 'Bezahlt', 'Geliefert', 'Storniert'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table / Cards */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-gray-400 border border-gray-200/80">
            Lade Bestellungen...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 space-y-2">
            <span className="text-3xl block">📦</span>
            <p className="font-bold text-gray-800 text-sm">Keine Bestellungen gefunden</p>
            <p className="text-xs text-gray-400">Passe deine Filtersuche an oder warte auf neue Eingänge.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-4 transition-all hover:border-gray-300"
              >
                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-gray-900">{order.userName || 'Unbekannt'}</h3>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {order.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs text-gray-400">{order.userEmail}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-gray-900">
                      {order.totalAmount ? `${order.totalAmount.toFixed(2)} €` : '0.00 €'}
                    </span>

                    {/* Status Dropdown */}
                    <select
                      value={order.status || 'Offen'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Offen">Offen</option>
                      <option value="In Bearbeitung">In Bearbeitung</option>
                      <option value="Bezahlt">Bezahlt</option>
                      <option value="Geliefert">Geliefert</option>
                      <option value="Storniert">Storniert</option>
                    </select>

                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-gray-400 hover:text-red-600 font-bold text-xs p-1"
                      title="Bestellung löschen"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-xs flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {item.size ? `Größe: ${item.size}` : ''} {item.color ? `| Farbe: ${item.color}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-gray-700">{item.quantity}x</span>
                        <p className="text-[10px] text-gray-400">{(item.price * item.quantity).toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
