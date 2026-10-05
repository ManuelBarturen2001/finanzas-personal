import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import type { CategoryKind } from "@/types";

const CATEGORIES_COLLECTION = "categories";

export async function createCategory(
  userId: string,
  input: { name: string; kind: CategoryKind }
): Promise<string> {
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
    userId,
    name: input.name,
    kind: input.kind,
    isDefault: false,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateCategory(
  categoryId: string,
  input: { name: string; kind: CategoryKind }
): Promise<void> {
  await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), {
    name: input.name,
    kind: input.kind,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft delete: igual que las cuentas, las categorías no se borran
 * físicamente si ya tienen movimientos asociados (y no podemos saberlo
 * de forma barata sin una consulta extra), así que directamente nunca se
 * borran: se desactivan y dejan de aparecer en los selects de nuevo
 * movimiento, pero los movimientos históricos las siguen mostrando bien.
 */
export async function deactivateCategory(categoryId: string): Promise<void> {
  await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}
