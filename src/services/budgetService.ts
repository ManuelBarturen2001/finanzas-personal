import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import type { Budget, BudgetFrequency } from "@/types";

const BUDGETS_COLLECTION = "budgets";

export type BudgetInput = {
  categoryId: string;
  amount: number;
  frequency: BudgetFrequency;
  period: string;
};

export async function createBudget(
  userId: string,
  input: BudgetInput
): Promise<string> {
  const docRef = await addDoc(collection(db, BUDGETS_COLLECTION), {
    userId,
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateBudget(
  budgetId: string,
  input: Omit<BudgetInput, "categoryId">
): Promise<void> {
  await updateDoc(doc(db, BUDGETS_COLLECTION, budgetId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}
