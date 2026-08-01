"use client";

import * as React from "react";
import {
  collection,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Transaction } from "@/types";

/**
 * Listener en tiempo real de los movimientos del usuario.
 * `limitCount` acota las lecturas cuando una vista solo necesita los más
 * recientes; si no se indica, devuelve el historial completo.
 */
export function useTransactions(limitCount?: number) {
  const { user } = useAuth();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset local state when auth signs out (legitimate sync reset, not an external-system callback)
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const constraints = [
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      ...(limitCount === undefined ? [] : [fsLimit(limitCount)]),
    ];
    const q = query(collection(db, "transactions"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Transaction
        );
        setTransactions(data);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return unsubscribe;
  }, [user, limitCount]);

  return { transactions, isLoading };
}
