import { z } from "zod";

export const accountTypeSchema = z.enum([
  "bank",
  "digital_wallet",
  "cash",
  "savings",
]);

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(40, "El nombre es demasiado largo"),
  type: accountTypeSchema,
  initialBalance: z.coerce
    .number({ message: "Ingresa un monto válido" })
    .min(0, "El saldo inicial no puede ser negativo"),
  currency: z.enum(["PEN", "USD"]),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

// El saldo inicial no es editable una vez creada la cuenta: el saldo
// actual (currentBalance) ya se deriva de initialBalance + movimientos,
// así que permitir editarlo después rompería esa consistencia.
export const updateAccountSchema = createAccountSchema.omit({
  initialBalance: true,
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
