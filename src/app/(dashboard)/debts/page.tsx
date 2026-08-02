"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, toJsDate } from "@/lib/format";
import { updateDebtDetails, updateDebtProgress } from "@/services/debtService";
import type { Debt } from "@/types";

export default function DebtsPage() {
  const { user } = useAuth();
  const [debts, setDebts] = React.useState<Debt[]>([]);
  const [name, setName] = React.useState("");
  const [initialAmount, setInitialAmount] = React.useState("");
  const [monthlyPayment, setMonthlyPayment] = React.useState("");
  const [totalInstallments, setTotalInstallments] = React.useState("");
  const [interestRate, setInterestRate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingDebt, setEditingDebt] = React.useState<Debt | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editMonthlyPayment, setEditMonthlyPayment] = React.useState("");
  const [editTotalInstallments, setEditTotalInstallments] = React.useState("");
  const [editInterestRate, setEditInterestRate] = React.useState("");
  const [isUpdatingDebt, setIsUpdatingDebt] = React.useState(false);
  const [editPaidInstallments, setEditPaidInstallments] = React.useState(0);
  const [editPaidAmount, setEditPaidAmount] = React.useState(0);
  const [editRemainingAmount, setEditRemainingAmount] = React.useState(0);

  React.useEffect(() => {
    if (!user) {
      return;
    }

    const q = query(
      collection(db, "debts"),
      where("userId", "==", user.uid),
      orderBy("dueDate", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextDebts = snapshot.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Debt
      );
      setDebts(nextDebts);
    });

    return unsubscribe;
  }, [user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    const amount = Number(initialAmount);
    const payment = Number(monthlyPayment);
    const installments = Number(totalInstallments);
    const rate = interestRate ? Number(interestRate) : undefined;

    if (!name.trim() || Number.isNaN(amount) || Number.isNaN(payment) || Number.isNaN(installments)) {
      toast.error("Completa el nombre, monto inicial, cuota mensual y total de cuotas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await addDoc(collection(db, "debts"), {
        userId: user.uid,
        name: name.trim(),
        initialAmount: amount,
        monthlyPayment: payment,
        totalInstallments: installments,
        paidInstallments: 0,
        remainingInstallments: installments,
        paidAmount: 0,
        remainingAmount: amount,
        startDate: serverTimestamp(),
        dueDate: dueDate,
        interestRate: rate,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setName("");
      setInitialAmount("");
      setMonthlyPayment("");
      setTotalInstallments("");
      setInterestRate("");
      toast.success("Deuda registrada");
    } catch {
      toast.error("No se pudo guardar la deuda");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(debtId: string) {
    try {
      await deleteDoc(doc(db, "debts", debtId));
      toast.success("Deuda eliminada");
    } catch {
      toast.error("No se pudo eliminar la deuda");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deudas</h1>
        <p className="text-muted-foreground text-sm">
          Controla tus préstamos y cuotas pendientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nueva deuda</CardTitle>
          <CardDescription>Registra un préstamo, tarjeta o deuda pendiente.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="debt-name">Nombre</Label>
              <Input
                id="debt-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Préstamo personal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="initial-amount">Monto inicial</Label>
              <Input
                id="initial-amount"
                type="number"
                min="0"
                step="0.01"
                value={initialAmount}
                onChange={(event) => setInitialAmount(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthly-payment">Cuota mensual</Label>
              <Input
                id="monthly-payment"
                type="number"
                min="0"
                step="0.01"
                value={monthlyPayment}
                onChange={(event) => setMonthlyPayment(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="installments">Total de cuotas</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                step="1"
                value={totalInstallments}
                onChange={(event) => setTotalInstallments(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="interest-rate">Interés (%)</Label>
              <Input
                id="interest-rate"
                type="number"
                min="0"
                step="0.01"
                value={interestRate}
                onChange={(event) => setInterestRate(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                <Plus />
                {isSubmitting ? "Guardando..." : "Agregar deuda"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tus deudas</CardTitle>
          <CardDescription>Resumen de obligaciones activas.</CardDescription>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Aún no tienes deudas registradas.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {debts.map((debt) => (
                <div key={debt.id} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{debt.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Saldo pendiente: {formatCurrency(debt.remainingAmount)} · Cuota: {formatCurrency(debt.monthlyPayment)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {debt.paidInstallments}/{debt.totalInstallments} cuotas pagadas · vence {formatDate(toJsDate(debt.dueDate))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingDebt(debt);
                        setEditName(debt.name);
                        setEditMonthlyPayment(String(debt.monthlyPayment));
                        setEditTotalInstallments(String(debt.totalInstallments));
                        setEditInterestRate(debt.interestRate ? String(debt.interestRate) : "");
                        setEditPaidInstallments(debt.paidInstallments);
                        setEditPaidAmount(debt.paidAmount);
                        setEditRemainingAmount(debt.remainingAmount);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(debt.id)}
                      aria-label={`Eliminar ${debt.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!editingDebt} onOpenChange={(open) => !open && setEditingDebt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar deuda</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!editingDebt || !user) return;

              const monthly = Number(editMonthlyPayment);
              const total = Number(editTotalInstallments);
              const rate = editInterestRate ? Number(editInterestRate) : undefined;
              const paidInstallments = Number(editPaidInstallments);
              const paidAmount = Number(editPaidAmount);
              const remainingAmount = Number(editRemainingAmount);

              if (!editName.trim() || Number.isNaN(monthly) || Number.isNaN(total)) {
                toast.error("Completa el nombre, cuota y total de cuotas.");
                return;
              }

              if (
                Number.isNaN(paidInstallments) ||
                Number.isNaN(paidAmount) ||
                Number.isNaN(remainingAmount)
              ) {
                toast.error("Ingresa valores numéricos válidos para el progreso de la deuda.");
                return;
              }

              setIsUpdatingDebt(true);
              try {
                await updateDebtDetails(editingDebt.id, {
                  name: editName.trim(),
                  monthlyPayment: monthly,
                  totalInstallments: total,
                  interestRate: rate,
                });
                await updateDebtProgress(editingDebt.id, {
                  paidInstallments,
                  paidAmount,
                  remainingAmount,
                });
                toast.success("Deuda actualizada");
                setEditingDebt(null);
              } catch {
                toast.error("No se pudo actualizar la deuda");
              } finally {
                setIsUpdatingDebt(false);
              }
            }}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="edit-debt-name">Nombre</Label>
              <Input
                id="edit-debt-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-debt-monthly">Cuota mensual</Label>
              <Input
                id="edit-debt-monthly"
                type="number"
                min="0"
                step="0.01"
                value={editMonthlyPayment}
                onChange={(event) => setEditMonthlyPayment(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-debt-installments">Total de cuotas</Label>
              <Input
                id="edit-debt-installments"
                type="number"
                min="1"
                step="1"
                value={editTotalInstallments}
                onChange={(event) => setEditTotalInstallments(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-debt-interest">Interés (%)</Label>
              <Input
                id="edit-debt-interest"
                type="number"
                min="0"
                step="0.01"
                value={editInterestRate}
                onChange={(event) => setEditInterestRate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-debt-paid">Cuotas pagadas</Label>
              <Input
                id="edit-debt-paid"
                type="number"
                min="0"
                step="1"
                value={editPaidInstallments}
                onChange={(event) => setEditPaidInstallments(Number(event.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-debt-paid-amount">Monto ya pagado</Label>
              <Input
                id="edit-debt-paid-amount"
                type="number"
                min="0"
                step="0.01"
                value={editPaidAmount}
                onChange={(event) => setEditPaidAmount(Number(event.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-debt-remaining-amount">Saldo pendiente</Label>
              <Input
                id="edit-debt-remaining-amount"
                type="number"
                min="0"
                step="0.01"
                value={editRemainingAmount}
                onChange={(event) => setEditRemainingAmount(Number(event.target.value))}
              />
              <p className="text-muted-foreground text-xs">
                Si ya pagaste cuotas antiguas, ajusta aquí cuántas y cuánto has pagado.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isUpdatingDebt}>
                {isUpdatingDebt ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
