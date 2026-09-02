'use client';

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown, ChevronUp, Archive, AlertTriangle } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  createdAt: any;
  totalAmount: number;
  status: string;
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

const parseDateMs = (dateVal: any): number => {
  if (!dateVal) return 0;
  try {
    const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
};

export default function MyOrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [archivedOrderIds, setArchivedOrderIds] = useState<string[]>([]);
  const [archiveModalId, setArchiveModalId] = useState<string | null>(null);

  useEffect(() => {
    const savedArchived = localStorage.getItem('archived_orders');
    if (savedArchived) {
      try {
        setArchivedOrderIds(JSON.parse(savedArchived));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid)
    );

    const unsubOrders = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      items.sort((a, b) => parseDateMs(b.createdAt) - parseDateMs(a.createdAt));

      setOrders(items);
      setLoading(false);
    });

    return () => unsubOrders();
  }, [currentUser]);

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const confirmArchive = (id: string) => {
    const updated = [...archivedOrderIds, id];
    setArchivedOrderIds(updated);
    localStorage.setItem('archived_orders', JSON.stringify(updated));
    setArchiveModalId(null);
  };

  const visibleOrders = orders.filter((o) => !archivedOrderIds.includes(o.id));

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Bestellungen werden geladen...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meine Bestellungen</h1>

      {visibleOrders.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
          Keine aktiven Bestellungen vorhanden.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => {
            const isExpanded = !!expandedOrders[order.id];

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div 
                    className="flex-1 cursor-pointer flex items-center justify-between pr-4"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          Bestellung vom {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {order.id} • {order.items?.length || 0} Positionen
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-900">
                        {order.totalAmount?.toFixed(2)} €
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setArchiveModalId(order.id)}
                    title="Bestellung archivieren"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-l border-gray-200 ml-2"
                  >
                    <Archive size={18} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-100 bg-white">
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Bestellte Artikel</h4>
                    <div className="divide-y divide-gray-100">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="py-2 flex justify-between text-sm">
                          <span className="text-gray-800">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium text-gray-900">
                            {(item.price * item.quantity).toFixed(2)} €
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

      {archiveModalId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={28} />
              <h3 className="text-lg font-bold">Bestellung archivieren?</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Möchtest du diese Bestellung wirklich aus deiner Übersicht entfernen? <br />
              <strong className="text-red-600">Achtung: Diese Aktion kann nicht rückgängig gemacht werden!</strong>
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setArchiveModalId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={() => confirmArchive(archiveModalId)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm"
              >
                Endgültig archivieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
