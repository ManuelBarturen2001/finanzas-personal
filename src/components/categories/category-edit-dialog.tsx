"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCategory } from "@/services/categoryService";
import { z } from "zod";
import type { CategoryKind, Category } from "@/types";

const categoryEditSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(40, "El nombre es demasiado largo"),
  kind: z.enum(["income", "expense", "both"]),
});

export type CategoryEditInput = z.infer<typeof categoryEditSchema>;

export function CategoryEditDialog({
  open,
  category,
  onOpenChange,
}: {
  open: boolean;
  category: Category | null;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<CategoryEditInput>({
    resolver: zodResolver(categoryEditSchema),
    defaultValues: {
      name: category?.name ?? "",
      kind: category?.kind ?? "expense",
    },
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        kind: category.kind,
      });
    }
  }, [category, form]);

  async function onSubmit(values: CategoryEditInput) {
    if (!category) return;
    setIsSubmitting(true);

    try {
      await updateCategory(category.id, {
        name: values.name,
        kind: values.kind,
      });
      toast.success("Categoría actualizada");
      onOpenChange(false);
    } catch {
      toast.error("No se pudo actualizar la categoría. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar categoría</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Ingreso</SelectItem>
                        <SelectItem value="expense">Gasto</SelectItem>
                        <SelectItem value="both">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !category}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
