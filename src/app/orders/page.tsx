  if (loading) {'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Trash2, ShoppingBag, ArrowLeft, Clock, CreditCard, Package } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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
  totalAmount: number;
  status?: string;
  paymentMethod?: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedOrders.push({
            id: docSnap.id,
            createdAt: data.createdAt,
            totalAmount: data.totalAmount || 0,
            status: data.status,
            paymentMethod: data.paymentMethod,
            items: data.items || []
          });
        });

        // Sortiere nach Datum absteigend (neueste zuerst)
        fetchedOrders.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setOrders(fetchedOrders);
      } catch (e) {
        console.error("Fehler beim Laden der Bestellungen aus Firebase:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (e) {
      console.error("Fehler beim Löschen:", e);
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

  const getStatusBadge = (status?: string) => {
    const s = status || 'Eingegangen';
    let styles = 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'In Bearbeitung') styles = 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'Abgeschlossen') styles = 'bg-green-50 text-green-700 border-green-200';
    if (s === 'Storniert') styles = 'bg-red-50 text-red-700 border-red-200';

  
  
  
  