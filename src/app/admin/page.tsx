'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
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

export default function AdminDashboardPage() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Top 5 aktuellste Bestellungen laden
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];
      setRecentOrders(list);
      setLoading(false);
    });

    fetchStats();

    return () => unsubscribe();
  }, []);

  async function fetchStats() {
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      setTotalOrdersCount(ordersSnap.size);

      const productsSnap = await getDocs(collection(db, 'products'));
      setProductsCount(productsSnap.size);
    } catch (err) {
      console.error('Fehler beim Laden der Statistiken:', err);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Control Center</h1>
            <p className="text-xs text-gray-400">Schnellübersicht & Shop-Verwaltung</p>
          </div>
          <Link
            href="/"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all shadow-2xs"
          >
            ← Zum Shop
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Bestellungen Gesamt</span>
            <p className="text-2xl font-black text-gray-900">{totalOrdersCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Produkte im Shop</span>
            <p className="text-2xl font-black text-gray-900">{productsCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Bestellungs-Center</span>
              <p className="text-xs text-gray-500 font-semibold mt-1">Alle {totalOrdersCount} Bestellungen verwalten</p>
            </div>
            <Link
              href="/admin/orders"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              Verwalten →
            </Link>
          </div>
        </div>

        {/* Letzte 5 Bestellungen (Schnellübersicht) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Letzte 5 Bestellungen</h2>
              <p className="text-xs text-gray-400">Schnelle Vorschau der neuesten Eingänge</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Alle Bestellungen anzeigen →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400">Lade Vorschau...</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">Bisher noch keine Bestellungen eingegangen.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{order.userName || 'Unbekannt'}</p>
                    <p className="text-[10px] text-gray-400">{order.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-gray-900">
                      {order.totalAmount ? `${order.totalAmount.toFixed(2)} €` : '0.00 €'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'Bezahlt' || order.status === 'Geliefert'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {order.status || 'Offen'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links zu Admin Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/products"
            className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all block group"
          >
            <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
              🛍️ Produkte verwalten
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">neue Artikel anlegen, Preise & Varianten anpassen</p>
          </Link>

          <Link
            href="/admin/windows"
            className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all block group"
          >
            <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
              📅 Bestellfenster einrichten
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Zeiträume für aktive Bestellphasen definieren</p>
          </Link>
        </div>

      </div>
    </main>
  );
}
