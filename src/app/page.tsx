'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import OrderWindowBanner from '../components/OrderWindowBanner';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [isWindowActive, setIsWindowActive] = useState<boolean>(false);

  // 1. Produkte laden
  useEffect(() => {
    async function loadProducts() {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(list);
      } catch (err) {
        console.error('Fehler beim Laden der Produkte:', err);
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // 2. Bestellfenster-Status prüfen
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'orderWindows'),
      (snapshot) => {
        if (snapshot.empty) {
          setIsWindowActive(false);
          return;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const activeWin = snapshot.docs.map((doc) => doc.data()).find((w) => {
          if (!w.active) return false;
          const start = w.startDate ? new Date(w.startDate) : null;
          const end = w.endDate ? new Date(w.endDate) : null;
          if (start) start.setHours(0, 0, 0, 0);
          if (end) end.setHours(23, 59, 59, 999);

          return (!start || now >= start) && (!end || now <= end);
        });

        setIsWindowActive(!!activeWin);
      },
      (error) => {
        console.error('Firestore Error:', error);
        setIsWindowActive(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text',sans-serif]">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-gray-900">MFA Shop</h1>
            <p className="text-xs text-gray-500 mt-1">Willkommen im Mitarbeiter-Webshop</p>
          </div>
          <div>
            <OrderWindowBanner />
          </div>
        </header>

        {!isWindowActive && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>Der Shop ist derzeit für Bestellungen geschlossen. Produkte können angesehen, aber nicht bestellt werden.</span>
          </div>
        )}

        {/* Produkt-Katalog */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Produkte</h2>

          {productsLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">Produkte werden geladen...</div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-200">
              Keine Produkte gefunden.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md"
                >
                  <div>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-xl mb-4 bg-gray-50"
                      />
                    ) : (
                      <div className="w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-medium mb-4">
                        Kein Bild
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-gray-900">
                      {typeof product.price === 'number' ? `${product.price.toFixed(2)} €` : product.price}
                    </span>
                    <button
                      disabled={!isWindowActive}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isWindowActive
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isWindowActive ? 'In den Warenkorb' : 'Geschlossen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
