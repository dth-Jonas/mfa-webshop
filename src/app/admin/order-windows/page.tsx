'use client';

import { useAuth } from '../../../lib/auth';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
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
  const { user, loading: authLoading } = useAuth();
  const [windows, setWindows] = useState<OrderWindow[]>([]);
  const [fetching, setFetching] = useState(true);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchWindows();
  }, [user, authLoading]);

  async function fetchWindows() {
    setFetching(true);
    setErrorMessage(null);
    try {
      const snapshot = await getDocs(collection(db, 'orderWindows'));
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as OrderWindow[];
      setWindows(list);
    } catch (err) {
      console.error('Fehler beim Laden der Bestellfenster:', err);
      setErrorMessage('Fehler beim Laden der Datenbank. Bitte Berechtigungen prüfen.');
    } finally {
      setFetching(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !startDate || !endDate) {
      setErrorMessage('Bitte alle Felder vollständig ausfüllen.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'orderWindows'), {
        title: title.trim(),
        startDate,
        endDate,
        active: true,
      });

      setTitle('');
      setStartDate('');
      setEndDate('');
      await fetchWindows();
    } catch (err) {
      console.error('Fehler beim Erstellen:', err);
      setErrorMessage('Fehler beim Speichern in Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (targetWindow: OrderWindow) => {
    setErrorMessage(null);
    try {
      await updateDoc(doc(db, 'orderWindows', targetWindow.id), {
        active: !targetWindow.active,
      });
      await fetchWindows();
    } catch (err) {
      console.error('Fehler beim Ändern:', err);
      setErrorMessage('Status konnte nicht geändert werden.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bestellfenster wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'orderWindows', id));
      await fetchWindows();
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-500 font-medium text-sm">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Lade Bestellfenster...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI','Roboto',sans-serif] space-y-8">
      <div>
        <Link 
          href="/admin" 
          className="inline-flex items-center text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-all mb-4"
        >
          ← Zurück zum Control Center
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Bestellfenster verwalten
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Definiere Zeiträume, in denen Mitglieder Produkte im Webshop bestellen können.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 font-bold ml-4">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-gray-900">Neues Fenster erstellen</h2>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">TITEL / BEZEICHNUNG *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Herbst Aktion 2026"
                className="w-full min-h-[44px] px-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">STARTDATUM *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">ENDDATUM *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-xs"
            >
              {isSubmitting ? 'Speichere...' : 'Bestellfenster aktivieren'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900">Eingerichtete Zeiträume ({windows.length})</h2>

          {windows.length === 0 ? (
            <p className="text-gray-400 text-xs py-4">Noch keine Bestellfenster angelegt.</p>
          ) : (
            <div className="space-y-3">
              {windows.map((w) => (
                <div key={w.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/30 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-gray-900">{w.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                        {w.active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {w.startDate} bis {w.endDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(w)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      {w.active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
