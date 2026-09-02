import { collection, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, doc } from 'firebase/firestore';
import { db } from './firebase';
import { OrderWindow } from './types';

const COLLECTION_NAME = 'orderWindows';

export async function getOrderWindows(): Promise<OrderWindow[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as OrderWindow[];
}

export async function getActiveOrderWindowId(): Promise<string | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
  } catch (err) {
    console.error('Fehler beim Abrufen des aktiven Zeitfensters:', err);
  }
  return null;
}

export async function createOrderWindow(data: Omit<OrderWindow, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
  return docRef.id;
}

export async function updateOrderWindow(id: string, data: Partial<OrderWindow>): Promise<void> {
  const windowRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(windowRef, data);
}

export async function deleteOrderWindow(id: string): Promise<void> {
  const windowRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(windowRef);
}

export async function setActiveWindow(id: string, windows: OrderWindow[]): Promise<void> {
  for (const w of windows) {
    const windowRef = doc(db, COLLECTION_NAME, w.id);
    await updateDoc(windowRef, { isActive: w.id === id });
  }
}
