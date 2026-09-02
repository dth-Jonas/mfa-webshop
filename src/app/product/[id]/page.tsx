'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Product } from '../../../lib/types';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeWindow, setActiveWindow] = useState<any>(null);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(data);
          if (data.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[0]);
          if (data.colors && data.colors.length > 0) setSelectedColor(data.colors[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    const unsubWindows = onSnapshot(collection(db, 'orderWindows'), (snapshot) => {
      const now = new Date();
      const openWindow = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).find((w: any) => {
        if (!w.startDate || !w.endDate) return false;
        const start = new Date(w.startDate);
        const end = new Date(w.endDate);
        return now >= start && now <= end;
      });
      setActiveWindow(openWindow || null);
    });

    return () => unsubWindows();
  }, [id]);

  if (loading) {
    return <div className="p-6 max-w-4xl mx-auto text-xs font-bold text-gray-400">Lade Produktdetails...</div>;
  }

  if (!product) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4 font-sans">
        <Link href="/" className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-white px-4 py-2 rounded-2xl border border-gray-200">
          ← Zurück zum Shop
        </Link>
        <p className="text-sm font-bold text-red-500">Produkt nicht gefunden.</p>
      </div>
    );
  }

  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : product.imageUrl 
      ? [product.imageUrl] 
      : [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 font-sans">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm transition-all"
        >
          ← Zurück zum Shop
        </Link>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
            {allImages.length > 0 ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={allImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <span className="text-xs font-bold text-gray-400">Kein Bild verfügbar</span>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-gray-50 ${
                    selectedImageIndex === idx ? 'border-blue-600' : 'border-gray-200'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-gray-900">{product.name}</h1>
            <p className="text-xl font-bold text-blue-600">
              ab {product.price ? product.price.toFixed(2) : '0.00'} €
            </p>

            {product.description && (
              <p className="text-xs text-gray-600 font-medium leading-relaxed pt-2 border-t">
                {product.description}
              </p>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Größe wählen:</span>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        selectedSize === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Farbe wählen:</span>
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        selectedColor === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeWindow ? (
            <button
              onClick={() => alert(`${product.name} in der Größe ${selectedSize || 'Standard'} hinzugefügt!`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md"
            >
              🛒 In den Warenkorb legen
            </button>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <p className="text-xs font-bold text-amber-800">
                🔒 Bestellungen sind aktuell deaktiviert (Katalogmodus)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
