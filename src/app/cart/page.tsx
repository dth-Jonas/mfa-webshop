'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';

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

export default function CartPage() {
  const { user, loginWithGoogle } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeWindow, setActiveWindow] = useState<any>(null);
  const [loadingWindow, setLoadingWindow] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('mfa_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Fehler beim Laden des Warenkorbs:', e);
      }
    }

    if (user?.displayName) {
      setCustomerName(user.displayName);
    }

    const unsubWindows = onSnapshot(collection(db, 'orderWindows'), (snapshot) => {
      const now = new Date();
      const openWindow = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).find((w: any) => {
        if (!w.startDate || !w.endDate) return false;
        const start = new Date(w.startDate);
        const end = new Date(w.endDate);
        return now >= start && now <= end;
      });
      setActiveWindow(openWindow || null);
      setLoadingWindow(false);
    });

    return () => unsubWindows();
  }, [user]);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('mfa_cart', JSON.stringify(newCart));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    saveCart(updated);
  };

  const removeItem = (cartId: string) => {
    const updated = cart.filter((item) => item.cartId !== cartId);
    saveCart(updated);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cart.length === 0 || !activeWindow) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        email: user.email?.toLowerCase(),
        userName: customerName || user.displayName || user.email || 'Unbenannt',
        customerName: customerName || user.displayName || 'Unbenannt',
        windowId: activeWindow.id,
        windowTitle: activeWindow.title || 'Bestellfenster',
        note: customerNote,
        items: cart,
        totalAmount: totalPrice,
        createdAt: serverTimestamp(),
        status: 'eingegangen',
      });

      saveCart([]);
      setOrderSuccess(true);
    } catch (err) {
      console.error('Fehler beim Absenden:', err);
      alert('Fehler beim Absenden der Bestellung.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">🛒 Dein Warenkorb</h1>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Überprüfe deine Auswahl und schließe deine Bestellung ab.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <Link
              href="/orders"
              className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all"
            >
              📦 Meine Bestellungen
            </Link>
          )}
          <Link
            href="/"
            className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all"
          >
            ← Zum Shop
          </Link>
        </div>
      </div>

      {orderSuccess ? (
        <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
          <span className="text-4xl">🎉</span>
          <h2 className="text-xl font-bold text-emerald-900">Vielen Dank für deine Bestellung!</h2>
          <p className="text-xs text-emerald-700 max-w-md mx-auto">
            Deine Bestellung wurde während des aktuellen Bestellfensters hinterlegt. Du kannst deine Bestellung jederzeit einsehen und bearbeiten, solange das Fenster geöffnet ist.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/orders"
              className="bg-emerald-600 text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-md"
            >
              Bestellungen verwalten
            </Link>
            <Link
              href="/"
              className="bg-white text-emerald-800 border border-emerald-300 text-xs font-bold px-6 py-3 rounded-xl hover:bg-emerald-100 transition-all"
            >
              Weiter einkaufen
            </Link>
          </div>
        </div>
      ) : cart.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-4">
          <span className="text-4xl">🛒</span>
          <p className="text-sm font-bold text-gray-500">Dein Warenkorb ist aktuell leer.</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-blue-700 transition-all"
          >
            Jetzt Produkte entdecken
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ausgewählte Artikel</h2>
              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.cartId} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {item.imageUrl && (
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 p-1 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-500">
                          Größe: {item.size || '-'} | Farbe: {item.color || '-'}
                        </p>
                        <p className="text-xs font-black text-blue-600 mt-1">
                          {item.price.toFixed(2)} € / Stk.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="w-6 h-6 bg-white border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="w-6 h-6 bg-white border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.cartId)}
                        className="text-gray-400 hover:text-red-500 font-bold text-xs p-1"
                        title="Artikel entfernen"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Bestellübersicht</h2>

              <div className="border-t border-b py-3 flex justify-between items-center text-base font-black text-gray-900">
                <span>Gesamtsumme:</span>
                <span className="text-blue-600">{totalPrice.toFixed(2)} €</span>
              </div>

              {!user ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center space-y-3">
                  <p className="text-xs font-bold text-gray-700">Anmeldung erforderlich</p>
                  <p className="text-[11px] text-gray-500">
                    Melde dich mit Google an, um deine Bestellung deinem Konto zuzuordnen.
                  </p>
                  <button
                    onClick={loginWithGoogle}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                  >
                    🔑 Mit Google anmelden
                  </button>
                </div>
              ) : loadingWindow ? (
                <p className="text-xs text-gray-400">Prüfe Bestellfenster...</p>
              ) : activeWindow ? (
                <form onSubmit={handleCheckout} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">E-Mail (Google-Konto)</label>
                    <input
                      type="email"
                      disabled
                      value={user.email || ''}
                      className="w-full text-xs p-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Anmerkung (optional)</label>
                    <textarea
                      placeholder="Anmerkungen zur Bestellung"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 h-20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50 mt-2"
                  >
                    {submitting ? 'Bestellung wird gesendet...' : 'Kostenpflichtig bestellen'}
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1">
                  <p className="text-xs font-bold text-amber-900">🔒 Katalogmodus</p>
                  <p className="text-[11px] text-amber-700">
                    Das Bestellfenster ist aktuell geschlossen. Es können keine Bestellungen abgesendet werden.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
