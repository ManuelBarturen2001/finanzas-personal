"use client";

import * as React from "react";
import { Banknote, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SalaryConfigDialog } from "@/components/transactions/salary-config-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions } from "@/hooks/use-transactions";

export default function TransactionsPage() {
  const { transactions, isLoading } = useTransactions();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isSalaryOpen, setIsSalaryOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
          <p className="text-muted-foreground text-sm">
            Ingresos, gastos y transferencias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSalaryOpen(true)}>
            <Banknote />
            Sueldo
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus />
            Nuevo movimiento
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <TransactionList transactions={transactions} />
      )}

      <TransactionFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
      <SalaryConfigDialog open={isSalaryOpen} onOpenChange={setIsSalaryOpen} />
    </div>
  );
}
