'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../lib/types';
import { useAuth } from '../lib/auth';

interface CartItem {
  cartId: string;
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  imageUrl?: string;
}

export default function HomePage() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWindow, setActiveWindow] = useState<any>(null);

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Cart Counter
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];
      setProducts(items.filter((p) => p.status === 'aktiv'));
      setLoading(false);
    });

    const unsubWindows = onSnapshot(collection(db, 'orderWindows'), (snapshot) => {
      const now = new Date();
      const openWindow = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).find((w: any) => {
        if (!w.startDate || !w.endDate) return false;
        const start = new Date(w.startDate);
        const end = new Date(w.endDate);
        return w.isActive && now >= start && now <= end;
      });
      setActiveWindow(openWindow || null);
    });

    updateCartCount();

    return () => {
      unsubProducts();
      unsubWindows();
    };
  }, []);

  const updateCartCount = () => {
    const savedCart = localStorage.getItem('mfa_cart');
    if (savedCart) {
      try {
        const cart: CartItem[] = JSON.parse(savedCart);
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
      } catch (e) {
        setCartCount(0);
      }
    } else {
      setCartCount(0);
    }
  };

  const getVariantPrice = (product: any, size: string, color: string): number => {
    if (!product) return 0;
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const match = product.variants.find((v: any) => {
        const sizeMatch = !v.size || v.size === size;
        const colorMatch = !v.color || v.color === color;
        return sizeMatch && colorMatch && v.price !== undefined && v.price !== null;
      });
      if (match && typeof match.price === 'number') return match.price;
    }
    if (product.variantPrices && typeof product.variantPrices === 'object') {
      const keyCombined = `${size}-${color}`;
      if (product.variantPrices[keyCombined] !== undefined) return Number(product.variantPrices[keyCombined]);
      if (product.variantPrices[size] !== undefined) return Number(product.variantPrices[size]);
      if (product.variantPrices[color] !== undefined) return Number(product.variantPrices[color]);
    }
    return product.price || 0;
  };

  const openProductModal = (p: Product) => {
    setSelectedProduct(p);
    setSelectedImageIndex(0);
    setSelectedSize(p.sizes && p.sizes.length > 0 ? p.sizes[0] : '');
    setSelectedColor(p.colors && p.colors.length > 0 ? p.colors[0] : '');
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const currentPrice = getVariantPrice(selectedProduct, selectedSize, selectedColor);
    const cartId = `${selectedProduct.id}-${selectedSize}-${selectedColor}-${currentPrice}`;
    const displayImg = selectedProduct.imageUrl || (selectedProduct.images && selectedProduct.images[0]) || '';

    const savedCart = localStorage.getItem('mfa_cart');
    let currentCart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

    const existing = currentCart.find((item) => item.cartId === cartId);
    if (existing) {
      currentCart = currentCart.map((item) =>
        item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      currentCart.push({
        cartId,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: currentPrice,
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
        imageUrl: displayImg,
      });
    }

    localStorage.setItem('mfa_cart', JSON.stringify(currentCart));
    updateCartCount();
    setSelectedProduct(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 font-sans">
      {/* Header mit Auth & Navigation */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">MFA Shop</h1>
          <span
            className={`inline-block mt-1 text-[11px] font-bold px-3 py-1 rounded-full border ${
              activeWindow
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}
          >
            {activeWindow
              ? `🛒 Bestellfenster geöffnet bis ${new Date(activeWindow.endDate).toLocaleDateString('de-DE')}`
              : '🔒 Katalogansicht (Bestellungen geschlossen)'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {user ? (
            <div className="flex items-center gap-3 bg-gray-50 border p-2 rounded-2xl">
              {user.photoURL && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
              )}
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900 leading-none">{user.displayName}</p>
                <p className="text-[10px] text-gray-500 leading-none mt-1">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="text-[10px] font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg ml-1"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <span>🔑 mit Google anmelden</span>
            </button>
          )}

          {user && (
            <Link
              href="/orders"
              className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all"
            >
              📦 Meine Bestellungen
            </Link>
          )}

          <Link
            href="/cart"
            className="relative bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <span>🛒 Warenkorb</span>
            {cartCount > 0 && (
              <span className="bg-white text-blue-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Produktgrid */}
      {loading ? (
        <p className="text-sm font-semibold text-gray-400">Lade Produkte...</p>
      ) : products.length === 0 ? (
        <p className="text-sm font-semibold text-gray-400">Aktuell sind keine Produkte verfügbar.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => {
            const displayImg = p.imageUrl || (p.images && p.images.length > 0 ? p.images[0] : null);

            return (
              <div
                key={p.id}
                className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
                onClick={() => openProductModal(p)}
              >
                <div>
                  <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 mb-3">
                    {displayImg ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={displayImg} alt={p.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-xs text-gray-400 font-bold">Kein Bild</span>
                    )}
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 line-clamp-1">{p.name}</h2>
                  {p.description && (
                    <p className="text-[11px] text-gray-500 font-medium mt-1 line-clamp-2">{p.description}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4 mt-2 border-t border-gray-50">
                  <span className="text-xs font-black text-blue-600">
                    ab {p.price ? p.price.toFixed(2) : '0.00'} €
                  </span>
                  <button className="bg-blue-50 text-blue-600 font-bold text-[11px] px-3 py-1.5 rounded-xl text-center hover:bg-blue-600 hover:text-white transition-all">
                    Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Produkt Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border flex items-center justify-center">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedProduct.images[selectedImageIndex] || selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : selectedProduct.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 font-bold">Kein Bild</span>
                  )}
                </div>

                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex gap-2">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-12 h-12 rounded-xl border overflow-hidden bg-gray-50 ${
                          selectedImageIndex === idx ? 'border-blue-600 border-2' : 'border-gray-200'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h2 className="text-xl font-black text-gray-900">{selectedProduct.name}</h2>
                  <p className="text-xl font-black text-blue-600">
                    {getVariantPrice(selectedProduct, selectedSize, selectedColor).toFixed(2)} €
                  </p>

                  {selectedProduct.description && (
                    <p className="text-xs text-gray-600 leading-relaxed border-t pt-2">
                      {selectedProduct.description}
                    </p>
                  )}

                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Größe auswählen:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.sizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                              selectedSize === s
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Farbe auswählen:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.colors.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                              selectedColor === c
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
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
                    onClick={addToCart}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md"
                  >
                    🛒 In den Warenkorb legen
                  </button>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                    <p className="text-xs font-bold text-amber-800">
                      🔒 Katalogmodus (Bestellungen aktuell geschlossen)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
