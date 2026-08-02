import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client";

export async function payDebtInstallment(debtId: string, amount: number): Promise<void> {
  const debtRef = doc(db, "debts", debtId);
  const debtSnap = await getDoc(debtRef);

  if (!debtSnap.exists()) {
    throw new Error("La deuda seleccionada no existe.");
  }

  const debt = debtSnap.data();
  const paidInstallments = (debt.paidInstallments as number) + 1;
  const remainingInstallments = Math.max(
    (debt.totalInstallments as number) - paidInstallments,
    0
  );
  const paidAmount = (debt.paidAmount as number) + amount;
  const remainingAmount = Math.max((debt.remainingAmount as number) - amount, 0);

  await updateDoc(debtRef, {
    paidInstallments,
    remainingInstallments,
    paidAmount,
    remainingAmount,
    updatedAt: serverTimestamp(),
    ...(remainingAmount === 0 ? { isActive: false } : {}),
  });
}

export async function updateDebtDetails(
  debtId: string,
  input: {
    name: string;
    monthlyPayment: number;
    totalInstallments: number;
    interestRate?: number;
  }
): Promise<void> {
  const debtRef = doc(db, "debts", debtId);
  const debtSnap = await getDoc(debtRef);

  if (!debtSnap.exists()) {
    throw new Error("La deuda seleccionada no existe.");
  }

  const debt = debtSnap.data();
  const paidInstallments = debt.paidInstallments as number;
  const totalInstallments = Math.max(input.totalInstallments, paidInstallments);
  const remainingInstallments = Math.max(totalInstallments - paidInstallments, 0);

  await updateDoc(debtRef, {
    name: input.name,
    monthlyPayment: input.monthlyPayment,
    totalInstallments,
    interestRate: input.interestRate,
    remainingInstallments,
    updatedAt: serverTimestamp(),
  });
}

export async function updateDebtProgress(
  debtId: string,
  input: {
    paidInstallments: number;
    paidAmount: number;
    remainingAmount: number;
  }
): Promise<void> {
  const debtRef = doc(db, "debts", debtId);
  const debtSnap = await getDoc(debtRef);

  if (!debtSnap.exists()) {
    throw new Error("La deuda seleccionada no existe.");
  }

  const debt = debtSnap.data();
  const totalInstallments = debt.totalInstallments as number;
  const paidInstallments = Math.min(Math.max(input.paidInstallments, 0), totalInstallments);
  const remainingInstallments = Math.max(totalInstallments - paidInstallments, 0);
  const remainingAmount = Math.max(input.remainingAmount, 0);

  await updateDoc(debtRef, {
    paidInstallments,
    paidAmount: Math.max(input.paidAmount, 0),
    remainingAmount,
    remainingInstallments,
    isActive: remainingAmount > 0,
    updatedAt: serverTimestamp(),
  });
}
