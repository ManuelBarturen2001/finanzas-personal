"use client";

import * as React from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Account } from "@/types";

/**
 * Listener en tiempo real de las cuentas del usuario. Se usa onSnapshot
 * (en vez de un fetch único) para que el saldo se refresque solo en toda
 * la UI apenas se registra un movimiento, sin recargar la página. Para el
 * volumen de una app personal (pocas cuentas, pocos usuarios) el costo de
 * lecturas en tiempo real es despreciable dentro del plan gratuito.
 */
export function useAccounts(includeInactive = false) {
  const { user } = useAuth();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset local state when auth signs out (legitimate sync reset, not an external-system callback)
      setAccounts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "accounts"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Account
        );
        setAccounts(includeInactive ? data : data.filter((a) => a.isActive));
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return unsubscribe;
  }, [user, includeInactive]);

  return { accounts, isLoading };
}
