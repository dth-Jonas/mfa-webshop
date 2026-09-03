'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, addDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ChevronDown, ChevronUp, Package, RefreshCw, Plus, Trash2, Clock, ShieldAlert } from 'lucide-react';

interface OrderItem {
  productName?: string;
  name?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  createdAt: any;
  customerName?: string;
  customerEmail?: string;
  userId?: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  items: OrderItem[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
  sizes?: string[];
  colors?: string[];
  stock?: number;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Products State (Erweitert: Varianten, Bestände, Kategorien, Bilder)
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Textilien');
  const [newProductSizes, setNewProductSizes] = useState('S, M, L, XL');
  const [newProductColors, setNewProductColors] = useState('Schwarz, Weiß');
  const [newProductStock, setNewProductStock] = useState('10');

  // Settings / Time Window State
  const [timeWindowEnabled, setTimeWindowEnabled] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');

  // Admin-Berechtigung prüfen anhand der Google-Mail
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'Dth-jonas@gmx.de') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders (inkl. userId-Zuordnung)
      const orderSnap = await getDocs(collection(db, 'orders'));
      const fetchedOrders: Order[] = [];
      orderSnap.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedOrders.push({
          id: docSnap.id,
          createdAt: data.createdAt,
          customerName: data.customerName || data.name || 'Kunde',
          customerEmail: data.customerEmail || data.email || 'kunden@mail.de',
          userId: data.userId || 'unbekannt',
          totalAmount: data.totalAmount || 0,
          status: data.status || 'Eingegangen',
          paymentMethod: data.paymentMethod || 'offen',
          items: data.items || [],
        });
      });

      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setOrders(fetchedOrders);

      // 2. Fetch Products
      const prodSnap = await getDocs(collection(db, 'products'));
      const fetchedProducts: Product[] = [];
      prodSnap.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedProducts.push({
          id: docSnap.id,
          name: data.name || '',
          price: data.price || 0,
          description: data.description || '',
          image: data.image || '',
          category: data.category || 'Textilien',
          sizes: data.sizes || [],
          colors: data.colors || [],
          stock: data.stock || 0,
        });
      });
      setProducts(fetchedProducts);

    } catch (e) {
      console.error("Fehler beim Laden der Admin-Daten:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeWindowSettings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'settings'));
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id === 'timewindow') {
          const data = docSnap.data();
          setTimeWindowEnabled(!!data.enabled);
          setStartTime(data.startTime || '08:00');
          setEndTime(data.endTime || '20:00');
        }
      });
    } catch (e) {
      console.error("Fehler beim Laden des Zeitfensters:", e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchTimeWindowSettings();
    }
  }, [isAdmin]);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error("Fehler beim Status:", e);
    }
  };

  const updatePayment = async (id: string, newPayment: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { paymentMethod: newPayment });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentMethod: newPayment } : o));
    } catch (e) {
      console.error("Fehler bei Bezahlung:", e);
    }
  };

  const handleAdminResetOrders = async () => {
    if (!window.confirm("ACHTUNG: Möchtest du wirklich alle Bestellungen unwiderruflich aus der Datenbank löschen?")) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(doc(db, 'orders', document.id));
      });
      await batch.commit();
      alert("Alle Bestellungen wurden erfolgreich aus der Datenbank gelöscht.");
      fetchData();
    } catch (e) {
      console.error("Fehler beim Zurücksetzen:", e);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) return;
    try {
      const sizesArray = newProductSizes.split(',').map(s => s.trim()).filter(Boolean);
      const colorsArray = newProductColors.split(',').map(c => c.trim()).filter(Boolean);

      await addDoc(collection(db, 'products'), {
        name: newProductName,
        price: parseFloat(newProductPrice),
        description: newProductDesc,
        image: newProductImage,
        category: newProductCategory,
        sizes: sizesArray,
        colors: colorsArray,
        stock: parseInt(newProductStock) || 0,
        createdAt: new Date()
      });

      setNewProductName('');
      setNewProductPrice('');
      setNewProductDesc('');
      setNewProductImage('');
      setNewProductSizes('S, M, L, XL');
      setNewProductColors('Schwarz, Weiß');
      setNewProductStock('10');
      alert("Artikel mit vollem Funktionsumfang erfolgreich angelegt!");
      fetchData();
    } catch (e) {
      console.error("Fehler beim Hinzufügen des Artikels:", e);
      alert("Fehler beim Erstellen.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Artikel wirklich löschen?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error("Fehler beim Löschen des Artikels:", e);
    }
  };

  const saveTimeWindow = async (enabled: boolean, start: string, end: string) => {
    setTimeWindowEnabled(enabled);
    setStartTime(start);
    setEndTime(end);
    try {
      await setDoc(doc(db, 'settings', 'timewindow'), {
        enabled,
        startTime: start,
        endTime: end,
        updatedAt: new Date()
      });
      alert("Bestellzeit-Fenster erfolgreich persistent in Firebase gespeichert!");
    } catch (e) {
      console.error("Fehler beim Speichern des Zeitfensters:", e);
      alert("Fehler beim Speichern in Firebase.");
    }
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Gerade eben';
    try {
      const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(date.getTime())) return 'Gerade eben';
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Gerade eben';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500 font-medium">Lade Berechtigungen & Dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md text-center space-y-4">
          <ShieldAlert size={48} className="mx-auto text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">Zugriff verweigert</h1>
          <p className="text-xs text-gray-500">
            Du bist entweder nicht eingeloggt oder dein Google-Account ist nicht als Administrator berechtigt. Bitte logge dich mit <span className="font-semibold text-gray-800">Dth-jonas@gmx.de</span> ein.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin-Dashboard</h1>
            <p className="text-xs text-gray-500">Eingeloggt als Admin: Dth-jonas@gmx.de</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Bestellverwaltung ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Artikel verwalten ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Bestellzeit-Fenster
            </button>
          </div>
        </div>

        {/* TAB 1: BESTELLUNGEN */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={fetchData}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <RefreshCw size={14} /> Aktualisieren
              </button>
              <button
                onClick={handleAdminResetOrders}
                className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
              >
                Datenbank leeren (Reset)
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                <div className="col-span-3">Kunde / Datum</div>
                <div className="col-span-3">Bestellte Artikel</div>
                <div className="col-span-2 text-right">Gesamtsumme</div>
                <div className="col-span-2 text-center">Bestellstatus</div>
                <div className="col-span-2 text-center">Bezahlung</div>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Package size={36} className="mx-auto text-gray-300 mb-2" />
                  Keine Bestellungen vorhanden.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const isExpanded = !!expandedOrders[order.id];
                    const totalItems = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
                    const positionCount = order.items?.length || 0;

                    return (
                      <div key={order.id} className="transition-colors hover:bg-gray-50/50">
                        <div className="grid grid-cols-12 gap-2 p-4 items-center text-sm">
                          <div className="col-span-3 flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            <div>
                              <div className="font-bold text-gray-900">{order.customerName}</div>
                              <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                            </div>
                          </div>

                          <div className="col-span-3 text-gray-700 font-medium cursor-pointer" onClick={() => toggleExpand(order.id)}>
                            {positionCount} {positionCount === 1 ? 'Position' : 'Positionen'} ({totalItems} {totalItems === 1 ? 'Artikel' : 'Artikel'})
                          </div>

                          <div className="col-span-2 text-right font-black text-gray-900">
                            {order.totalAmount?.toFixed(2)} €
                          </div>

                          <div className="col-span-2 text-center">
                            <select
                              value={order.status}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 cursor-pointer focus:outline-none"
                            >
                              <option value="Eingegangen">Eingegangen</option>
                              <option value="In Bearbeitung">In Bearbeitung</option>
                              <option value="Abgeschlossen">Abgeschlossen</option>
                              <option value="Storniert">Storniert</option>
                            </select>
                          </div>

                          <div className="col-span-2 text-center">
                            <select
                              value={order.paymentMethod}
                              onChange={(e) => updatePayment(order.id, e.target.value)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 cursor-pointer focus:outline-none"
                            >
                              <option value="offen">offen</option>
                              <option value="bezahlt">bezahlt</option>
                            </select>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-gray-50/80 p-4 border-t border-gray-100">
                            <div className="text-xs text-gray-500 mb-2">
                              <strong>E-Mail:</strong> {order.customerEmail} | <strong>User-ID:</strong> {order.userId} | <strong>Bestell-ID:</strong> {order.id}
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                  <tr>
                                    <th className="p-2.5">Artikel</th>
                                    <th className="p-2.5">Variante</th>
                                    <th className="p-2.5 text-center">Menge</th>
                                    <th className="p-2.5 text-right">Einzelpreis</th>
                                    <th className="p-2.5 text-right">Gesamt</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {order.items?.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="p-2.5 font-semibold text-gray-900">{item.productName || item.name}</td>
                                      <td className="p-2.5 text-gray-500">{[item.size ? `Größe ${item.size}` : null, item.color].filter(Boolean).join(' / ') || 'Standard'}</td>
                                      <td className="p-2.5 text-center font-bold text-gray-700">{item.quantity}</td>
                                      <td className="p-2.5 text-right text-gray-500">{item.price?.toFixed(2)} €</td>
                                      <td className="p-2.5 text-right font-bold text-gray-900">{((item.price || 0) * item.quantity).toFixed(2)} €</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ARTIKEL VERWALTEN (VOLLSTÄNDIGER FUNKTIONSUMFANG) */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus size={18} /> Artikel anlegen (Vollständig)
              </h2>
              <form onSubmit={handleAddProduct} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Produktname</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="z.B. T-Shirt Special Edition"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Preis (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="39.99"
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kategorie</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="Textilien">Textilien</option>
                      <option value="Accessoires">Accessoires</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Produktfoto (Bild-URL)</label>
                  <input
                    type="url"
                    value={newProductImage}
                    onChange={(e) => setNewProductImage(e.target.value)}
                    placeholder="https://example.com/bild.jpg"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Größen (kommasepariert)</label>
                    <input
                      type="text"
                      value={newProductSizes}
                      onChange={(e) => setNewProductSizes(e.target.value)}
                      placeholder="S, M, L, XL"
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Farben (kommasepariert)</label>
                    <input
                      type="text"
                      value={newProductColors}
                      onChange={(e) => setNewProductColors(e.target.value)}
                      placeholder="Schwarz, Weiß"
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Lagerbestand</label>
                  <input
                    type="number"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    placeholder="10"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Beschreibung</label>
                  <textarea
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Detaillierte Beschreibung..."
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 h-16"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Artikel speichern
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900">Aktive Artikel im Shop ({products.length})</h2>
              {products.length === 0 ? (
                <p className="text-xs text-gray-500">Keine Artikel gefunden.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {products.map((prod) => (
                    <div key={prod.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {prod.image ? (
                          <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                            <Package size={20} />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-gray-900">{prod.name}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{prod.description || 'Keine Beschreibung'}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{prod.category || 'Textilien'}</span>
                            {prod.sizes && prod.sizes.length > 0 && (
                              <span className="text-[11px] text-gray-500">Größen: {prod.sizes.join(', ')}</span>
                            )}
                            <span className="text-xs font-bold text-blue-600">{prod.price?.toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                        title="Artikel löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BESTELLZEIT-FENSTER */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-xl space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock size={18} /> Bestellzeit-Fenster konfigurieren
            </h2>
            <p className="text-xs text-gray-500">
              Lege fest, in welchem Zeitraum Kunden Bestellungen im Shop aufgeben dürfen. Die Konfiguration wird zentral in Firebase gespeichert.
            </p>
            <div className="space-y-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={timeWindowEnabled}
                  onChange={(e) => setTimeWindowEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-gray-900">Bestellzeit-Fenster aktiv schalten</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Startzeit</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Endzeit</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <button
                onClick={() => saveTimeWindow(timeWindowEnabled, startTime, endTime)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
              >
                Zeitfenster in Firebase speichern
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
EOFcat << 'EOF' > src/app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, addDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ChevronDown, ChevronUp, Package, RefreshCw, Plus, Trash2, Clock, ShieldAlert } from 'lucide-react';

interface OrderItem {
  productName?: string;
  name?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  createdAt: any;
  customerName?: string;
  customerEmail?: string;
  userId?: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  items: OrderItem[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
  sizes?: string[];
  colors?: string[];
  stock?: number;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Products State (Erweitert: Varianten, Bestände, Kategorien, Bilder)
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Textilien');
  const [newProductSizes, setNewProductSizes] = useState('S, M, L, XL');
  const [newProductColors, setNewProductColors] = useState('Schwarz, Weiß');
  const [newProductStock, setNewProductStock] = useState('10');

  // Settings / Time Window State
  const [timeWindowEnabled, setTimeWindowEnabled] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');

  // Admin-Berechtigung prüfen anhand der Google-Mail
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'Dth-jonas@gmx.de') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders (inkl. userId-Zuordnung)
      const orderSnap = await getDocs(collection(db, 'orders'));
      const fetchedOrders: Order[] = [];
      orderSnap.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedOrders.push({
          id: docSnap.id,
          createdAt: data.createdAt,
          customerName: data.customerName || data.name || 'Kunde',
          customerEmail: data.customerEmail || data.email || 'kunden@mail.de',
          userId: data.userId || 'unbekannt',
          totalAmount: data.totalAmount || 0,
          status: data.status || 'Eingegangen',
          paymentMethod: data.paymentMethod || 'offen',
          items: data.items || [],
        });
      });

      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setOrders(fetchedOrders);

      // 2. Fetch Products
      const prodSnap = await getDocs(collection(db, 'products'));
      const fetchedProducts: Product[] = [];
      prodSnap.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedProducts.push({
          id: docSnap.id,
          name: data.name || '',
          price: data.price || 0,
          description: data.description || '',
          image: data.image || '',
          category: data.category || 'Textilien',
          sizes: data.sizes || [],
          colors: data.colors || [],
          stock: data.stock || 0,
        });
      });
      setProducts(fetchedProducts);

    } catch (e) {
      console.error("Fehler beim Laden der Admin-Daten:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeWindowSettings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'settings'));
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id === 'timewindow') {
          const data = docSnap.data();
          setTimeWindowEnabled(!!data.enabled);
          setStartTime(data.startTime || '08:00');
          setEndTime(data.endTime || '20:00');
        }
      });
    } catch (e) {
      console.error("Fehler beim Laden des Zeitfensters:", e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchTimeWindowSettings();
    }
  }, [isAdmin]);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error("Fehler beim Status:", e);
    }
  };

  const updatePayment = async (id: string, newPayment: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { paymentMethod: newPayment });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentMethod: newPayment } : o));
    } catch (e) {
      console.error("Fehler bei Bezahlung:", e);
    }
  };

  const handleAdminResetOrders = async () => {
    if (!window.confirm("ACHTUNG: Möchtest du wirklich alle Bestellungen unwiderruflich aus der Datenbank löschen?")) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(doc(db, 'orders', document.id));
      });
      await batch.commit();
      alert("Alle Bestellungen wurden erfolgreich aus der Datenbank gelöscht.");
      fetchData();
    } catch (e) {
      console.error("Fehler beim Zurücksetzen:", e);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) return;
    try {
      const sizesArray = newProductSizes.split(',').map(s => s.trim()).filter(Boolean);
      const colorsArray = newProductColors.split(',').map(c => c.trim()).filter(Boolean);

      await addDoc(collection(db, 'products'), {
        name: newProductName,
        price: parseFloat(newProductPrice),
        description: newProductDesc,
        image: newProductImage,
        category: newProductCategory,
        sizes: sizesArray,
        colors: colorsArray,
        stock: parseInt(newProductStock) || 0,
        createdAt: new Date()
      });

      setNewProductName('');
      setNewProductPrice('');
      setNewProductDesc('');
      setNewProductImage('');
      setNewProductSizes('S, M, L, XL');
      setNewProductColors('Schwarz, Weiß');
      setNewProductStock('10');
      alert("Artikel mit vollem Funktionsumfang erfolgreich angelegt!");
      fetchData();
    } catch (e) {
      console.error("Fehler beim Hinzufügen des Artikels:", e);
      alert("Fehler beim Erstellen.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Artikel wirklich löschen?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error("Fehler beim Löschen des Artikels:", e);
    }
  };

  const saveTimeWindow = async (enabled: boolean, start: string, end: string) => {
    setTimeWindowEnabled(enabled);
    setStartTime(start);
    setEndTime(end);
    try {
      await setDoc(doc(db, 'settings', 'timewindow'), {
        enabled,
        startTime: start,
        endTime: end,
        updatedAt: new Date()
      });
      alert("Bestellzeit-Fenster erfolgreich persistent in Firebase gespeichert!");
    } catch (e) {
      console.error("Fehler beim Speichern des Zeitfensters:", e);
      alert("Fehler beim Speichern in Firebase.");
    }
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Gerade eben';
    try {
      const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(date.getTime())) return 'Gerade eben';
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Gerade eben';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500 font-medium">Lade Berechtigungen & Dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md text-center space-y-4">
          <ShieldAlert size={48} className="mx-auto text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">Zugriff verweigert</h1>
          <p className="text-xs text-gray-500">
            Du bist entweder nicht eingeloggt oder dein Google-Account ist nicht als Administrator berechtigt. Bitte logge dich mit <span className="font-semibold text-gray-800">Dth-jonas@gmx.de</span> ein.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin-Dashboard</h1>
            <p className="text-xs text-gray-500">Eingeloggt als Admin: Dth-jonas@gmx.de</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Bestellverwaltung ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Artikel verwalten ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Bestellzeit-Fenster
            </button>
          </div>
        </div>

        {/* TAB 1: BESTELLUNGEN */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={fetchData}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <RefreshCw size={14} /> Aktualisieren
              </button>
              <button
                onClick={handleAdminResetOrders}
                className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
              >
                Datenbank leeren (Reset)
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                <div className="col-span-3">Kunde / Datum</div>
                <div className="col-span-3">Bestellte Artikel</div>
                <div className="col-span-2 text-right">Gesamtsumme</div>
                <div className="col-span-2 text-center">Bestellstatus</div>
                <div className="col-span-2 text-center">Bezahlung</div>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Package size={36} className="mx-auto text-gray-300 mb-2" />
                  Keine Bestellungen vorhanden.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const isExpanded = !!expandedOrders[order.id];
                    const totalItems = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
                    const positionCount = order.items?.length || 0;

                    return (
                      <div key={order.id} className="transition-colors hover:bg-gray-50/50">
                        <div className="grid grid-cols-12 gap-2 p-4 items-center text-sm">
                          <div className="col-span-3 flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            <div>
                              <div className="font-bold text-gray-900">{order.customerName}</div>
                              <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                            </div>
                          </div>

                          <div className="col-span-3 text-gray-700 font-medium cursor-pointer" onClick={() => toggleExpand(order.id)}>
                            {positionCount} {positionCount === 1 ? 'Position' : 'Positionen'} ({totalItems} {totalItems === 1 ? 'Artikel' : 'Artikel'})
                          </div>

                          <div className="col-span-2 text-right font-black text-gray-900">
                            {order.totalAmount?.toFixed(2)} €
                          </div>

                          <div className="col-span-2 text-center">
                            <select
                              value={order.status}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 cursor-pointer focus:outline-none"
                            >
                              <option value="Eingegangen">Eingegangen</option>
                              <option value="In Bearbeitung">In Bearbeitung</option>
                              <option value="Abgeschlossen">Abgeschlossen</option>
                              <option value="Storniert">Storniert</option>
                            </select>
                          </div>

                          <div className="col-span-2 text-center">
                            <select
                              value={order.paymentMethod}
                              onChange={(e) => updatePayment(order.id, e.target.value)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 cursor-pointer focus:outline-none"
                            >
                              <option value="offen">offen</option>
                              <option value="bezahlt">bezahlt</option>
                            </select>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-gray-50/80 p-4 border-t border-gray-100">
                            <div className="text-xs text-gray-500 mb-2">
                              <strong>E-Mail:</strong> {order.customerEmail} | <strong>User-ID:</strong> {order.userId} | <strong>Bestell-ID:</strong> {order.id}
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                  <tr>
                                    <th className="p-2.5">Artikel</th>
                                    <th className="p-2.5">Variante</th>
                                    <th className="p-2.5 text-center">Menge</th>
                                    <th className="p-2.5 text-right">Einzelpreis</th>
                                    <th className="p-2.5 text-right">Gesamt</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {order.items?.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="p-2.5 font-semibold text-gray-900">{item.productName || item.name}</td>
                                      <td className="p-2.5 text-gray-500">{[item.size ? `Größe ${item.size}` : null, item.color].filter(Boolean).join(' / ') || 'Standard'}</td>
                                      <td className="p-2.5 text-center font-bold text-gray-700">{item.quantity}</td>
                                      <td className="p-2.5 text-right text-gray-500">{item.price?.toFixed(2)} €</td>
                                      <td className="p-2.5 text-right font-bold text-gray-900">{((item.price || 0) * item.quantity).toFixed(2)} €</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ARTIKEL VERWALTEN (VOLLSTÄNDIGER FUNKTIONSUMFANG) */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus size={18} /> Artikel anlegen (Vollständig)
              </h2>
              <form onSubmit={handleAddProduct} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Produktname</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="z.B. T-Shirt Special Edition"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Preis (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="39.99"
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kategorie</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="Textilien">Textilien</option>
                      <option value="Accessoires">Accessoires</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Produktfoto (Bild-URL)</label>
                  <input
                    type="url"
                    value={newProductImage}
                    onChange={(e) => setNewProductImage(e.target.value)}
                    placeholder="https://example.com/bild.jpg"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Größen (kommasepariert)</label>
                    <input
                      type="text"
                      value={newProductSizes}
                      onChange={(e) => setNewProductSizes(e.target.value)}
                      placeholder="S, M, L, XL"
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Farben (kommasepariert)</label>
                    <input
                      type="text"
                      value={newProductColors}
                      onChange={(e) => setNewProductColors(e.target.value)}
                      placeholder="Schwarz, Weiß"
                      className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Lagerbestand</label>
                  <input
                    type="number"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    placeholder="10"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Beschreibung</label>
                  <textarea
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Detaillierte Beschreibung..."
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 h-16"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Artikel speichern
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900">Aktive Artikel im Shop ({products.length})</h2>
              {products.length === 0 ? (
                <p className="text-xs text-gray-500">Keine Artikel gefunden.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {products.map((prod) => (
                    <div key={prod.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {prod.image ? (
                          <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                            <Package size={20} />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-gray-900">{prod.name}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{prod.description || 'Keine Beschreibung'}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{prod.category || 'Textilien'}</span>
                            {prod.sizes && prod.sizes.length > 0 && (
                              <span className="text-[11px] text-gray-500">Größen: {prod.sizes.join(', ')}</span>
                            )}
                            <span className="text-xs font-bold text-blue-600">{prod.price?.toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                        title="Artikel löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BESTELLZEIT-FENSTER */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-xl space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock size={18} /> Bestellzeit-Fenster konfigurieren
            </h2>
            <p className="text-xs text-gray-500">
              Lege fest, in welchem Zeitraum Kunden Bestellungen im Shop aufgeben dürfen. Die Konfiguration wird zentral in Firebase gespeichert.
            </p>
            <div className="space-y-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={timeWindowEnabled}
                  onChange={(e) => setTimeWindowEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-gray-900">Bestellzeit-Fenster aktiv schalten</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Startzeit</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Endzeit</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <button
                onClick={() => saveTimeWindow(timeWindowEnabled, startTime, endTime)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
              >
                Zeitfenster in Firebase speichern
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
