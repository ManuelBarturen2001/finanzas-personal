"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useAccounts } from "@/hooks/use-accounts";
import { useAuth } from "@/hooks/use-auth";
import {
  salaryConfigSchema,
  type SalaryConfigInput,
} from "@/lib/validations/salary";
import { getSalaryConfig, upsertSalaryConfig } from "@/services/salaryConfigService";

export function SalaryConfigDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = React.useState(true);

  const form = useForm<
    z.input<typeof salaryConfigSchema>,
    unknown,
    SalaryConfigInput
  >({
    resolver: zodResolver(salaryConfigSchema),
    defaultValues: {
      amount: 0,
      frequency: "monthly",
      paymentDay: 1,
      accountId: "",
    },
  });

  React.useEffect(() => {
    if (!open || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the async fetch below; not a background subscription
    setIsLoadingConfig(true);
    getSalaryConfig(user.uid)
      .then((config) => {
        if (config) {
          form.reset({
            amount: config.amount,
            frequency: config.frequency,
            paymentDay: config.paymentDay,
            accountId: config.accountId,
          });
        }
      })
      .finally(() => setIsLoadingConfig(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  async function onSubmit(values: SalaryConfigInput) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await upsertSalaryConfig(user.uid, values);
      toast.success("Configuración de sueldo guardada");
      onOpenChange(false);
    } catch {
      toast.error("No se pudo guardar la configuración. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuración de sueldo</DialogTitle>
          <DialogDescription>
            Define el monto y la cuenta a la que llega tu sueldo. Esto no
            registra pagos automáticamente: solo guarda tus datos de
            referencia para cuando quieras registrar el ingreso cada mes.
          </DialogDescription>
        </DialogHeader>
        {isLoadingConfig ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="biweekly">Quincenal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Día de pago</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          {...field}
                          value={field.value as number | string}
                        />
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
                    <FormLabel>Cuenta destino</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
