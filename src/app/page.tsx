'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import OrderWindowBanner from '../components/OrderWindowBanner';
import Link from 'next/link';

interface VariantPrice {
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
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  image?: string;
  quantity: number;
}

export default function HomePage() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isWindowActive, setIsWindowActive] = useState<boolean>(false);

  // Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Cart & Feedback Notification
  const [cartCount, setCartCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    updateCartCount();
  }, []);

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
      () => setIsWindowActive(false)
    );

    return () => unsubscribe();
  }, []);

  async function fetchProducts() {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];
      setProducts(list);
    } catch (err) {
      console.error('Fehler beim Laden der Produkte:', err);
    } finally {
      setLoadingProducts(false);
    }
  }

  const updateCartCount = () => {
    try {
      const existingCart: CartItem[] = JSON.parse(localStorage.getItem('mfa_cart') || '[]');
      const total = existingCart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    } catch (e) {
      console.error('Fehler beim Lesen des Warenkorbs:', e);
    }
  };

  const handleOpenDetails = (p: Product) => {
    setSelectedProduct(p);
    setSelectedSize(p.sizes && p.sizes.length > 0 ? p.sizes[0] : '');
    setSelectedColor(p.colors && p.colors.length > 0 ? p.colors[0] : '');
  };

  const getCalculatedPrice = (p: Product, size: string, color: string) => {
    if (p.variantPrices && p.variantPrices.length > 0) {
      const match = p.variantPrices.find(
        (v) => (v.size === size || v.size === '*') && (v.color === color || v.color === '*')
      );
      if (match) return match.price;
    }
    return p.price;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const finalPrice = getCalculatedPrice(selectedProduct, selectedSize, selectedColor);
    const existingCart: CartItem[] = JSON.parse(localStorage.getItem('mfa_cart') || '[]');

    const cartItemId = `${selectedProduct.id}_${selectedSize || 'default'}_${selectedColor || 'default'}`;
    const existingIndex = existingCart.findIndex((item) => item.id === cartItemId);

    if (existingIndex > -1) {
      existingCart[existingIndex].quantity += 1;
    } else {
      existingCart.push({
        id: cartItemId,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: finalPrice,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        image: selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0] : undefined,
        quantity: 1,
      });
    }

    localStorage.setItem('mfa_cart', JSON.stringify(existingCart));
    updateCartCount();

    // Trigger Toast Notification (Apple-Style)
    setToastMessage(`"${selectedProduct.name}" zum Warenkorb hinzugefügt`);
    setSelectedProduct(null);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-gray-50/50 p-3 sm:p-6 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif] relative">
      
      {/* Apple Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/85 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/10 animate-fade-in flex items-center gap-2">
          <span>🛒</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header Card */}
        <header className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">MFA Shop</h1>
            <OrderWindowBanner />
          </div>

          {/* User Auth & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-gray-200" />
                )}
                <div>
                  <p className="font-bold text-gray-900 leading-tight">{user.displayName}</p>
                  <p className="text-[10px] text-gray-400">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="ml-2 text-[10px] text-red-500 hover:underline font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-all"
              >
                <span>🔑</span> Login mit Google
              </button>
            )}

            <div className="flex items-center gap-2">
              {user && (
                <Link
                  href="/orders"
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 transition-all"
                >
                  📦 Meine Bestellungen
                </Link>
              )}
              <Link
                href="/cart"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs flex items-center gap-2 relative"
              >
                <span>🛒</span>
                <span>Warenkorb</span>
                {cartCount > 0 && (
                  <span className="bg-white text-blue-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ml-0.5">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* 2-Spalten Grid auf Mobile */}
        {loadingProducts ? (
          <div className="py-12 text-center text-xs text-gray-400">Produkte werden geladen...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-3 sm:p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2 sm:mb-3 border border-gray-100 flex items-center justify-center">
                    {p.images && p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">👕</span>
                    )}
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-1">{p.name}</h3>
                  {p.description && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100">
                  <p className="font-extrabold text-xs sm:text-sm text-gray-900 mb-2">
                    {p.price ? `${p.price.toFixed(2)} €` : ''}
                  </p>

                  <button
                    onClick={() => handleOpenDetails(p)}
                    className="w-full min-h-[32px] sm:min-h-[36px] bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1"
                  >
                    Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-900">{selectedProduct.name}</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                >
                  ×
                </button>
              </div>

              {selectedProduct.images && selectedProduct.images[0] && (
                <div className="w-full h-40 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                  <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
              )}

              {selectedProduct.description && (
                <p className="text-xs text-gray-500">{selectedProduct.description}</p>
              )}

              {/* Größen-Auswahl */}
              {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Größe</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          selectedSize === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Farben-Auswahl */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Farbe</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          selectedColor === c
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <span className="text-base font-extrabold text-gray-900">
                  {getCalculatedPrice(selectedProduct, selectedSize, selectedColor).toFixed(2)} €
                </span>
                <button
                  disabled={!isWindowActive}
                  onClick={handleAddToCart}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isWindowActive
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isWindowActive ? 'In den Warenkorb' : 'Geschlossen'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
