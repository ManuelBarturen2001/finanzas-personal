import { z } from "zod";

const baseFields = {
  amount: z.coerce
    .number({ message: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  description: z
    .string()
    .min(1, "La descripción es obligatoria")
    .max(80, "La descripción es demasiado larga"),
  date: z.string().min(1, "La fecha es obligatoria"),
};

export const incomeExpenseSchema = z.object({
  ...baseFields,
  accountId: z.string().min(1, "Selecciona una cuenta"),
  categoryId: z.string().min(1, "Selecciona una categoría"),
});

export type IncomeExpenseInput = z.infer<typeof incomeExpenseSchema>;

export const transferSchema = z
  .object({
    ...baseFields,
    fromAccountId: z.string().min(1, "Selecciona la cuenta de origen"),
    toAccountId: z.string().min(1, "Selecciona la cuenta de destino"),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "La cuenta de origen y destino no pueden ser la misma",
    path: ["toAccountId"],
  });

export type TransferInput = z.infer<typeof transferSchema>;

// Edición: por simplicidad y seguridad de los saldos, solo se permite
// editar descripción, fecha y categoría. Cambiar el monto o las cuentas
// implicaría recalcular saldos ya afectados; si el usuario se equivocó en
// eso, es más simple y menos propenso a errores eliminar el movimiento y
// crear uno nuevo.
export const editTransactionSchema = z.object({
  description: baseFields.description,
  date: baseFields.date,
  categoryId: z.string().min(1, "Selecciona una categoría").optional(),
});

export type EditTransactionInput = z.infer<typeof editTransactionSchema>;
