"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  editTransactionSchema,
  type EditTransactionInput,
} from "@/lib/validations/transactions";
import { toJsDate } from "@/lib/format";
import { updateTransactionDetails } from "@/services/transactionService";
import type { Transaction } from "@/types";

function toInputDate(date: Transaction["date"]) {
  const d = toJsDate(date);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { categories } = useCategories();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isTransfer = transaction?.type === "transfer";
  const relevantCategories = categories.filter(
    (c) =>
      !transaction ||
      transaction.type === "transfer" ||
      c.kind === transaction.type ||
      c.kind === "both"
  );

  const form = useForm<EditTransactionInput>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: { description: "", date: "", categoryId: "" },
  });

  React.useEffect(() => {
    if (open && transaction) {
      form.reset({
        description: transaction.description,
        date: toInputDate(transaction.date),
        categoryId: transaction.type !== "transfer" ? transaction.categoryId : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction]);

  async function onSubmit(values: EditTransactionInput) {
    if (!transaction) return;
    setIsSubmitting(true);
    try {
      await updateTransactionDetails(transaction.id, values);
      toast.success("Movimiento actualizado");
      onOpenChange(false);
    } catch {
      toast.error("No se pudo actualizar el movimiento. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar movimiento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
            {!isTransfer && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
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
            )}
            <p className="text-muted-foreground text-xs">
              El monto y las cuentas no se pueden editar: elimina el
              movimiento y crea uno nuevo si necesitas corregirlos.
            </p>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
