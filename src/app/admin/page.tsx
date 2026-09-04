'use client';

import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return <div className="p-8 text-center">Lade Berechtigungen...</div>;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 pb-4 border-b">
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
          href="/admin/orders" 
          className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <h2 className="text-xl font-bold mb-2 text-blue-600">Bestellfenster →</h2>
          <p className="text-gray-600 text-sm">
            Sammelbestellphasen öffnen, schließen und Fristen für Mitglieder festlegen.
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
      </div>
    </div>
  );
}
