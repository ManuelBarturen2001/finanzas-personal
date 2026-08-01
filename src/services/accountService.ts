import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import type { CreateAccountInput, UpdateAccountInput } from "@/lib/validations/accounts";

const ACCOUNTS_COLLECTION = "accounts";

export async function createAccount(
  userId: string,
  input: CreateAccountInput
): Promise<string> {
  const docRef = await addDoc(collection(db, ACCOUNTS_COLLECTION), {
    userId,
    name: input.name,
    type: input.type,
    initialBalance: input.initialBalance,
    // El saldo actual arranca igual al saldo inicial; a partir de aquí se
    // mantiene actualizado de forma denormalizada en transactionService.
    currentBalance: input.initialBalance,
    currency: input.currency,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateAccount(
  accountId: string,
  input: UpdateAccountInput
): Promise<void> {
  await updateDoc(doc(db, ACCOUNTS_COLLECTION, accountId), {
    name: input.name,
    type: input.type,
    currency: input.currency,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft delete: se desactiva la cuenta en vez de borrarla físicamente,
 * porque los movimientos históricos siguen referenciando su accountId.
 * Las cuentas inactivas se ocultan de los selects de "nuevo movimiento"
 * pero sus movimientos pasados se siguen mostrando con normalidad.
 */
export async function deactivateAccount(accountId: string): Promise<void> {
  await updateDoc(doc(db, ACCOUNTS_COLLECTION, accountId), {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function reactivateAccount(accountId: string): Promise<void> {
  await updateDoc(doc(db, ACCOUNTS_COLLECTION, accountId), {
    isActive: true,
    updatedAt: serverTimestamp(),
  });
}
