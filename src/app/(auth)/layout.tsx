"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

/**
 * Layout para /login, /register y /forgot-password.
 * Si el usuario ya tiene sesión activa, lo mandamos directo al dashboard
 * en vez de dejarlo ver los formularios de auth de nuevo.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Wallet className="size-4" />
        </div>
        Finanzas Personales
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
