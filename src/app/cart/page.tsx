'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, onSnapshot, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      const savedCart = localStorage.getItem('mfa_cart_guest');
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
      setLoading(false);
      return;
    }

    const cartRef = doc(db, 'carts', user.uid);
    const unsub = onSnapshot(cartRef, (docSnap) => {
      if (docSnap.exists()) {
        setCartItems(docSnap.data().items || []);
      } else {
        setCartItems([]);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore Cart Error:", err);
      // Fallback auf localStorage, falls Firestore Rules blockieren
      const savedCart = localStorage.getItem(`mfa_cart_${user.uid}`);
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const updateCart = async (newItems: CartItem[]) => {
    setCartItems(newItems);
    if (user) {
      localStorage.setItem(`mfa_cart_${user.uid}`, JSON.stringify(newItems));
      try {
        await setDoc(doc(db, 'carts', user.uid), { items: newItems, updatedAt: serverTimestamp() });
      } catch (e) {
        console.error("Fehler beim Aktualisieren im Firestore:", e);
      }
    } else {
      localStorage.setItem('mfa_cart_guest', JSON.stringify(newItems));
    }
  };

  const changeQuantity = (cartId: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    updateCart(updated);
  };

  const removeItem = (cartId: string) => {
    const updated = cartItems.filter((item) => item.cartId !== cartId);
    updateCart(updated);
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userName: user.displayName || 'Unbekannt',
        userEmail: user.email || '',
        items: cartItems,
        totalAmount: totalPrice,
        status: 'offen',
        createdAt: serverTimestamp(),
      });

      // Warenkorb nach Bestellung leeren
      await updateCart([]);
      setOrderSuccess(true);
    } catch (err) {
      console.error('Fehler bei der Bestellung:', err);
      alert('Bestellung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-400">Warenkorb wird geladen...</div>;

  if (orderSuccess) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border text-center space-y-4">
        <span className="text-4xl">🎉</span>
        <h1 className="text-xl font-black text-gray-900">Vielen Dank für deine Bestellung!</h1>
        <p className="text-xs text-gray-500">Deine Bestellung wurde erfolgreich übermittelt.</p>
        <Link href="/" className="inline-block bg-blue-600 text-white font-bold text-xs px-6 py-3 rounded-2xl">
          Zurück zum Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-900">Dein Warenkorb</h1>
        <Link href="/" className="text-xs font-bold text-gray-500 hover:text-gray-900">
          ← Weiter einkaufen
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border text-center space-y-4">
          <p className="text-sm font-bold text-gray-400">Dein Warenkorb ist noch leer.</p>
          <Link href="/" className="inline-block bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
            Jetzt Produkte entdecken
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border divide-y overflow-hidden">
            {cartItems.map((item) => (
              <div key={item.cartId} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {item.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-xl object-contain bg-gray-50 border p-1" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">{item.name}</h3>
                    <p className="text-[10px] text-gray-400 font-semibold">
                      {item.size && `Größe: ${item.size}`} {item.color && `| Farbe: ${item.color}`}
                    </p>
                    <p className="text-xs font-black text-blue-600 mt-0.5">{item.price.toFixed(2)} €</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-xl overflow-hidden bg-gray-50">
                    <button
                      onClick={() => changeQuantity(item.cartId, -1)}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => changeQuantity(item.cartId, 1)}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.cartId)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold p-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-3xl border space-y-4">
            <div className="flex justify-between items-center text-sm font-black">
              <span>Gesamtsumme:</span>
              <span className="text-blue-600 text-base">{totalPrice.toFixed(2)} €</span>
            </div>

            {user ? (
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Bestellung wird gesendet...' : 'Kostenpflichtig bestellen'}
              </button>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                <p className="text-xs font-bold text-amber-800">
                  Bitte melde dich an, um die Bestellung abzuschließen.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
