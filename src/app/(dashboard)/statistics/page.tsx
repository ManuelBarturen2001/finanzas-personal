"use client";

import * as React from "react";
import { BarChart3, Filter, RotateCcw, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatDate, toJsDate } from "@/lib/format";

const ALL_CATEGORIES = "all";

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function StatisticsPage() {
  const { transactions, isLoading: isLoadingTransactions } = useTransactions();
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(ALL_CATEGORIES);

  const expenseCategories = categories.filter(
    (category) => category.kind === "expense" || category.kind === "both"
  );

  const filteredExpenses = transactions.filter((transaction) => {
    if (transaction.type !== "expense") return false;

    const transactionDate = toJsDate(transaction.date);
    const transactionDay = dateInputValue(transactionDate);
    const matchesFromDate = !fromDate || transactionDay >= fromDate;
    const matchesToDate = !toDate || transactionDay <= toDate;
    const matchesCategory =
      categoryId === ALL_CATEGORIES || transaction.categoryId === categoryId;

    return matchesFromDate && matchesToDate && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const expensesByCategory = expenseCategories
    .map((category) => ({
      ...category,
      total: filteredExpenses
        .filter((transaction) => transaction.categoryId === category.id)
        .reduce((total, transaction) => total + transaction.amount, 0),
    }))
    .filter((category) => category.total > 0)
    .sort((first, second) => second.total - first.total);

  const hasFilters = Boolean(fromDate || toDate || categoryId !== ALL_CATEGORIES);
  const isLoading = isLoadingTransactions || isLoadingCategories;

  function clearFilters() {
    setFromDate("");
    setToDate("");
    setCategoryId(ALL_CATEGORIES);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="text-muted-foreground text-sm">
          Revisa cuánto has gastado por periodo y categoría
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" />
            Filtrar gastos
          </CardTitle>
          <CardDescription>
            Combina las fechas con una categoría para encontrar un gasto concreto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
          <div className="grid gap-2">
            <Label htmlFor="from-date">Desde</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="to-date">Hasta</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category-filter">Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category-filter" className="w-full">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>Todas las categorías</SelectItem>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            <RotateCcw />
            Limpiar
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Cargando estadísticas...
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription className="flex items-center justify-between">
                  Gasto total filtrado
                  <TrendingDown className="text-destructive size-4" />
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {formatCurrency(totalExpenses)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {filteredExpenses.length} {filteredExpenses.length === 1 ? "movimiento" : "movimientos"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription className="flex items-center justify-between">
                  Categorías con gastos
                  <BarChart3 className="text-muted-foreground size-4" />
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {expensesByCategory.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Dentro del periodo seleccionado
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desglose por categoría</CardTitle>
              <CardDescription>
                Las categorías están ordenadas de mayor a menor gasto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No hay gastos que coincidan con estos filtros.
                </p>
              ) : (
                <div className="flex flex-col divide-y">
                  {expensesByCategory.map((category) => (
                    <div key={category.id} className="flex items-center justify-between gap-4 py-3">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-destructive font-medium tabular-nums">
                        {formatCurrency(category.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movimientos incluidos</CardTitle>
              <CardDescription>
                {hasFilters
                  ? "Gastos que cumplen los filtros seleccionados."
                  : "Todos tus gastos registrados."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No hay movimientos para mostrar.
                </p>
              ) : (
                <div className="flex flex-col divide-y">
                  {filteredExpenses.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{transaction.description}</p>
                        <p className="text-muted-foreground">
                          {categories.find((category) => category.id === transaction.categoryId)?.name ?? "Sin categoría"}
                          {" · "}
                          {formatDate(toJsDate(transaction.date))}
                        </p>
                      </div>
                      <span className="text-destructive shrink-0 font-medium tabular-nums">
                        -{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}