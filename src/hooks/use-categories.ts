"use client";

import * as React from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Category } from "@/types";

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset local state when auth signs out (legitimate sync reset, not an external-system callback)
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "categories"),
      where("userId", "==", user.uid),
      orderBy("name", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Category)
          .filter((c) => c.isActive);
        setCategories(data);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return unsubscribe;
  }, [user]);

  return { categories, isLoading };
}
