import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import type { SalaryConfigInput } from "@/lib/validations/salary";
import type { SalaryConfig } from "@/types";

const SALARY_CONFIG_COLLECTION = "salaryConfig";

/**
 * Un solo documento de configuración de sueldo por usuario, con el propio
 * userId como ID del documento (simplifica las Security Rules: no hace
 * falta consultar por campo, solo comparar el ID del doc con el uid).
 */
function salaryDocRef(userId: string) {
  return doc(db, SALARY_CONFIG_COLLECTION, userId);
}

export async function getSalaryConfig(
  userId: string
): Promise<SalaryConfig | null> {
  const snap = await getDoc(salaryDocRef(userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SalaryConfig;
}

/**
 * Crea o actualiza la configuración de sueldo vigente. Importante: esto
 * NO modifica transacciones de ingreso ya registradas (el histórico de
 * pagos de sueldo pasados queda intacto); solo cambia el monto/día/cuenta
 * que se usará la próxima vez que se registre un pago de sueldo.
 */
export async function upsertSalaryConfig(
  userId: string,
  input: SalaryConfigInput
): Promise<void> {
  const ref = salaryDocRef(userId);
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      userId,
      amount: input.amount,
      frequency: input.frequency,
      paymentDay: input.paymentDay,
      accountId: input.accountId,
      isActive: true,
      updatedAt: serverTimestamp(),
      // Solo se fija en la primera creación; en updates posteriores no se
      // reenvía para no pisar la fecha de creación original.
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
}
