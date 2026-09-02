'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import AdminOrdersList from '../../../components/admin/AdminOrdersList';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const fetchedOrders = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Möchtest du diese Bestellung wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const handleStatusChange = async (orderId: string, field: string, value: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { [field]: value });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, [field]: value } : o))
      );
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Lade Bestellungen...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bestellverwaltung</h1>
      <AdminOrdersList
        orders={orders}
        onDeleteOrder={handleDeleteOrder}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
