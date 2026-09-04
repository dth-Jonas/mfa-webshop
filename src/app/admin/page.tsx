'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        router.push('/');
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
        <p className="text-xs text-gray-400 font-semibold">Zugriff wird überprüft...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-400">Zentrale Verwaltung für Shop, Bestellungen und Einstellungen</p>
          </div>
          <Link
            href="/"
            className="text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs self-start sm:self-auto"
          >
            ← Zurück zum Shop
          </Link>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Link 1: Bestellungs-Verwaltung */}
          <Link
            href="/admin/orders"
            className="group bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-blue-500 hover:shadow-md transition-all block"
          >
            <div className="text-2xl mb-2">📦</div>
            <h2 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
              Bestellungen verwalten
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Übersicht aller eingehenden Kundenbestellungen, Status & Bezahlung anpassen.
            </p>
          </Link>

          {/* Link 2: Bestellfenster einrichten */}
          <Link
            href="/admin/order-windows"
            className="group bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-blue-500 hover:shadow-md transition-all block"
          >
            <div className="text-2xl mb-2">🕒</div>
            <h2 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
              Bestellfenster einrichten
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Zeiträume für Sammelbestellungen festlegen, aktivieren oder beenden.
            </p>
          </Link>

          {/* Link 3: Artikel-Verwaltung */}
          <Link
            href="/admin/products"
            className="group bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-blue-500 hover:shadow-md transition-all block"
          >
            <div className="text-2xl mb-2">🏷️</div>
            <h2 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
              Produkte & Artikel
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Neues Sortiment anlegen, Preise, Farben und Größen im Shop anpassen.
            </p>
          </Link>

        </div>

      </div>
    </main>
  );
}
