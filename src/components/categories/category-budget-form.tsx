"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/hooks/use-auth";
import { createCategory } from "@/services/categoryService";
import { createBudget, updateBudget } from "@/services/budgetService";
import { useBudgets } from "@/hooks/use-budgets";
import { budgetSchema, getBudgetPeriod } from "@/lib/validations/budgets";
import type { BudgetInput } from "@/lib/validations/budgets";

// Use the schema-inferred type for react-hook-form to ensure resolver and
// form control types align correctly.
import { z } from "zod";
import { AnyFunc } from "node_modules/zod/v4/core/util.cjs";
type BudgetFormValues = z.infer<typeof budgetSchema>;

const MONTHS = [
  { value: 1, label: "Ene" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Abr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Ago" },
  { value: 9, label: "Set" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dic" },
];

export function CategoryBudgetForm() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const { budgets } = useBudgets();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [alertVisible, setAlertVisible] = React.useState(false);

  const relevantCategories = categories.filter(
    (category) => category.kind === "expense" || category.kind === "both"
  );

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const years = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);

  const form = useForm<BudgetFormValues>({
    // `zodResolver` types can sometimes be incompatible with the inferred
    // FieldValues type from react-hook-form in this project setup. Cast to
    // `any` so the form control generic remains `BudgetFormValues` while the
    // runtime resolver still validates correctly.
    resolver: zodResolver(budgetSchema) as AnyFunc,
    defaultValues: {
      categoryId: "",
      newCategoryName: "",
      amount: 0,
      frequency: "monthly",
      year: currentYear,
      month: currentMonth,
    },
  });

  const watchedCategoryId = form.watch("categoryId");
  const watchedFrequency = form.watch("frequency");
  const watchedYear = form.watch("year");
  const watchedMonth = form.watch("month");
  const watchedAmount = form.watch("amount");

  const selectedPeriod = getBudgetPeriod(
    watchedFrequency,
    watchedYear,
    watchedMonth ?? currentMonth
  );

  const existingBudget = budgets.find(
    (budget) =>
      budget.categoryId === watchedCategoryId && budget.period === selectedPeriod
  );

  React.useEffect(() => {
    if (existingBudget && form.getValues("amount") === 0) {
      form.setValue("amount", existingBudget.amount);
    }
  }, [existingBudget, form]);

  async function onSubmit(values: BudgetFormValues) {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const categoryId =
        values.categoryId ||
        (await createCategory(user.uid, {
          name: values.newCategoryName ?? "Sin categoría",
          kind: "expense",
        }));

      const period = getBudgetPeriod(
        values.frequency,
        values.year,
        values.month ?? currentMonth
      );

      if (existingBudget && existingBudget.categoryId === categoryId && existingBudget.period === period) {
        await updateBudget(existingBudget.id, {
          amount: values.amount,
          frequency: values.frequency,
          period,
        });
      } else {
        await createBudget(user.uid, {
          categoryId,
          amount: values.amount,
          frequency: values.frequency,
          period,
        });
      }

      toast.success("Presupuesto guardado");
      form.reset({
        categoryId: "",
        newCategoryName: "",
        amount: 0,
        frequency: "monthly",
        year: currentYear,
        month: currentMonth,
      });
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el presupuesto. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const watchAmount = form.watch("amount");

  React.useEffect(() => {
    setAlertVisible(watchAmount > 0 && watchAmount < 100);
  }, [watchAmount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presupuesto de categoría</CardTitle>
        <CardDescription>
          Agrega un nombre de categoría y define un presupuesto mensual o anual.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría existente</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {relevantCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newCategoryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de categoría</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Comida" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presupuesto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        value={field.value as number | string}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona frecuencia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <FormControl>
                      <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona año" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.watch("frequency") === "monthly" ? (
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mes</FormLabel>
                    <FormControl>
                      <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona mes" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month) => (
                            <SelectItem key={month.value} value={String(month.value)}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {alertVisible && (
              <Alert variant="warning">
                <AlertTitle>Presupuesto bajo</AlertTitle>
                <AlertDescription>
                  El monto ingresado es muy bajo; revisa si quieres un valor más cercano al gasto real.
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting || !user}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus />}
              {existingBudget ? "Actualizar presupuesto" : "Guardar presupuesto"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
