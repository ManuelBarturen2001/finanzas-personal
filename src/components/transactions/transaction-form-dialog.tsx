"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncomeExpenseForm } from "./income-expense-form";
import { TransferForm } from "./transfer-form";

export function TransactionFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = React.useState<"income" | "expense" | "transfer">(
    "expense"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="expense">Gasto</TabsTrigger>
            <TabsTrigger value="income">Ingreso</TabsTrigger>
            <TabsTrigger value="transfer">Transferencia</TabsTrigger>
          </TabsList>
          <TabsContent value="expense" className="pt-2">
            <IncomeExpenseForm
              type="expense"
              onSuccess={() => onOpenChange(false)}
            />
          </TabsContent>
          <TabsContent value="income" className="pt-2">
            <IncomeExpenseForm
              type="income"
              onSuccess={() => onOpenChange(false)}
            />
          </TabsContent>
          <TabsContent value="transfer" className="pt-2">
            <TransferForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
