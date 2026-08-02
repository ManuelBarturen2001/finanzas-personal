"use client";

import * as React from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Debt } from "@/types";

export function useDebts() {
  const { user } = useAuth();
  const [debts, setDebts] = React.useState<Debt[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      const resetTimer = window.setTimeout(() => {
        setDebts([]);
        setIsLoading(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const loadingTimer = window.setTimeout(() => {
      setIsLoading(true);
    }, 0);

    const q = query(
      collection(db, "debts"),
      where("userId", "==", user.uid),
      orderBy("dueDate", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }) as Debt);
        setDebts(data.filter((item) => item.isActive));
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return () => {
      window.clearTimeout(loadingTimer);
      unsubscribe();
    };
  }, [user]);

  return { debts, isLoading };
}
