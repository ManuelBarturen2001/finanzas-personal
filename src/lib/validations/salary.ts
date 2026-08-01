import { z } from "zod";

export const salaryConfigSchema = z.object({
  amount: z.coerce
    .number({ message: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  frequency: z.enum(["monthly", "biweekly"]),
  paymentDay: z.coerce
    .number({ message: "Ingresa un día válido" })
    .int()
    .min(1, "El día debe estar entre 1 y 31")
    .max(31, "El día debe estar entre 1 y 31"),
  accountId: z.string().min(1, "Selecciona una cuenta destino"),
});

export type SalaryConfigInput = z.infer<typeof salaryConfigSchema>;
