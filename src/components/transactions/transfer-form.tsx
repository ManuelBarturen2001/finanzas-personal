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
import { transferSchema, type TransferInput } from "@/lib/validations/transactions";
import { createTransfer } from "@/services/transactionService";

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function TransferForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<
    z.input<typeof transferSchema>,
    unknown,
    TransferInput
  >({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      receivedAmount: undefined,
      description: "Transferencia entre cuentas",
      date: todayInputValue(),
      fromAccountId: "",
      toAccountId: "",
    },
  });

  const fromAccount = accounts.find(
    (account) => account.id === form.watch("fromAccountId")
  );
  const toAccount = accounts.find(
    (account) => account.id === form.watch("toAccountId")
  );

  async function onSubmit(values: TransferInput) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await createTransfer(user.uid, values);
      toast.success("Transferencia registrada");
      form.reset({
        amount: 0,
        description: "Transferencia entre cuentas",
        date: todayInputValue(),
        fromAccountId: values.fromAccountId,
        toAccountId: "",
      });
      onSuccess();
    } catch {
      toast.error("No se pudo registrar la transferencia. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desde</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Origen" />
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
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hacia</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Destino" />
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Monto origen{fromAccount ? ` (${fromAccount.currency})` : ""}
                </FormLabel>
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
          name="receivedAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Monto destino{toAccount ? ` (${toAccount.currency})` : ""}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
              <p className="text-muted-foreground text-xs">
                Si transfieres entre monedas distintas, escribe cuánto llegará a la
                cuenta destino. Si se trata de la misma moneda, puedes dejarlo en
                blanco y el mismo monto se aplicará.
              </p>
            </FormItem>
          )}
        />
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
        {accounts.length < 2 && (
          <p className="text-muted-foreground text-xs">
            Necesitas al menos 2 cuentas activas para transferir entre ellas.
          </p>
        )}
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting || accounts.length < 2}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
