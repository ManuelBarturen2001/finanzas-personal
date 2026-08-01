"use client";

import * as React from "react";
import {
  CircleDollarSign,
  Landmark,
  MoreVertical,
  Pencil,
  PiggyBank,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCOUNT_TYPE_LABELS, formatCurrency } from "@/lib/format";
import { deactivateAccount } from "@/services/accountService";
import type { Account, AccountType } from "@/types";

const ACCOUNT_TYPE_ICONS: Record<AccountType, LucideIcon> = {
  bank: Landmark,
  digital_wallet: Smartphone,
  cash: CircleDollarSign,
  savings: PiggyBank,
};

export function AccountCard({
  account,
  onEdit,
}: {
  account: Account;
  onEdit: () => void;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const Icon = ACCOUNT_TYPE_ICONS[account.type];

  async function handleDeactivate() {
    setIsDeleting(true);
    try {
      await deactivateAccount(account.id);
      toast.success("Cuenta ocultada");
      setIsDeleteOpen(false);
    } catch {
      toast.error("No se pudo ocultar la cuenta. Intenta de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <div className="flex items-center gap-3">
            <div className="bg-muted flex size-9 items-center justify-center rounded-md">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="font-medium leading-none">{account.name}</p>
              <p className="text-muted-foreground text-xs">
                {ACCOUNT_TYPE_LABELS[account.type]}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Opciones de cuenta">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 />
                Ocultar cuenta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCurrency(account.currentBalance, account.currency)}
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Ocultar &quot;{account.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              La cuenta dejará de aparecer en el dashboard y en los
              formularios de nuevo movimiento, pero sus movimientos
              históricos se conservan intactos. Puedes reactivarla más
              adelante si lo necesitas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeactivate();
              }}
              disabled={isDeleting}
            >
              Ocultar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
