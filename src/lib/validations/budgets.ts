import { z } from "zod";

export const budgetSchema = z
  .object({
    categoryId: z.string().optional(),
    newCategoryName: z.string().max(40, "El nombre de la categoría es demasiado largo").optional(),
    amount: z.coerce
      .number()
      .refine((value) => !Number.isNaN(value), {
        message: "Ingresa un presupuesto válido",
      })
      .positive("El presupuesto debe ser mayor a 0"),
    frequency: z.enum(["monthly", "yearly"]),
    year: z.coerce.number().int().min(2000, "Selecciona un año válido"),
    month: z.coerce
      .number()
      .int()
      .min(1, "Selecciona un mes")
      .max(12)
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.categoryId && !values.newCategoryName) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Selecciona o crea una categoría",
      });
    }

    if (values.frequency === "monthly" && !values.month) {
      ctx.addIssue({
        code: "custom",
        path: ["month"],
        message: "Selecciona un mes para el presupuesto mensual",
      });
    }
  });

export type BudgetInput = z.infer<typeof budgetSchema>;

export function getBudgetPeriod(
  frequency: "monthly" | "yearly",
  year: number,
  month: number
) {
  return frequency === "monthly"
    ? `${year}-${String(month).padStart(2, "0")}`
    : String(year);
}
