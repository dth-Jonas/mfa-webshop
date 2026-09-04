'use client';

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useState } from 'react';

export default function ClearOrdersButton() {
  const [loading, setLoading] = useState(false);

  const handleClearAll = async () => {
    const confirmDelete = window.confirm(
      'Bist du sicher? Dies wird ALLE Test-Bestellungen unwiderruflich aus Firestore löschen!'
    );
    
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const deletePromises = snapshot.docs.map((document) => 
        deleteDoc(doc(db, 'orders', document.id))
      );
      await Promise.all(deletePromises);
      alert('Alle Test-Bestellungen wurden erfolgreich gelöscht!');
      window.location.reload();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Bestellungen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClearAll}
      disabled={loading}
      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-sm transition"
    >
      {loading ? 'Lösche Bestellungen...' : '🗑️ Alle Test-Bestellungen löschen'}
    </button>
  );
}
