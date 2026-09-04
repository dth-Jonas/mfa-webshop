'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const stored = localStorage.getItem('mfa_cart');
      if (stored) {
        setCartItems(JSON.parse(stored));
      } else {
        setCartItems([]);
      }
    } catch (e) {
      console.error('Fehler beim Laden des Warenkorbs:', e);
      setCartItems([]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    setCartItems(updated);
    localStorage.setItem('mfa_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('mfa_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('mfa_cart');
    window.dispatchEvent(new Event('cart-updated'));
  };

  const totalSum = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      alert('Bitte melde dich an, um die Bestellung abzuschließen.');
      return;
    }

    if (cartItems.length === 0) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Unbekannt',
        items: cartItems,
        totalAmount: totalSum,
        status: 'Offen',
        createdAt: serverTimestamp(),
      });

      clearCart();
      setOrderSuccess(true);
    } catch (err) {
      console.error('Fehler beim Aufgeben der Bestellung:', err);
      alert('Fehler beim Speichern der Bestellung. Bitte erneut versuchen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <main className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 border border-gray-200/80 shadow-md">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <h1 className="text-xl font-black text-gray-900">Vielen Dank für deine Bestellung!</h1>
          <p className="text-xs text-gray-500">
            Deine Bestellung wurde erfolgreich erfasst und an das MFA-Team übermittelt.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link
              href="/orders"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all"
            >
              Meine Bestellungen ansehen
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all"
            >
              Zurück zum Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-3 sm:p-6 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
          >
            ← Zurück zum Shop
          </Link>
          <h1 className="text-xl font-black text-gray-900">Dein Warenkorb</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-xs space-y-3">
            <span className="text-4xl block">🛒</span>
            <h2 className="font-bold text-gray-900 text-base">Dein Warenkorb ist leer</h2>
            <p className="text-xs text-gray-400">Füge Produkte aus dem Shop hinzu, um fortzufahren.</p>
            <Link
              href="/"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all"
            >
              Produkte stöbern
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Produkt-Liste */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-100 justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-200/80 overflow-hidden flex items-center justify-center shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">👕</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-gray-900 line-clamp-1">{item.name}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {item.size ? `Größe: ${item.size}` : ''} {item.color ? `| Farbe: ${item.color}` : ''}
                      </p>
                      <p className="text-xs font-extrabold text-gray-900 mt-1">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden text-xs">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 font-bold text-xs p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                className="text-[10px] font-bold text-gray-400 hover:text-gray-600 pt-2 block"
              >
                Warenkorb leeren
              </button>
            </div>

            {/* Bestell-Zusammenfassung */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-4">
              <h2 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">Zusammenfassung</h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Anzahl Artikel:</span>
                  <span className="font-semibold text-gray-800">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Gesamtsumme:</span>
                  <span className="text-blue-600">{totalSum.toFixed(2)} €</span>
                </div>
              </div>

              {user ? (
                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
                >
                  {isSubmitting ? 'Wird übermittelt...' : 'Kostenpflichtig bestellen'}
                </button>
              ) : (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                    ⚠️ Melde dich an, um deine Bestellung abzuschließen.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
