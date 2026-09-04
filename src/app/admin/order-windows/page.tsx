'use client';

import { useAuth } from '../../../lib/auth';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';

interface OrderWindow {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export default function AdminOrderWindowsPage() {
  const { user, loading } = useAuth();
  const [windows, setWindows] = useState<OrderWindow[]>([]);
  const [fetching, setFetching] = useState(true);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchWindows();
  }, [user, loading]);

  async function fetchWindows() {
    try {
      const snapshot = await getDocs(collection(db, 'orderWindows'));
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as OrderWindow[];
      setWindows(list);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
    } finally {
      setFetching(false);
    }
  }

  const handleCreateWindow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return alert('Bitte alle Felder ausfüllen.');

    try {
      await addDoc(collection(db, 'orderWindows'), {
        title,
        startDate,
        endDate,
        active: true,
      });
      setTitle('');
      setStartDate('');
      setEndDate('');
      fetchWindows();
    } catch (err) {
      console.error('Fehler beim Erstellen:', err);
    }
  };

  const toggleActive = async (w: OrderWindow) => {
    try {
      await updateDoc(doc(db, 'orderWindows', w.id), {
        active: !w.active,
      });
      fetchWindows();
    } catch (err) {
      console.error('Fehler beim Umschalten:', err);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400 text-sm font-medium">
        Lade Bestellfenster...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif] space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Bestellfenster verwalten</h1>
          <p className="text-xs text-gray-500 mt-1">Definiere Zeiträume, in denen Mitglieder Produkte im Webshop bestellen können</p>
        </div>
        <Link 
          href="/admin" 
          className="inline-flex items-center justify-center min-h-[44px] px-4 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all"
        >
          ← Zurück zum Control Center
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formular für neues Bestellfenster */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs h-fit space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Neues Fenster erstellen</h2>
          <form onSubmit={handleCreateWindow} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">Titel / Bezeichnung *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Sommerbestellung 2026"
                className="w-full min-h-[44px] px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">Startdatum *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">Enddatum *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-all shadow-xs"
            >
              Bestellfenster aktivieren
            </button>
          </form>
        </div>

        {/* Liste aller Bestellfenster */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Eingerichtete Zeiträume ({windows.length})</h2>
          
          {windows.length === 0 ? (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-400 shadow-xs">
              Keine Bestellfenster konfiguriert.
            </div>
          ) : (
            <div className="space-y-3">
              {windows.map((w) => (
                <div key={w.id} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-gray-900">{w.title}</h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        w.active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {w.active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Zeitraum: <strong className="text-gray-700">{w.startDate}</strong> bis <strong className="text-gray-700">{w.endDate}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => toggleActive(w)}
                    className={`min-h-[40px] px-4 text-xs font-semibold rounded-xl transition-all ${
                      w.active 
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60' 
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60'
                    }`}
                  >
                    {w.active ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
