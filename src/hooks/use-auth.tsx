"use client";

import * as React from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  /** true mientras Firebase determina el estado inicial de sesión. */
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
);

/**
 * Protección de rutas 100% en cliente (sin cookies de sesión ni
 * Cloud Functions): es la opción más simple y de costo cero compatible
 * con el plan gratuito de Firebase para una app personal. La contraparte
 * es un breve parpadeo de "loading" antes de saber si hay sesión, que se
 * resuelve mostrando un estado de carga en <ProtectedRoute>.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = React.useMemo(() => ({ user, isLoading }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}
