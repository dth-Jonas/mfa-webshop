'use client';

import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../lib/auth';

// Import der optimierten Spezial-Masken
import AdminProductsPage from './products/page';
import OrderWindowsPage from './order-windows/page';
import AdminOrdersList from '../../components/admin/AdminOrdersList';

export default function AdminPage() {
  const { user, loginWithGoogle } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'windows'>('orders');

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
              Bestellübersicht
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

        {/* Tab-Inhalte */}
        {activeTab === 'orders' && <AdminOrdersList />}
        {activeTab === 'products' && <AdminProductsPage />}
        {activeTab === 'windows' && <OrderWindowsPage />}

      </div>
    </div>
  );
}
