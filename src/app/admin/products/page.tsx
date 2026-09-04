'use client';

import { useAuth } from '../../../lib/auth';
import { useEffect, useState, useId } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';

interface VariantPrice {
  id: string;
  size: string;
  color: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  sizes?: string[];
  colors?: string[];
  images?: string[];
  variantPrices?: VariantPrice[];
  active: boolean;
}

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formular-States
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // Varianten-Preise State
  const [variantList, setVariantList] = useState<VariantPrice[]>([]);
  const [vSize, setVSize] = useState('');
  const [vColor, setVColor] = useState('');
  const [vPrice, setVPrice] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  // Accessible IDs
  const nameId = useId();
  const priceId = useId();
  const descId = useId();
  const sizesId = useId();
  const colorsId = useId();

  useEffect(() => {
    fetchProducts();
  }, [user, authLoading]);

  async function fetchProducts() {
    setFetching(true);
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          price: typeof data.price === 'number' ? data.price : 0,
          description: data.description || '',
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          colors: Array.isArray(data.colors) ? data.colors : [],
          images: Array.isArray(data.images) ? data.images : [],
          variantPrices: Array.isArray(data.variantPrices) ? data.variantPrices : [],
          active: data.active !== false,
        } as Product;
      });
      setProducts(list);
    } catch (err) {
      console.error('Fehler beim Laden der Produkte:', err);
      setErrorMessage('Fehler beim Laden der Produkte aus der Datenbank.');
    } finally {
      setFetching(false);
    }
  }

  // Preiskonvertierung & Validierung
  const parseAmount = (val: string): number => {
    const sanitized = val.replace(',', '.').trim();
    const num = parseFloat(sanitized);
    return isNaN(num) ? 0 : num;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length + images.length > 2) {
      setErrorMessage('Es dürfen maximal 2 Produktfotos hochgeladen werden.');
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Bitte nur Bilddateien (PNG, JPG, WebP) hochladen.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImages((prev) => [...prev, reader.result as string].slice(0, 2));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddVariantPrice = () => {
    setErrorMessage(null);
    const parsedVPrice = parseAmount(vPrice);
    
    if (parsedVPrice <= 0) {
      setErrorMessage('Bitte einen gültigen Preis (> 0 €) für die Variante eingeben.');
      return;
    }

    if (!vSize.trim() && !vColor.trim()) {
      setErrorMessage('Bitte mindestens eine Größe oder Farbe für die Variante angeben.');
      return;
    }

    const newVariant: VariantPrice = {
      id: Date.now().toString(),
      size: vSize.trim() || '*',
      color: vColor.trim() || '*',
      price: parsedVPrice,
    };

    setVariantList((prev) => [...prev, newVariant]);
    setVSize('');
    setVColor('');
    setVPrice('');
  };

  const handleRemoveVariantPrice = (id: string) => {
    setVariantList((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedPrice = parseAmount(price);

    if (!name.trim()) {
      setErrorMessage('Der Produktname ist erforderlich.');
      return;
    }

    if (parsedPrice <= 0) {
      setErrorMessage('Bitte einen gültigen Basispreis angeben.');
      return;
    }

    setIsSubmitting(true);

    const sizeArray = sizes ? sizes.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const colorArray = colors ? colors.split(',').map((c) => c.trim()).filter(Boolean) : [];

    const productData = {
      name: name.trim(),
      price: parsedPrice,
      description: description.trim(),
      sizes: sizeArray,
      colors: colorArray,
      images,
      variantPrices: variantList,
      active: true,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      setErrorMessage('Speichern fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setDescription(p.description || '');
    setSizes(p.sizes ? p.sizes.join(', ') : '');
    setColors(p.colors ? p.colors.join(', ') : '');
    setImages(p.images || []);
    setVariantList(p.variantPrices || []);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStatus = async (p: Product) => {
    const newStatus = !p.active;
    // Optimistic Update
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, active: newStatus } : item))
    );

    try {
      await updateDoc(doc(db, 'products', p.id), { active: newStatus });
    } catch (err) {
      console.error('Fehler beim Ändern des Status:', err);
      // Revert on error
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, active: p.active } : item))
      );
      setErrorMessage('Status konnte nicht geändert werden.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchtest du dieses Produkt wirklich dauerhaft löschen?')) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
      setErrorMessage('Produkt konnte nicht gelöscht werden.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setDescription('');
    setSizes('');
    setColors('');
    setImages([]);
    setVariantList([]);
    setVSize('');
    setVColor('');
    setVPrice('');
    setErrorMessage(null);
  };

  if (authLoading || fetching) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-500 font-medium text-sm">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Produkte werden geladen...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI','Roboto',sans-serif] space-y-8">
      {/* Header */}
      <div>
        <Link 
          href="/admin" 
          className="inline-flex items-center text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-all mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          ← Zurück zum Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          🏷️ Produktverwaltung
        </h1>
      </div>

      {/* Error Message Callout */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center justify-between">
          <span>{errorMessage}</span>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Formular Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {editingId ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Neu anlegen
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={nameId} className="font-bold text-gray-500 uppercase block mb-1">
                PRODUKTNAME *
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Hoodie Klassik"
                className="w-full min-h-[44px] px-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor={priceId} className="font-bold text-gray-500 uppercase block mb-1">
                BASISPREIS (€) *
              </label>
              <input
                id={priceId}
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="39.99"
                className="w-full min-h-[44px] px-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor={descId} className="font-bold text-gray-500 uppercase block mb-1">
              BESCHREIBUNG
            </label>
            <textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Produktbeschreibung..."
              className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
            />
          </div>

          <div>
            <label className="font-bold text-gray-500 uppercase block mb-1">
              PRODUKTFOTOS (MAX. 2 BILDER)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center justify-center min-h-[38px] px-4 text-xs font-semibold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all">
                Dateien auswählen
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <span className="text-gray-400">
                {images.length === 0 ? 'Keine ausgewählt' : `${images.length} / 2 ausgewählt`}
              </span>
            </div>
            {images.length > 0 && (
              <div className="flex gap-3 mt-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={img} alt={`Vorschau ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600 transition-all"
                      title="Bild entfernen"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={sizesId} className="font-bold text-gray-500 uppercase block mb-1">
                GRÖSSEN (KOMMAGETRENNT)
              </label>
              <input
                id={sizesId}
                type="text"
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder="S, M, L, XL"
                className="w-full min-h-[44px] px-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>

            <div>
              <label htmlFor={colorsId} className="font-bold text-gray-500 uppercase block mb-1">
                FARBEN (KOMMAGETRENNT)
              </label>
              <input
                id={colorsId}
                type="text"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="Schwarz, Blau"
                className="w-full min-h-[44px] px-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
          </div>

          {/* Varianten-Preise */}
          <div className="pt-2">
            <label className="font-bold text-gray-700 block mb-2">Varianten-Preise (Optional)</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={vSize}
                onChange={(e) => setVSize(e.target.value)}
                placeholder="Größe"
                className="flex-1 min-w-[100px] min-h-[40px] px-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs"
              />
              <input
                type="text"
                value={vColor}
                onChange={(e) => setVColor(e.target.value)}
                placeholder="Farbe"
                className="flex-1 min-w-[100px] min-h-[40px] px-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs"
              />
              <input
                type="text"
                inputMode="decimal"
                value={vPrice}
                onChange={(e) => setVPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariantPrice();
                  }
                }}
                placeholder="Preis (€)"
                className="flex-1 min-w-[100px] min-h-[40px] px-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleAddVariantPrice}
                className="min-h-[40px] px-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all text-xs"
              >
                + Hinzufügen
              </button>
            </div>

            {variantList.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {variantList.map((v) => (
                  <span key={v.id} className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <span>Größe: <strong>{v.size}</strong></span>
                    <span>•</span>
                    <span>Farbe: <strong>{v.color}</strong></span>
                    <span>•</span>
                    <span className="text-blue-600">{v.price.toFixed(2)} €</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariantPrice(v.id)}
                      className="text-red-500 hover:text-red-700 font-bold ml-1"
                      title="Variante löschen"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm shadow-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Wird gespeichert...</span>
                </>
              ) : (
                <span>{editingId ? 'Änderungen speichern' : 'Produkt veröffentlichen'}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Produktliste */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Bestehende Produkte ({products.length})</h2>

        {products.length === 0 ? (
          <p className="text-gray-400 text-xs py-4">Noch keine Produkte vorhanden.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map((p) => (
              <div key={p.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-gray-200/60">
                    {p.images && p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">👕</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{p.name}</h3>
                    <p className="text-xs text-blue-600 font-semibold">
                      Basispreis: {p.price.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <button
                    onClick={() => toggleStatus(p)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                      p.active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {p.active ? 'aktiv' : 'inaktiv'}
                  </button>
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-blue-600 hover:underline px-2 py-1"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 hover:underline px-2 py-1"
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
  );
}
