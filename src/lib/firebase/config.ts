/**
 * Configuración de Firebase leída desde variables de entorno.
 *
 * Todas las variables usan el prefijo NEXT_PUBLIC_ porque el SDK cliente
 * de Firebase se ejecuta en el navegador. Estos valores (apiKey incluido)
 * NO son secretos: identifican el proyecto de Firebase, no otorgan acceso
 * por sí solos. La seguridad real la dan las Firestore Security Rules
 * (ver /firestore.rules) y Firebase Authentication.
 *
 * Ver .env.local.example para la lista de variables requeridas.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

function assertFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno de Firebase: ${missing.join(", ")}. ` +
        "Revisa .env.local (copia .env.local.example) y reinicia el servidor de desarrollo."
    );
  }
}

if (typeof window !== "undefined") {
  // Solo validamos en cliente para no romper `next build` / SSR cuando
  // las variables aún no están configuradas en el entorno de build.
  assertFirebaseConfig();
}
