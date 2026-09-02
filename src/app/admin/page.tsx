'use client';

import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import Link from 'next/link';

export default function AdminDashboardPage() {
  const adminLinks = [
    {
      title: '🏷️ Produktverwaltung',
      desc: 'Produkte, Preise, Größen, Farben und Bilder verwalten',
      href: '/admin/products',
      color: 'bg-blue-50 border-blue-200 text-blue-900',
    },
    {
      title: '⏱️ Bestellfenster',
      desc: 'Zeitfenster für Bestellungen festlegen und steuern',
      href: '/admin/order-windows',
      color: 'bg-amber-50 border-amber-200 text-amber-900',
    },
    {
      title: '📦 Bestellungsübersicht',
      desc: 'Eingegangene Kundenbestellungen einsehen und verwalten',
      href: '/admin/orders',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    },
    {
      title: '📋 Packlisten & Abholzettel',
      desc: 'Mengenübersicht für Lieferanten und Abholnachweise drucken',
      href: '/admin/supplier',
      color: 'bg-purple-50 border-purple-200 text-purple-900',
    },
  ];

  
  // Alle Bestellungen zurücksetzen / löschen
  const handleAdminResetOrders = async () => {
    if (!window.confirm("ACHTUNG: Möchtest du wirklich alle Bestellungen unwiderruflich aus der Datenbank löschen?")) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(doc(db, 'orders', document.id));
      });
      await batch.commit();
      localStorage.removeItem('user_orders');
      alert("Alle Bestellungen wurden erfolgreich aus der Datenbank gelöscht.");
      window.location.reload();
    } catch (e) {
      console.error("Fehler beim Zurücksetzen der Bestellungen:", e);
      alert("Fehler beim Löschen der Bestellungen.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-black text-gray-900">Admin-Cockpit</h1>
          
            <button
              onClick={handleAdminResetOrders}
              className="mt-2 sm:mt-0 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
            >
              Datenbank leeren (Reset)
            </button>
        <p className="text-xs font-semibold text-gray-500 mt-1">
          Verwalte hier Produkte, Zeitfenster und Bestellungen für deinen Shop.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${item.color}`}
          >
            <div>
              <h2 className="text-lg font-bold">{item.title}</h2>
              <p className="text-xs font-medium opacity-80 mt-1">{item.desc}</p>
            </div>
            <span className="text-xs font-bold mt-4 inline-block underline">Öffnen →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
