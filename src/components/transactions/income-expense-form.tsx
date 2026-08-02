"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
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
import { useAccounts } from "@/hooks/use-accounts";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useDebts } from "@/hooks/use-debts";
import { formatCurrency } from "@/lib/format";
import {
  incomeExpenseSchema,
  type IncomeExpenseInput,
} from "@/lib/validations/transactions";
import { createIncomeOrExpense } from "@/services/transactionService";
function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function IncomeExpenseForm({
  type,
  onSuccess,
}: {
  type: "income" | "expense";
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { debts } = useDebts();

  const relevantCategories = categories.filter(
    (c) => c.kind === type || c.kind === "both"
  );

  const availableDebts = debts.filter((debt) => debt.isActive);

  const form = useForm<
    z.input<typeof incomeExpenseSchema>,
    unknown,
    IncomeExpenseInput
  >({
    resolver: zodResolver(incomeExpenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
      date: todayInputValue(),
      accountId: "",
      categoryId: "",
      debtId: undefined,
    },
  });

  async function onSubmit(values: IncomeExpenseInput) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await createIncomeOrExpense(user.uid, type, values);
      toast.success(type === "income" ? "Ingreso registrado" : "Gasto registrado");
      form.reset({
        amount: 0,
        description: "",
        date: todayInputValue(),
        accountId: values.accountId,
        categoryId: "",
      });
      onSuccess();
    } catch {
      toast.error("No se pudo guardar el movimiento. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  placeholder={type === "income" ? "Sueldo julio" : "Almuerzo"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto (S/)</FormLabel>
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
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {accounts.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  Primero crea una cuenta en la sección Cuentas.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {relevantCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {type === "expense" && (
          <FormField
            control={form.control}
            name="debtId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deuda pagada (opcional)</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una deuda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Ninguna deuda</SelectItem>
                    {availableDebts.map((debt) => (
                      <SelectItem key={debt.id} value={debt.id}>
                        {debt.name} · {formatCurrency(debt.monthlyPayment)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableDebts.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    No hay deudas activas para asociar al pago.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting || accounts.length === 0}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {type === "income" ? "Registrar ingreso" : "Registrar gasto"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
