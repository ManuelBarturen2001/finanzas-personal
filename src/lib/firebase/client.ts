import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";

import { firebaseConfig } from "./config";

/**
 * Inicialización única (singleton) del SDK cliente de Firebase.
 *
 * Se reutiliza la instancia existente si el módulo se vuelve a evaluar
 * (por ejemplo, con Fast Refresh en desarrollo) para evitar el error
 * "Firebase App named '[DEFAULT]' already exists".
 */
function getFirebaseApp(): FirebaseApp {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }
  return initializeApp(firebaseConfig);
}

export const firebaseApp = getFirebaseApp();

export const auth: Auth = getAuth(firebaseApp);

/**
 * Usamos initializeFirestore con long-polling automático en vez de
 * getFirestore() a secas: mejora la compatibilidad en redes que bloquean
 * WebSockets/streaming (proxies corporativos, algunos entornos móviles),
 * evitando fallos silenciosos de conexión. Costo: ninguno en el plan
 * gratuito, es solo el mecanismo de transporte.
 */
export const db: Firestore = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
});
