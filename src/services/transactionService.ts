import {
  Timestamp,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import type { EditTransactionInput, IncomeExpenseInput, TransferInput } from "@/lib/validations/transactions";

const TRANSACTIONS_COLLECTION = "transactions";
const ACCOUNTS_COLLECTION = "accounts";

function toTimestamp(dateStr: string): Timestamp {
  // Los inputs <input type="date"> entregan "YYYY-MM-DD"; se interpreta
  // en horario local para evitar el corrimiento de un día que causa
  // `new Date("YYYY-MM-DD")` (que asume UTC) en zonas horarias negativas
  // como America/Lima.
  const [year, month, day] = dateStr.split("-").map(Number);
  return Timestamp.fromDate(new Date(year, month - 1, day));
}

/**
 * Registra un ingreso o gasto y actualiza el saldo denormalizado de la
 * cuenta afectada, todo dentro de una Firestore transaction para que
 * ambas escrituras sean atómicas (o se aplican las dos, o ninguna).
 */
export async function createIncomeOrExpense(
  userId: string,
  type: "income" | "expense",
  input: IncomeExpenseInput
): Promise<void> {
  const accountRef = doc(db, ACCOUNTS_COLLECTION, input.accountId);
  const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));

  await runTransaction(db, async (tx) => {
    const accountSnap = await tx.get(accountRef);
    if (!accountSnap.exists()) {
      throw new Error("La cuenta seleccionada ya no existe.");
    }

    const currentBalance = accountSnap.data().currentBalance as number;
    const delta = type === "income" ? input.amount : -input.amount;

    tx.set(transactionRef, {
      userId,
      type,
      amount: input.amount,
      description: input.description,
      date: toTimestamp(input.date),
      accountId: input.accountId,
      categoryId: input.categoryId,
      ...(input.debtId ? { debtId: input.debtId } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (type === "expense" && input.debtId) {
      const debtRef = doc(db, "debts", input.debtId);
      const debtSnap = await tx.get(debtRef);
      if (debtSnap.exists()) {
        const debtData = debtSnap.data();
        const paidInstallments = (debtData.paidInstallments as number) + 1;
        const remainingInstallments = Math.max(
          (debtData.totalInstallments as number) - paidInstallments,
          0
        );
        const paidAmount = (debtData.paidAmount as number) + input.amount;
        const remainingAmount = Math.max(
          (debtData.remainingAmount as number) - input.amount,
          0
        );

        tx.update(debtRef, {
          paidInstallments,
          remainingInstallments,
          paidAmount,
          remainingAmount,
          updatedAt: serverTimestamp(),
          ...(remainingAmount === 0 ? { isActive: false } : {}),
        });
      }
    }

    tx.update(accountRef, {
      currentBalance: currentBalance + delta,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Registra una transferencia entre dos cuentas propias: resta de la
 * cuenta origen y suma a la cuenta destino de forma atómica. No se
 * registra como ingreso ni gasto (el patrimonio total no cambia).
 */
export async function createTransfer(
  userId: string,
  input: TransferInput
): Promise<void> {
  const fromRef = doc(db, ACCOUNTS_COLLECTION, input.fromAccountId);
  const toRef = doc(db, ACCOUNTS_COLLECTION, input.toAccountId);
  const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));

  await runTransaction(db, async (tx) => {
    const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);

    if (!fromSnap.exists() || !toSnap.exists()) {
      throw new Error("Una de las cuentas seleccionadas ya no existe.");
    }

    const fromBalance = fromSnap.data().currentBalance as number;
    const toBalance = toSnap.data().currentBalance as number;

    tx.set(transactionRef, {
      userId,
      type: "transfer",
      amount: input.amount,
      description: input.description,
      date: toTimestamp(input.date),
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(fromRef, {
      currentBalance: fromBalance - input.amount,
      updatedAt: serverTimestamp(),
    });
    tx.update(toRef, {
      currentBalance: toBalance + input.amount,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Elimina un movimiento y revierte su efecto sobre el/los saldo(s) de
 * cuenta afectados, de forma atómica. Recibe el objeto completo del
 * movimiento (ya lo tenemos en memoria desde el listener de la lista)
 * para no tener que releerlo dentro de la transacción.
 */
export async function deleteTransaction(input: {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
}): Promise<void> {
  const transactionRef = doc(db, TRANSACTIONS_COLLECTION, input.id);

  await runTransaction(db, async (tx) => {
    if (input.type === "transfer") {
      const fromRef = doc(db, ACCOUNTS_COLLECTION, input.fromAccountId!);
      const toRef = doc(db, ACCOUNTS_COLLECTION, input.toAccountId!);
      const [fromSnap, toSnap] = await Promise.all([
        tx.get(fromRef),
        tx.get(toRef),
      ]);

      if (fromSnap.exists()) {
        tx.update(fromRef, {
          currentBalance: (fromSnap.data().currentBalance as number) + input.amount,
          updatedAt: serverTimestamp(),
        });
      }
      if (toSnap.exists()) {
        tx.update(toRef, {
          currentBalance: (toSnap.data().currentBalance as number) - input.amount,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      const accountRef = doc(db, ACCOUNTS_COLLECTION, input.accountId!);
      const accountSnap = await tx.get(accountRef);

      if (accountSnap.exists()) {
        const delta = input.type === "income" ? -input.amount : input.amount;
        tx.update(accountRef, {
          currentBalance: (accountSnap.data().currentBalance as number) + delta,
          updatedAt: serverTimestamp(),
        });
      }
    }

    tx.delete(transactionRef);
  });
}

/**
 * Edita solo los campos que no afectan saldos (descripción, fecha,
 * categoría). Ver nota en lib/validations/transactions.ts sobre por qué
 * el monto y las cuentas no son editables.
 */
export async function updateTransactionDetails(
  transactionId: string,
  input: EditTransactionInput
): Promise<void> {
  // No toca saldos, así que un updateDoc simple basta (no hace falta
  // envolverlo en runTransaction).
  await updateDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId), {
    description: input.description,
    date: toTimestamp(input.date),
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    updatedAt: serverTimestamp(),
  });
}
