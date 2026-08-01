import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/client";
import type { RegisterInput, LoginInput } from "@/lib/validations/auth";

/**
 * Categorías por defecto creadas para todo usuario nuevo.
 * Viven aquí (no en Firestore) porque son datos semilla conocidos de
 * antemano; el usuario podrá editarlas o crear más luego (fase posterior).
 */
const DEFAULT_CATEGORIES: Array<{
  name: string;
  kind: "income" | "expense" | "both";
}> = [
  // Ingresos: se agregan estas porque la lista de categorías que diste
  // era solo de gastos; sin categorías de tipo "income" el formulario de
  // ingresos no tendría nada que ofrecer en el selector de categoría.
  { name: "Sueldo", kind: "income" },
  { name: "Freelance", kind: "income" },
  { name: "Gratificación", kind: "income" },
  { name: "Bonificación", kind: "income" },
  // Gastos
  { name: "Comida", kind: "expense" },
  { name: "Transporte", kind: "expense" },
  { name: "Hogar", kind: "expense" },
  { name: "Servicios", kind: "expense" },
  { name: "Entretenimiento", kind: "expense" },
  { name: "Compras", kind: "expense" },
  { name: "Salud", kind: "expense" },
  { name: "Educación", kind: "expense" },
  { name: "Deudas", kind: "expense" },
  { name: "Suscripciones", kind: "expense" },
  { name: "Otros", kind: "both" },
];

/**
 * Registra un usuario nuevo y crea sus documentos base en Firestore
 * (perfil + categorías por defecto) en un batch-like secuencial simple.
 *
 * No se usa una Cloud Function para esto (fuera de alcance de la Fase 1 /
 * plan gratuito): la creación de datos semilla se hace desde el cliente
 * justo después del registro exitoso.
 */
export async function registerWithEmail({
  displayName,
  email,
  password,
}: RegisterInput): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    email: credential.user.email,
    displayName,
    createdAt: serverTimestamp(),
  });

  await Promise.all(
    DEFAULT_CATEGORIES.map((category, index) =>
      setDoc(doc(db, "categories", `${credential.user.uid}_default_${index}`), {
        userId: credential.user.uid,
        name: category.name,
        kind: category.kind,
        isDefault: true,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );

  return credential.user;
}

export async function loginWithEmail({
  email,
  password,
}: LoginInput): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Traduce los códigos de error de Firebase Auth a mensajes en español
 * entendibles para el usuario final, sin filtrar detalles internos.
 */
export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo.";
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/weak-password":
      return "La contraseña es demasiado débil.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta de nuevo más tarde.";
    case "auth/network-request-failed":
      return "Problema de conexión. Revisa tu internet e intenta de nuevo.";
    default:
      return "Ocurrió un error inesperado. Intenta de nuevo.";
  }
}
