'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { createOrderWindow, updateOrderWindow, deleteOrderWindow, setActiveWindow } from '../../../lib/order-windows';
import { OrderWindow } from '../../../lib/types';
import Link from 'next/link';

export default function OrderWindowsPage() {
  const [windows, setWindows] = useState<OrderWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formular-Zustände
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orderWindows'), orderBy('startDate', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        title: docSnap.data().title || '',
        startDate: docSnap.data().startDate || '',
        endDate: docSnap.data().endDate || '',
        isActive: docSnap.data().isActive || false,
      })) as OrderWindow[];

      setWindows(fetched);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const resetForm = () => {
    setTitle('');
    setStartDate('');
    setEndDate('');
    setIsActive(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;

    if (editingId) {
      await updateOrderWindow(editingId, { title, startDate, endDate, isActive });
    } else {
      await createOrderWindow({ title, startDate, endDate, isActive });
    }

    resetForm();
  };

  const handleEdit = (w: OrderWindow) => {
    setEditingId(w.id);
    setTitle(w.title);
    setStartDate(w.startDate);
    setEndDate(w.endDate);
    setIsActive(w.isActive);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Möchtest du dieses Zeitfenster wirklich löschen?')) {
      await deleteOrderWindow(id);
    }
  };

  const handleMakeActive = async (id: string) => {
    await setActiveWindow(id, windows);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans pb-12">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <div>
            <Link href="/admin/supplier" className="text-xs text-blue-600 font-bold hover:underline">
              ← Zur Lieferantenübersicht
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
              ⚙️ Bestellzeitfenster verwalten
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formular zum Erstellen / Bearbeiten */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? 'Zeitfenster bearbeiten' : 'Neues Zeitfenster anlegen'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titel / Bezeichnung</label>
              <input
                type="text"
                placeholder="z. B. Sammelbestellung Frühjahr"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border border-gray-300 p-3 rounded-2xl text-sm font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Startdatum</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full border border-gray-300 p-3 rounded-2xl text-sm font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enddatum</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full border border-gray-300 p-3 rounded-2xl text-sm font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                Als aktives Zeitfenster markieren
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition-all text-sm"
              >
                {editingId ? 'Speichern' : 'Anlegen'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-2xl transition-all text-sm"
                >
                  Abbrechen
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Liste aller Zeitfenster */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Vorhandene Zeitfenster</h2>

          {loading ? (
            <p className="text-gray-400 text-sm">Lade Zeitfenster...</p>
          ) : windows.length === 0 ? (
            <p className="text-gray-400 text-sm">Noch keine Zeitfenster in Firestore angelegt.</p>
          ) : (
            <div className="space-y-3">
              {windows.map((w) => (
                <div
                  key={w.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    w.isActive
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-gray-200 bg-gray-50/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{w.title}</h3>
                      {w.isActive && (
                        <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                          Aktiv
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      📅 {w.startDate} bis {w.endDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!w.isActive && (
                      <button
                        onClick={() => handleMakeActive(w.id)}
                        className="text-xs font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-xl transition-all"
                      >
                        Aktivieren
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(w)}
                      className="text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-xl transition-all"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="text-xs font-bold text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-xl transition-all"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
