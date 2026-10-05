"use client";

import * as React from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
  TrendingDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useBudgets } from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatDate, toJsDate } from "@/lib/format";

const ALL_CATEGORIES = "all";

const MONTHS = [
  { value: 1, label: "Ene" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Abr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Ago" },
  { value: 9, label: "Set" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dic" },
];

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("es-PE", { month: "short", year: "2-digit" }).format(
    new Date(year, month - 1, 1)
  );
}

function getYearDays(year: number) {
  return new Date(year, 12, 0).getDate();
}

export default function StatisticsPage() {
  const { transactions, isLoading: isLoadingTransactions } = useTransactions();
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { budgets, isLoading: isLoadingBudgets } = useBudgets();
  const [viewMode, setViewMode] = React.useState<"month" | "year">("month");
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const [selectedYear, setSelectedYear] = React.useState(lastMonth.getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(lastMonth.getMonth() + 1);
  const [categoryId, setCategoryId] = React.useState(ALL_CATEGORIES);
  const [isYearExpanded, setIsYearExpanded] = React.useState(false);
  const [isTransactionsExpanded, setIsTransactionsExpanded] = React.useState(false);

  const expenseCategories = categories.filter(
    (category) => category.kind === "expense" || category.kind === "both"
  );

  const availableYears = Array.from(
    new Set(transactions.map((transaction) => toJsDate(transaction.date).getFullYear()))
  ).sort((a, b) => b - a);

  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear());
  }

  const filterByPeriod = (transactionDate: Date) => {
    if (viewMode === "month") {
      return (
        transactionDate.getFullYear() === selectedYear &&
        transactionDate.getMonth() + 1 === selectedMonth
      );
    }
    return transactionDate.getFullYear() === selectedYear;
  };

  const filteredExpenses = transactions.filter((transaction) => {
    if (transaction.type !== "expense") {
      return false;
    }

    const transactionDate = toJsDate(transaction.date);
    const matchesPeriod = filterByPeriod(transactionDate);
    const matchesCategory =
      categoryId === ALL_CATEGORIES || transaction.categoryId === categoryId;

    return matchesPeriod && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const selectedPeriod =
    viewMode === "month"
      ? getMonthKey(new Date(selectedYear, selectedMonth - 1, 1))
      : String(selectedYear);

  const selectedBudget =
    categoryId === ALL_CATEGORIES
      ? undefined
      : budgets.find(
          (budget) =>
            budget.categoryId === categoryId && budget.period === selectedPeriod
        );

  const categoryBudget = selectedBudget?.amount;
  const remainingBudget =
    categoryBudget != null ? Math.max(categoryBudget - totalExpenses, 0) : undefined;
  const spentRatio = categoryBudget != null ? totalExpenses / categoryBudget : undefined;

  const dayRange =
    viewMode === "month"
      ? new Date(selectedYear, selectedMonth, 0).getDate()
      : getYearDays(selectedYear);

  const averageDailyExpense = dayRange > 0 ? totalExpenses / dayRange : 0;

  const filteredTransactions = filteredExpenses;

  const monthRange =
    viewMode === "month"
      ? [getMonthKey(new Date(selectedYear, selectedMonth - 1, 1))]
      : MONTHS.map((month) => `${selectedYear}-${String(month.value).padStart(2, "0")}`);

  const monthlyTotals = monthRange.map((monthKey) => {
    const monthData = filteredExpenses.reduce(
      (acc, transaction) => {
        const key = getMonthKey(toJsDate(transaction.date));
        if (key !== monthKey) return acc;
        acc.expense += transaction.amount;
        return acc;
      },
      { expense: 0 }
    );

    return {
      monthKey,
      label: getMonthLabel(monthKey),
      ...monthData,
    };
  });

  const expensesByCategory = expenseCategories
    .map((category) => ({
      ...category,
      total: filteredExpenses
        .filter((transaction) => transaction.categoryId === category.id)
        .reduce((total, transaction) => total + transaction.amount, 0),
    }))
    .filter((category) => category.total > 0)
    .sort((first, second) => second.total - first.total);

  const hasFilters =
    categoryId !== ALL_CATEGORIES ||
    viewMode !== "month" ||
    selectedYear !== lastMonth.getFullYear() ||
    selectedMonth !== lastMonth.getMonth() + 1;
  const isLoading = isLoadingTransactions || isLoadingCategories || isLoadingBudgets;

  function clearFilters() {
    setViewMode("month");
    setSelectedYear(lastMonth.getFullYear());
    setSelectedMonth(lastMonth.getMonth() + 1);
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
            Selecciona mes o año y categoría para ver solo el detalle relevante.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
          <div className="grid gap-2">
            <Label htmlFor="view-mode">Periodo</Label>
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as "month" | "year") }>
              <SelectTrigger id="view-mode" className="w-full">
                <SelectValue placeholder="Mes o año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mes</SelectItem>
                <SelectItem value="year">Año</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="year-filter">Año</Label>
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger id="year-filter" className="w-full">
                <SelectValue placeholder="Selecciona año" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {viewMode === "month" ? (
            <div className="grid gap-2">
              <Label htmlFor="month-filter">Mes</Label>
              <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                <SelectTrigger id="month-filter" className="w-full">
                  <SelectValue placeholder="Selecciona mes" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label className="invisible">Mes</Label>
              <div />
            </div>
          )}
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
          {categoryBudget != null && spentRatio != null && spentRatio >= 0.8 ? (
            <Alert variant="warning">
              <AlertTitle>Presupuesto cerca</AlertTitle>
              <AlertDescription>
                Has usado {Math.round(spentRatio * 100)}% del presupuesto {selectedBudget?.frequency === "monthly" ? "mensual" : "anual"}.
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription className="flex items-center justify-between">
                  Presupuesto
                  <BarChart3 className="text-muted-foreground size-4" />
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {categoryBudget != null ? formatCurrency(categoryBudget) : "N/D"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {categoryId !== ALL_CATEGORIES
                  ? "Presupuesto para la categoría seleccionada"
                  : "Presupuesto no definido"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription className="flex items-center justify-between">
                  Gasto total
                  <TrendingDown className="text-destructive size-4" />
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {formatCurrency(totalExpenses)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {filteredExpenses.length} gastos
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription className="flex items-center justify-between">
                  Queda
                  <RotateCcw className="text-muted-foreground size-4" />
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {remainingBudget != null ? formatCurrency(remainingBudget) : "N/D"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {categoryBudget != null
                  ? spentRatio != null && spentRatio >= 1
                    ? "Presupuesto alcanzado"
                    : "Disponible según presupuesto"
                  : "Sin presupuesto definido"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription className="flex items-center justify-between">
                  Promedio gasto
                  <RotateCcw className="text-muted-foreground size-4" />
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {formatCurrency(averageDailyExpense)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                basado en {dayRange} días
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
            <CardHeader className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Tendencia mensual</CardTitle>
                <CardDescription>
                  Gasto total por mes en el periodo seleccionado.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setIsYearExpanded((value) => !value)}
              >
                {isYearExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" /> Reducir
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" /> Expandir
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className={isYearExpanded ? "grid gap-3" : "grid gap-3 max-h-80 overflow-hidden"}>
                {monthlyTotals.map((month) => (
                  <div key={month.monthKey} className="grid gap-1 rounded-lg bg-muted p-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{month.label}</span>
                      <span className="font-medium tabular-nums text-destructive">
                        {formatCurrency(month.expense)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total de gasto
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Movimientos incluidos</CardTitle>
                <CardDescription>
                  {hasFilters
                    ? "Movimientos que cumplen los filtros seleccionados."
                    : "Todos tus movimientos registrados."}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setIsTransactionsExpanded((value) => !value)}
              >
                {isTransactionsExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" /> Reducir
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" /> Expandir
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className={
                isTransactionsExpanded
                  ? "flex flex-col divide-y"
                  : "flex flex-col divide-y max-h-80 overflow-hidden"
              }>
                {filteredTransactions.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No hay gastos que coincidan con los filtros.
                  </p>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{transaction.description}</p>
                        <p className="text-muted-foreground">
                          {categories.find((category) => category.id === transaction.categoryId)?.name ?? "Sin categoría"}
                          {" · "}
                          {formatDate(toJsDate(transaction.date))}
                        </p>
                      </div>
                      <span className="shrink-0 text-destructive font-medium tabular-nums">
                        -{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}