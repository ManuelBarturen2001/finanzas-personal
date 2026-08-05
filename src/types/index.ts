import type { Timestamp } from "firebase/firestore";

/**
 * Tipos centralizados del dominio de la aplicación.
 *
 * Convenciones:
 * - Los montos se guardan en soles (número, no string) con hasta 2 decimales.
 *   Se evita trabajar en centavos (enteros) para mantener la Fase 1 simple;
 *   se puede migrar más adelante si la precisión decimal da problemas.
 * - Las fechas se guardan como Firestore Timestamp en la base de datos,
 *   pero varios formularios/consultas trabajan con `Date` en memoria.
 * - Todo documento de estas colecciones tiene `userId`: el aislamiento
 *   entre usuarios se refuerza además con Firestore Security Rules.
 */

// ─── Usuario ────────────────────────────────────────────────────────────

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Timestamp;
}

// ─── Cuentas ────────────────────────────────────────────────────────────

export type AccountType =
  | "bank" // cuenta bancaria (BCP, Interbank, etc.)
  | "digital_wallet" // Yape, Plin
  | "cash" // efectivo
  | "savings"; // ahorros

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  /** Denormalizado: se actualiza en cada transacción para evitar recalcular sumando movimientos. */
  currentBalance: number;
  currency: "PEN" | "USD";
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Categorías ─────────────────────────────────────────────────────────

export type CategoryKind = "income" | "expense" | "both";

export interface Category {
  id: string;
  userId: string;
  name: string;
  kind: CategoryKind;
  icon?: string;
  color?: string;
  /** Categorías por defecto creadas al registrar al usuario; no se pueden borrar, solo desactivar. */
  isDefault: boolean;
  /** Soft delete: no se borra físicamente si tiene movimientos asociados. */
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Movimientos (Transaction) ──────────────────────────────────────────

export type TransactionType = "income" | "expense" | "transfer";

interface TransactionBase {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Presente si el movimiento proviene de marcar un gasto recurrente como pagado. */
  recurringExpenseId?: string;
  /** Presente si el movimiento corresponde al pago de una cuota de deuda. */
  debtId?: string;
}

export interface IncomeTransaction extends TransactionBase {
  type: "income";
  accountId: string;
  categoryId: string;
}

export interface ExpenseTransaction extends TransactionBase {
  type: "expense";
  accountId: string;
  categoryId: string;
}

export interface TransferTransaction extends TransactionBase {
  type: "transfer";
  fromAccountId: string;
  toAccountId: string;
  receivedAmount?: number;
  exchangeRate?: number;
  /** Las transferencias no llevan categoría: no son ingreso ni gasto. */
  categoryId?: never;
}

export type Transaction =
  | IncomeTransaction
  | ExpenseTransaction
  | TransferTransaction;

// ─── Configuración de sueldo ────────────────────────────────────────────

export type SalaryFrequency = "monthly" | "biweekly";

export interface SalaryConfig {
  id: string;
  userId: string;
  amount: number;
  frequency: SalaryFrequency;
  /** Día del mes en que se cobra (1-31). */
  paymentDay: number;
  accountId: string;
  isActive: boolean;
  /**
   * Historial de montos: cambiar el sueldo NO debe alterar transacciones
   * pasadas, por eso el monto vigente vive aquí y cada pago de sueldo
   * genera su propia `IncomeTransaction` con el monto histórico real.
   */
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Gastos recurrentes ─────────────────────────────────────────────────

export type RecurringFrequency = "monthly" | "weekly" | "yearly";

export interface RecurringExpense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  categoryId: string;
  /** Día del mes/semana en que vence, según `frequency`. */
  dueDay: number;
  frequency: RecurringFrequency;
  accountId: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Deudas y préstamos ─────────────────────────────────────────────────

export interface Debt {
  id: string;
  userId: string;
  name: string;
  initialAmount: number;
  monthlyPayment: number;
  totalInstallments: number;
  /** Denormalizado: se actualiza al registrar cada pago de cuota. */
  paidInstallments: number;
  remainingInstallments: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: Timestamp;
  dueDate: Timestamp;
  interestRate?: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Presupuestos (arquitectura preparada, UI en fase posterior) ────────

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  /** Formato "YYYY-MM" para poder hacer queries directas por mes. */
  month: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
