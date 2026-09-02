'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Product, ProductVariant } from '../../../lib/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [varSize, setVarSize] = useState('');
  const [varColor, setVarColor] = useState('');
  const [varPrice, setVarPrice] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 2) {
      alert('Maximal 2 Bilder pro Produkt erlaubt.');
      return;
    }

    setUploading(true);
    let processedCount = 0;
    const newImageUrls: string[] = [...images];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxSize = 350;
          if (width > height && width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          } else if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/webp', 0.5);
          newImageUrls.push(dataUrl);
          processedCount++;

          if (processedCount === files.length) {
            setImages(newImageUrls);
            setUploading(false);
          }
        };
        img.src = uploadEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const addVariant = () => {
    if (!varPrice) {
      alert('Bitte einen Preis eingeben.');
      return;
    }
    const newVar: ProductVariant = {
      id: Date.now().toString(),
      price: parseFloat(varPrice),
      ...(varSize.trim() ? { size: varSize.trim() } : {}),
      ...(varColor.trim() ? { color: varColor.trim() } : {}),
    };

    setVariants([...variants, newVar]);
    setVarSize('');
    setVarColor('');
    setVarPrice('');
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const resetForm = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setBasePrice('');
    setImages([]);
    setSizesInput('');
    setColorsInput('');
    setVariants([]);
  };

  const startEditing = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name || '');
    setDescription(product.description || '');
    setBasePrice(product.price ? product.price.toString() : '');
    
    const productImages = product.images || (product.imageUrl ? [product.imageUrl] : []);
    setImages(productImages);

    setSizesInput(product.sizes ? product.sizes.join(', ') : '');
    setColorsInput(product.colors ? product.colors.join(', ') : '');
    setVariants(product.variants || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !basePrice) {
      alert('Bitte Name und Basispreis ausfüllen.');
      return;
    }

    const sizes = sizesInput.split(',').map((s) => s.trim()).filter(Boolean);
    const colors = colorsInput.split(',').map((c) => c.trim()).filter(Boolean);

    try {
      const productData = {
        name,
        description,
        price: parseFloat(basePrice),
        imageUrl: images.length > 0 ? images[0] : null,
        images: images.length > 0 ? images : null,
        sizes: sizes.length > 0 ? sizes : null,
        colors: colors.length > 0 ? colors : null,
        variants: variants.length > 0 ? variants : null,
        status: 'aktiv',
      };

      if (editingProductId) {
        await updateDoc(doc(db, 'products', editingProductId), productData);
        alert('Produkt erfolgreich aktualisiert!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString(),
        });
        alert('Produkt erfolgreich angelegt!');
      }

      resetForm();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern in Firestore.');
    }
  };

  const toggleStatus = async (product: Product, newStatus: 'aktiv' | 'ausgeblendet' | 'deaktiviert') => {
    await updateDoc(doc(db, 'products', product.id), { status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Möchtest du dieses Produkt wirklich löschen?')) {
      await deleteDoc(doc(db, 'products', id));
      if (editingProductId === id) resetForm();
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <h1 className="text-2xl font-black text-gray-900">🏷️ Produktverwaltung</h1>

      <form onSubmit={handleSaveProduct} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">
            {editingProductId ? '✏️ Produkt bearbeiten' : 'Neues Produkt erstellen'}
          </h2>
          {editingProductId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-xl"
            >
              Abbrechen
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Produktname *</label>
            <input
              type="text"
              required
              placeholder="z. B. Hoodie Klassik"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2.5 rounded-xl text-sm font-semibold bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Basispreis (€) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="39.99"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full border p-2.5 rounded-xl text-sm font-semibold bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Beschreibung</label>
          <textarea
            placeholder="Produktbeschreibung..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border p-2.5 rounded-xl text-sm font-medium bg-gray-50"
          />
        </div>

        <div className="space-y-3 border-t pt-4">
          <label className="block text-xs font-bold text-gray-500 uppercase">Produktfotos (Max. 2 Bilder)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesUpload}
            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploading && <p className="text-xs text-blue-600 font-bold">Komprimiere Bilder...</p>}

          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {images.map((url, index) => (
                <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-600">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Größen (Kommagetrennt)</label>
            <input
              type="text"
              placeholder="S, M, L, XL"
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              className="w-full border p-2.5 rounded-xl text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Farben (Kommagetrennt)</label>
            <input
              type="text"
              placeholder="Schwarz, Blau"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              className="w-full border p-2.5 rounded-xl text-sm bg-gray-50"
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h3 className="font-bold text-sm text-gray-900">Varianten-Preise (Optional)</h3>
          <div className="flex flex-wrap gap-2 items-end">
            <input
              type="text"
              placeholder="Größe"
              value={varSize}
              onChange={(e) => setVarSize(e.target.value)}
              className="border p-2 rounded-xl text-xs bg-gray-50 w-32"
            />
            <input
              type="text"
              placeholder="Farbe"
              value={varColor}
              onChange={(e) => setVarColor(e.target.value)}
              className="border p-2 rounded-xl text-xs bg-gray-50 w-32"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Preis (€)"
              value={varPrice}
              onChange={(e) => setVarPrice(e.target.value)}
              className="border p-2 rounded-xl text-xs bg-gray-50 w-28"
            />
            <button
              type="button"
              onClick={addVariant}
              className="bg-gray-900 text-white font-bold px-3 py-2 rounded-xl text-xs"
            >
              + Hinzufügen
            </button>
          </div>

          {variants.length > 0 && (
            <ul className="divide-y divide-gray-100 text-xs bg-gray-50 p-3 rounded-2xl">
              {variants.map((v) => (
                <li key={v.id} className="py-1 flex justify-between items-center">
                  <span>
                    {v.size && `Größe: ${v.size} `}
                    {v.color && `Farbe: ${v.color} `}
                    <strong>→ {v.price.toFixed(2)} €</strong>
                  </span>
                  <button type="button" onClick={() => removeVariant(v.id)} className="text-red-500 font-bold">
                    Entfernen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all"
        >
          {editingProductId ? 'Änderungen speichern' : 'Produkt veröffentlichen'}
        </button>
      </form>

      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Bestehende Produkte</h2>
        {loading ? (
          <p className="text-xs text-gray-400">Lade Produkte...</p>
        ) : products.length === 0 ? (
          <p className="text-xs text-gray-400">Keine Produkte vorhanden.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map((p) => {
              const displayImg = p.imageUrl || (p.images && p.images.length > 0 ? p.images[0] : null);
              return (
                <div key={p.id} className="py-4 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    {displayImg ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={displayImg} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-[10px] text-gray-400">Kein Bild</div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{p.name}</h3>
                      <p className="text-xs font-bold text-blue-600">Basispreis: {p.price.toFixed(2)} €</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      p.status === 'aktiv' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status}
                    </span>
                    <button onClick={() => startEditing(p)} className="text-xs font-bold text-blue-600 hover:underline">
                      Bearbeiten
                    </button>
                    <button onClick={() => toggleStatus(p, p.status === 'aktiv' ? 'ausgeblendet' : 'aktiv')} className="text-xs font-bold text-gray-600 hover:underline">
                      Status
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs font-bold text-red-600 hover:underline">
                      Löschen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
