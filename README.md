# Finanzas Personales

Aplicación web de gestión de finanzas personales (Fase 1 de un desarrollo
progresivo por fases). Ver `PROGRESO.md` para el detalle de qué está
implementado y qué falta.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (componentes copiados manualmente en
  `src/components/ui`, ver nota en `PROGRESO.md`)
- Firebase Authentication + Cloud Firestore
- React Hook Form + Zod para formularios y validación
- Recharts (se usará a partir de la Fase 5 para gráficos)
- Deploy de frontend en Netlify (Firebase solo se usa para Auth/Firestore)

## Requisitos previos

- Node.js 20 o superior
- Un proyecto de Firebase (gratuito, plan Spark) con **Authentication**
  (proveedor Email/Password) y **Cloud Firestore** habilitados

## Puesta en marcha

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia el archivo de variables de entorno y complétalo con los datos de
   tu proyecto de Firebase (Configuración del proyecto → Tus apps → Config
   del SDK):

   ```bash
   cp .env.local.example .env.local
   ```

3. Publica las reglas de seguridad de Firestore (requiere el
   [Firebase CLI](https://firebase.google.com/docs/cli)):

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add        # selecciona tu proyecto
   firebase deploy --only firestore:rules,firestore:indexes
   ```

4. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abre `http://localhost:3000`, crea una cuenta desde `/register` y
   deberías llegar al dashboard.

## Deploy en Netlify

1. Sube este repositorio a GitHub.
2. En Netlify: "Add new site" → "Import an existing project" → conecta el
   repo. El `netlify.toml` incluido ya define el comando de build
   (`npm run build`) y el plugin de Next.js.
3. En Netlify, agrega las mismas variables de `.env.local` en
   **Site configuration → Environment variables**.
4. En Firebase Authentication → Settings → Authorized domains, agrega el
   dominio que te da Netlify (y tu dominio propio si usas uno).

## Estructura del proyecto

```
src/
  app/
    (auth)/          Login, registro, recuperación de contraseña
    (dashboard)/      Rutas protegidas (dashboard y, en próximas fases,
                       cuentas, movimientos, deudas, estadísticas)
  components/
    ui/               Componentes base de shadcn/ui
    auth/             Formularios de autenticación
    layout/            Sidebar, navegación móvil, menú de usuario
  hooks/               useAuth / AuthProvider
  lib/
    firebase/         Inicialización del SDK de Firebase (config + client)
    validations/       Esquemas Zod
  services/            Acceso a Firebase (authService y los que se irán
                       agregando: accountService, transactionService, etc.)
  types/               Tipos TypeScript centralizados del dominio
firestore.rules         Reglas de seguridad de Firestore
firestore.indexes.json  Índices compuestos necesarios
```

Ver `PROGRESO.md` para el detalle de decisiones técnicas tomadas y el plan
de las siguientes fases.
