'use client';

import { useAuth } from '../../lib/auth';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
  userId: string;
  userEmail?: string;
  createdAt: any;
  items: OrderItem[];
  totalAmount: number;
  status?: string;
  paymentStatus?: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchAllOrders() {
      try {
        const snapshot = await getDocs(collection(db, 'orders'));
        const fetchedOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        fetchedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Fehler beim Laden der Admin-Bestellungen:', error);
      } finally {
        setFetching(false);
      }
    }

    if (!loading && user) {
      fetchAllOrders();
    }
  }, [user, loading]);

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = async (orderId: string, field: 'status' | 'paymentStatus', value: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { [field]: value });

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, [field]: value } : o))
      );
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Status:', error);
      alert('Status konnte nicht aktualisiert werden.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Möchtest du diese Bestellung wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Bestellung konnte nicht gelöscht werden.');
    }
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

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.userEmail && o.userEmail.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus =
      statusFilter === 'all' ||
      (o.status || 'eingegangen') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  if (loading || fetching) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium text-sm">
        Admin Dashboard wird geladen...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif] selection:bg-blue-500 selection:text-white space-y-8">
      
      {/* Apple-style Top Bar & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Admin Control Center
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              macOS / iPadOS
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Verwaltung aller eingehenden Bestellungen & System-Status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/orders" 
            className="inline-flex items-center justify-center min-h-[44px] px-4 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 active:bg-gray-300 rounded-xl transition-all touch-manipulation"
          >
            Kundenansicht
          </Link>
          <Link 
            href="/" 
            className="inline-flex items-center justify-center min-h-[44px] px-4 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/80 active:bg-blue-200 rounded-xl transition-all touch-manipulation"
          >
            ← Zum Shop
          </Link>
        </div>
      </div>

      {/* iPad / Desktop Dashboard Widgets (Apple Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Gesamtbestellungen
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {orders.length}
          </span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Gesamtumsatz
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
            {totalRevenue.toFixed(2)} €
          </span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Gefilterter Umsatz
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)} €
          </span>
        </div>
      </div>

      {/* Filter & Suche im Segmented Control & Search-Bar Design */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        {/* Suchfeld */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Suche nach E-Mail oder Bestell-ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-4 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
        </div>

        {/* Status Segmented Filter */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: 'Alle' },
            { id: 'eingegangen', label: 'Eingegangen' },
            { id: 'in_bearbeitung', label: 'In Bearbeitung' },
            { id: 'abgeschlossen', label: 'Abgeschlossen' },
            { id: 'storniert', label: 'Storniert' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap touch-manipulation ${
                statusFilter === tab.id
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Table for Desktop & Tablet */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-400 shadow-xs">
            Keine Bestellungen für die Kriterien gefunden.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = !!expandedOrders[order.id];
            const status = order.status || 'eingegangen';
            const payment = order.paymentStatus || 'offen';

            return (
              <div 
                key={order.id} 
                className="bg-white border border-gray-200/80 rounded-2xl shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/60 active:bg-gray-100 transition-colors min-h-[52px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                        {order.userEmail || 'Keine E-Mail'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {order.id} • {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">Betrag</span>
                      <span className="text-sm sm:text-base font-bold text-blue-600">
                        {order.totalAmount?.toFixed(2)} €
                      </span>
                    </div>

                    <div className="hidden sm:block">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">Status</span>
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-100 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-blue-600 font-semibold">
                      {isExpanded ? 'Verbergen' : 'Verwalten'}
                    </div>
                  </div>
                </div>

                {/* Expanded Management Panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5 sm:p-6 space-y-6">
                    {/* Admin Actions Bar (Dropdown Control) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                          Bestellstatus ändern
                        </label>
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(order.id, 'status', e.target.value)}
                          className="w-full min-h-[40px] text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="eingegangen">Eingegangen</option>
                          <option value="in_bearbeitung">In Bearbeitung</option>
                          <option value="abgeschlossen">Abgeschlossen</option>
                          <option value="storniert">Storniert</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                          Zahlungsstatus ändern
                        </label>
                        <select
                          value={payment}
                          onChange={(e) => handleStatusChange(order.id, 'paymentStatus', e.target.value)}
                          className="w-full min-h-[40px] text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="offen">Offen</option>
                          <option value="bezahlt">Bezahlt</option>
                          <option value="rückerstattet">Rückerstattet</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="w-full min-h-[40px] text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 active:bg-red-200 rounded-lg transition-all"
                        >
                          Bestellung löschen
                        </button>
                      </div>
                    </div>

                    {/* Order Items Table */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        Bestellte Positionen
                      </h4>
                      <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-2xs">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="p-3.5 flex justify-between items-center text-xs sm:text-sm">
                            <div>
                              <span className="font-semibold text-gray-900 block">{item.name}</span>
                              <span className="text-[11px] text-gray-500">
                                {item.size ? `Größe: ${item.size}` : ''}
                                {item.size && item.color ? ' • ' : ''}
                                {item.color ? `Farbe: ${item.color}` : ''}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900 block">
                                {((item.price || 0) * (item.quantity || 1)).toFixed(2)} €
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {item.quantity}x à {item.price?.toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Admin Footer */}
      <footer className="pt-8 border-t border-gray-200/80 text-center text-xs text-gray-400">
        MFA Webshop Admin Console v1.2.2 • Optimiert für macOS & iPadOS
      </footer>
    </div>
  );
}
