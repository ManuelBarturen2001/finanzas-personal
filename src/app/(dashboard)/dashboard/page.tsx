"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  Landmark,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, toJsDate } from "@/lib/format";

function isSameMonth(date: Date, reference: Date) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

export default function DashboardPage() {
  const { accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { transactions, isLoading: isLoadingTx } = useTransactions();

  const now = new Date();

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const monthTransactions = transactions.filter((tx) =>
    isSameMonth(toJsDate(tx.date), now)
  );

  const monthIncome = monthTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthExpense = monthTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthBalance = monthIncome - monthExpense;

  const isLoading = isLoadingAccounts || isLoadingTx;

  const summaryCards = [
    {
      title: "Ingresos del mes",
      icon: TrendingUp,
      value: monthIncome,
    },
    {
      title: "Gastos del mes",
      icon: TrendingDown,
      value: monthExpense,
    },
    {
      title: "Balance del mes",
      icon: Landmark,
      value: monthBalance,
    },
    {
      title: "Dinero disponible",
      icon: CircleDollarSign,
      value: totalBalance,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Resumen general de tus finanzas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)
          : summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title}>
                  <CardHeader>
                    <CardDescription className="flex items-center justify-between">
                      {card.title}
                      <Icon className="text-muted-foreground size-4" />
                    </CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {formatCurrency(card.value)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Cuentas</CardTitle>
            <CardDescription>Saldo actual por cuenta</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading ? (
              <Skeleton className="h-24" />
            ) : accounts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aún no tienes cuentas registradas.
              </p>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between text-sm">
                  <span>{account.name}</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(account.currentBalance, account.currency)}
                  </span>
                </div>
              ))
            )}
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/accounts">
                Ver cuentas
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Últimos movimientos</CardTitle>
            <CardDescription>Tus 5 movimientos más recientes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <TransactionList transactions={transactions.slice(0, 5)} />
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/transactions">
                Ver todos los movimientos
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
