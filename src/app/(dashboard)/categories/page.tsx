"use client";

import * as React from "react";
import { Edit3, Plus } from "lucide-react";

import { CategoryBudgetForm } from "@/components/categories/category-budget-form";
import { CategoryEditDialog } from "@/components/categories/category-edit-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategories } from "@/hooks/use-categories";
import { useBudgets } from "@/hooks/use-budgets";
import { formatCurrency } from "@/lib/format";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { budgets, isLoading: isLoadingBudgets } = useBudgets();
  const [isFormOpen, setIsFormOpen] = React.useState(true);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  const expenseCategories = categories.filter(
    (category) => category.kind === "expense" || category.kind === "both"
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground text-sm">
            Administra nombres de categoría por separado y define presupuestos mensuales o anuales.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen((value) => !value)}>
          <Plus />
          {isFormOpen ? "Ocultar presupuesto" : "Nuevo presupuesto"}
        </Button>
      </div>

      {isFormOpen ? <CategoryBudgetForm /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Resumen de categorías</CardTitle>
          <CardDescription>
            Presupuestos actuales por categoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCategories || isLoadingBudgets ? (
            <p className="text-muted-foreground">Cargando categorías y presupuestos...</p>
          ) : expenseCategories.length === 0 ? (
            <p className="text-muted-foreground">No hay categorías de gasto registradas.</p>
          ) : (
            <div className="grid gap-4">
              {expenseCategories.map((category) => {
                const categoryBudgets = budgets.filter((budget) => budget.categoryId === category.id);
                return (
                  <div key={category.id} className="rounded-xl border bg-background p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.kind === "both" ? "Ingresos y gastos" : "Gastos"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {categoryBudgets.length === 0 ? "Sin presupuesto" : `${categoryBudgets.length} presupuesto(s)`}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit3 />
                          Editar
                        </Button>
                      </div>
                    </div>
                    {categoryBudgets.length > 0 ? (
                      <div className="mt-4 grid gap-2">
                        {categoryBudgets.map((budget) => (
                          <div key={budget.id} className="rounded-lg bg-muted p-3">
                            <div className="flex items-center justify-between gap-4 text-sm">
                              <span>{budget.frequency === "monthly" ? "Mensual" : "Anual"} · {budget.period}</span>
                              <span className="font-medium tabular-nums">{formatCurrency(budget.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryEditDialog
        open={!!editingCategory}
        category={editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCategory(null);
          }
        }}
      />
    </div>
  );
}
