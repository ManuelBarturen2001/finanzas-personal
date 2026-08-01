"use client";

import * as React from "react";
import {
  ArrowLeftRight,
  MoreVertical,
  Pencil,
  TrendingDown,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency, formatDate, toJsDate } from "@/lib/format";
import { deleteTransaction } from "@/services/transactionService";
import type { Transaction } from "@/types";
import { EditTransactionDialog } from "./edit-transaction-dialog";

function TransactionIcon({ type }: { type: Transaction["type"] }) {
  if (type === "income") {
    return (
      <div className="bg-success/10 text-success flex size-9 shrink-0 items-center justify-center rounded-md">
        <TrendingUp className="size-4" />
      </div>
    );
  }
  if (type === "expense") {
    return (
      <div className="bg-destructive/10 text-destructive flex size-9 shrink-0 items-center justify-center rounded-md">
        <TrendingDown className="size-4" />
      </div>
    );
  }
  return (
    <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
      <ArrowLeftRight className="size-4" />
    </div>
  );
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const { accounts } = useAccounts(true);
  const { categories } = useCategories();
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [deleting, setDeleting] = React.useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const accountName = (id?: string) =>
    accounts.find((a) => a.id === id)?.name ?? "Cuenta eliminada";
  const categoryName = (id?: string) =>
    categories.find((c) => c.id === id)?.name ?? "Sin categoría";

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteTransaction({
        id: deleting.id,
        type: deleting.type,
        amount: deleting.amount,
        accountId: deleting.type !== "transfer" ? deleting.accountId : undefined,
        fromAccountId:
          deleting.type === "transfer" ? deleting.fromAccountId : undefined,
        toAccountId: deleting.type === "transfer" ? deleting.toAccountId : undefined,
      });
      toast.success("Movimiento eliminado");
      setDeleting(null);
    } catch {
      toast.error("No se pudo eliminar el movimiento. Intenta de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
        <p className="font-medium">Aún no hay movimientos</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Registra tu primer ingreso, gasto o transferencia con el botón
          &quot;Nuevo movimiento&quot;.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col divide-y rounded-lg border">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center gap-3 p-3">
            <TransactionIcon type={tx.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium leading-none">{tx.description}</p>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {tx.type === "transfer"
                  ? `${accountName(tx.fromAccountId)} → ${accountName(tx.toAccountId)}`
                  : `${categoryName(tx.categoryId)} · ${accountName(tx.accountId)}`}
                {" · "}
                {formatDate(toJsDate(tx.date))}
              </p>
            </div>
            <p
              className={
                "shrink-0 font-medium tabular-nums " +
                (tx.type === "income"
                  ? "text-success"
                  : tx.type === "expense"
                    ? "text-destructive"
                    : "text-foreground")
              }
            >
              {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
              {formatCurrency(tx.amount)}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Opciones">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(tx)}>
                  <Pencil />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleting(tx)}
                >
                  <Trash2 />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <EditTransactionDialog
        transaction={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se revertirá su efecto en el saldo de la cuenta
              {deleting?.type === "transfer" ? "s" : ""} afectada
              {deleting?.type === "transfer" ? "s" : ""}. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
