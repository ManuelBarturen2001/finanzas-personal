import type { AccountType } from "@/types";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Cuenta bancaria",
  digital_wallet: "Billetera digital",
  cash: "Efectivo",
  savings: "Ahorros",
};

export function formatCurrency(amount: number, currency: "PEN" | "USD" = "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Convierte un Firestore Timestamp (o algo con .toDate()) a Date de forma segura. */
export function toJsDate(value: { toDate: () => Date } | Date): Date {
  return value instanceof Date ? value : value.toDate();
}
