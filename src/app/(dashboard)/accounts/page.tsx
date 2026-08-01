"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { AccountCard } from "@/components/accounts/account-card";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/use-accounts";
import type { Account } from "@/types";

export default function AccountsPage() {
  const { accounts, isLoading } = useAccounts();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | undefined>();

  function openCreate() {
    setEditingAccount(undefined);
    setIsFormOpen(true);
  }

  function openEdit(account: Account) {
    setEditingAccount(account);
    setIsFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
          <p className="text-muted-foreground text-sm">
            Bancos, billeteras digitales, efectivo y ahorros
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Nueva cuenta
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <p className="font-medium">Todavía no tienes cuentas</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Crea tu primera cuenta (banco, Yape, efectivo...) para empezar a
            registrar tus movimientos.
          </p>
          <Button onClick={openCreate} className="mt-2">
            <Plus />
            Nueva cuenta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => openEdit(account)}
            />
          ))}
        </div>
      )}

      <AccountFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        account={editingAccount}
      />
    </div>
  );
}
