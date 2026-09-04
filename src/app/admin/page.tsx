'use client';

import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Order {
  id: string;
  customerName?: string;
  userName?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: any;
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    async function fetchRecentOrders() {
      if (user && isAdmin) {
        try {
          const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
          const snapshot = await getDocs(q);
          const orders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[];
          setRecentOrders(orders);
        } catch (error) {
          console.error('Fehler beim Laden der Bestellungen:', error);
        } finally {
          setOrdersLoading(false);
        }
      }
    }
    fetchRecentOrders();
  }, [user, isAdmin]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Datum unbekannt';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return <div className="p-8 text-center">Lade Berechtigungen...</div>;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Verwaltungssystem für Vereinstextilien</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
          Angemeldet als Admin
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/admin/products" 
          className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <h2 className="text-xl font-bold mb-2 text-blue-600">Produkte verwalten →</h2>
          <p className="text-gray-600 text-sm">
            Textilien, Größen, Preise und Vereinsaufdrucke anlegen oder bearbeiten.
          </p>
        </Link>

        <Link 
          href="/admin/order-windows" 
          className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <h2 className="text-xl font-bold mb-2 text-blue-600">Bestellfenster →</h2>
          <p className="text-gray-600 text-sm">
            Sammelbestellphasen öffnen, schließen und Fristen für Mitglieder festlegen.
          </p>
        </Link>

        <Link 
          href="/admin/orders" 
          className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <h2 className="text-xl font-bold mb-2 text-blue-600">Alle Bestellungen →</h2>
          <p className="text-gray-600 text-sm">
            Gesamtübersicht aller eingegangenen Bestellungen einsehen und filtern.
          </p>
        </Link>

        <Link 
          href="/admin/supplier" 
          className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <h2 className="text-xl font-bold mb-2 text-blue-600">Packlisten & Lieferanten →</h2>
          <p className="text-gray-600 text-sm">
            Bestellübersichten für Lieferanten generieren und Verteilerlisten exportieren.
          </p>
        </Link>

        <Link 
          href="/" 
          className="p-6 bg-gray-50 border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <h2 className="text-xl font-bold mb-2 text-gray-800">Zum Shop →</h2>
          <p className="text-gray-600 text-sm">
            Zurück zur regulären Shop-Oberfläche wechseln.
          </p>
        </Link>
      </div>

      <div className="bg-white p-6 border rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Letzte 5 Bestellungen</h2>
          <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
            Alle anzeigen
          </Link>
        </div>

        {ordersLoading ? (
          <p className="text-gray-500 text-sm py-4">Bestellungen werden geladen...</p>
        ) : recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">Noch keine Bestellungen vorhanden.</p>
        ) : (
          <div className="divide-y">
            {recentOrders.map((order) => {
              const name = order.customerName || order.userName || 'Anonymer Besteller';
              return (
                <div key={order.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-gray-900 text-base block">{name}</span>
                    <span className="text-gray-500 text-xs block">
                      {formatDate(order.createdAt)} • ID: {order.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold block text-base">
                      {order.totalAmount ? `${order.totalAmount.toFixed(2)} €` : '-'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                      {order.status || 'Eingegangen'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
