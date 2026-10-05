"use client";

import * as React from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Budget } from "@/types";

export function useBudgets() {
  const { user } = useAuth();

  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      return;
    }

    const q = query(
      collection(db, "budgets"),
      where("userId", "==", user.uid),
      orderBy("period", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Budget[];

        setBudgets(data);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return {
    budgets: user ? budgets : [],
    isLoading: user ? isLoading : false,
  };
}