'use client';

import { useAuth } from '../../../lib/auth';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  sizes?: string[];
  colors?: string[];
  description?: string;
  active?: boolean;
}

export default function AdminProductsPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);

  // Formular State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [user, loading]);

  async function fetchProducts() {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Product[];
      setProducts(list);
    } catch (err) {
      console.error('Fehler beim Laden der Produkte:', err);
    } finally {
      setFetching(false);
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return alert('Name und Preis sind erforderlich.');

    const parsedPrice = parseFloat(price.replace(',', '.'));
    const sizeArray = sizes ? sizes.split(',').map((s) => s.trim()) : [];
    const colorArray = colors ? colors.split(',').map((c) => c.trim()) : [];

    const productData = {
      name,
      price: parsedPrice,
      category: category || 'Allgemein',
      sizes: sizeArray,
      colors: colorArray,
      description,
      active: true,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Fehler beim Speichern des Produkts:', err);
      alert('Speichern fehlgeschlagen.');
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setCategory(p.category || '');
    setSizes(p.sizes ? p.sizes.join(', ') : '');
    setColors(p.colors ? p.colors.join(', ') : '');
    setDescription(p.description || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Produkt wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCategory('');
    setSizes('');
    setColors('');
    setDescription('');
  };

  if (loading || fetching) {
    return <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-medium text-sm">Produkte werden geladen...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif] space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Produktverwaltung</h1>
          <p className="text-xs text-gray-500 mt-1">Erstelle und verwalte alle Produkte des Webshops</p>
        </div>
        <Link 
          href="/admin" 
          className="inline-flex items-center justify-center min-h-[44px] px-4 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all"
        >
          ← Zurück zum Control Center
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formular Panel */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs h-fit space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">
            {editingId ? 'Produkt bearbeiten' : 'Neues Produkt anlegen'}
          </h2>
          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">Produktname *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Softshell Jacke"
                className="w-full min-h-[44px] px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Preis (€) *</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29.90"
                  className="w-full min-h-[44px] px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Kategorie</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Jacken"
                  className="w-full min-h-[44px] px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">Größen (kommagetrennt)</label>
              <input
                type="text"
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder="S, M, L, XL, XXL"
                className="w-full min-h-[44px] px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">Farben (kommagetrennt)</label>
              <input
                type="text"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="Schwarz, Blau, Rot"
                className="w-full min-h-[44px] px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="font-bold text-gray-500 uppercase block mb-1">Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Details zum Material etc."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
              >
                {editingId ? 'Aktualisieren' : 'Speichern'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-[44px] px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
                >
                  Abbrechen
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Produktliste */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Existierende Produkte ({products.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-base text-gray-900">{p.name}</h3>
                    <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs">
                      {p.price?.toFixed(2)} €
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{p.category || 'Allgemein'}</p>
                  
                  {p.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{p.description}</p>
                  )}

                  <div className="mt-3 space-y-1 text-[11px] text-gray-500">
                    {p.sizes && p.sizes.length > 0 && (
                      <div><strong className="text-gray-700">Größen:</strong> {p.sizes.join(', ')}</div>
                    )}
                    {p.colors && p.colors.length > 0 && (
                      <div><strong className="text-gray-700">Farben:</strong> {p.colors.join(', ')}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(p)}
                    className="flex-1 min-h-[36px] text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="min-h-[36px] px-3 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
