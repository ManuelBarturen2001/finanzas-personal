# Progreso del proyecto

## Fase 1 — Completada

Configuración base + autenticación funcional de punta a punta.

### Qué se implementó

- Proyecto Next.js 16 (App Router) + TypeScript estricto + Tailwind CSS v4.
- Componentes base de shadcn/ui (Button, Card, Input, Form, Dialog, Sheet,
  DropdownMenu, Avatar, Badge, Alert, Skeleton, Separator, Sonner/Toaster).
- Firebase Authentication (email + contraseña): registro, login, logout,
  recuperación de contraseña, mensajes de error en español.
- Cloud Firestore inicializado con long-polling automático.
- `AuthProvider` / `useAuth` (contexto de React) + `ProtectedRoute` para
  proteger las rutas del dashboard en el cliente.
- Layout de dashboard: sidebar en escritorio, navegación en drawer (Sheet)
  en móvil, menú de usuario con logout.
- Tipos TypeScript centralizados para todo el dominio (Account, Transaction,
  Debt, RecurringExpense, Category, Budget, SalaryConfig) en `src/types`,
  listos para usarse en las siguientes fases.
- `firestore.rules`: cada colección exige `userId == request.auth.uid`
  tanto para leer como para escribir; las categorías no se pueden borrar
  físicamente desde el cliente (solo desactivar) para no romper movimientos
  históricos.
- Categorías por defecto (Comida, Transporte, Hogar, etc.) creadas
  automáticamente al registrar un usuario nuevo.
- Build de producción (`npm run build`), type-check (`tsc --noEmit`) y
  lint (`eslint`) verificados sin errores.

### Decisiones técnicas tomadas (y por qué)

1. **shadcn/ui instalado manualmente, no vía CLI.** El CLI de `shadcn`
   necesita descargar los componentes desde `ui.shadcn.com`, dominio no
   accesible en este entorno de desarrollo. Se escribieron los componentes
   a mano siguiendo exactamente el código estándar de shadcn/ui (son
   snippets MIT pensados para copiarse al proyecto, no una librería
   instalada por npm), así que el resultado es idéntico al que generaría
   el CLI. Si más adelante tienes acceso, `npx shadcn@latest add <componente>`
   seguirá funcionando normalmente sobre este mismo `components.json`.
2. **Protección de rutas 100% en cliente**, sin cookies de sesión ni Cloud
   Functions. Es la opción más simple y de costo cero compatible con el
   plan gratuito de Firebase para una app personal. Contra: un breve
   parpadeo de "Cargando..." antes de saber si hay sesión activa.
3. **`initializeFirestore` con `experimentalAutoDetectLongPolling`** en vez
   de `getFirestore()` a secas, para evitar fallos silenciosos de conexión
   en redes que bloquean streaming/WebSockets. Sin costo adicional.
4. **Categorías por defecto creadas desde el cliente al registrarse**, no
   con una Cloud Function, para no salir del plan gratuito. Es un batch
   simple de `setDoc` inmediatamente después de crear la cuenta.
5. **Montos en soles (número), no en centavos.** Se prioriza simplicidad
   para la Fase 1; si la precisión decimal da problemas en fases
   posteriores (sumas de muchos movimientos), se puede migrar a enteros
   (centavos) sin romper la interfaz pública de los tipos.
6. Las variables `NEXT_PUBLIC_FIREBASE_*` no son secretas: identifican el
   proyecto de Firebase pero no otorgan acceso por sí solas. La seguridad
   real la dan `firestore.rules` + Firebase Authentication.

## Fase 3 — Completada

Cuentas, Movimientos (ingresos, gastos, transferencias) y configuración de
sueldo, con saldos denormalizados y actualizados atómicamente.

### Qué se implementó

- **Cuentas** (`/accounts`): crear, editar (nombre/tipo/moneda) y ocultar
  (soft delete). El saldo inicial no es editable una vez creada la cuenta.
- **Movimientos** (`/transactions`): un diálogo con pestañas Gasto /
  Ingreso / Transferencia. Lista de movimientos con ícono y color por
  tipo, edición limitada (descripción/fecha/categoría) y eliminación con
  confirmación.
- **Configuración de sueldo**: diálogo accesible desde "Movimientos" que
  guarda monto, frecuencia, día de pago y cuenta destino en un documento
  único por usuario (`salaryConfig/{uid}`). No genera pagos automáticos
  (fuera de alcance, ver spec original); es solo el dato de referencia
  para cuando registres el ingreso de sueldo cada mes.
- **Dashboard conectado a datos reales**: balance total, ingresos/gastos
  del mes, saldo por cuenta y últimos 5 movimientos.
- Categorías por defecto ampliadas con 4 categorías de ingreso (Sueldo,
  Freelance, Gratificación, Bonificación) para que el formulario de
  ingresos tenga opciones reales donde elegir.
- Índices compuestos de Firestore agregados para las nuevas queries
  (`accounts` por `userId`+`createdAt`, `categories` por `userId`+`name`).
- Build de producción, type-check y lint verificados sin errores tras
  cada cambio.

### Decisiones técnicas tomadas (y por qué)

1. **Saldos actualizados con `runTransaction` de Firestore**, no con
   `updateDoc` suelto: cada ingreso/gasto/transferencia hace una lectura +
   escritura atómica del saldo de cuenta junto con la creación del
   movimiento, para que nunca queden desincronizados aunque dos
   escrituras coincidan o una falle a medias (prioridad #2 de tu lista:
   correctitud de los datos).
2. **Eliminar un movimiento revierte su efecto en el saldo** dentro de
   otra `runTransaction`, usando los datos que ya tenemos en memoria del
   listener (no hace falta releer el movimiento del servidor).
3. **Editar un movimiento se limita a descripción, fecha y categoría** —
   no monto ni cuentas. Permitir cambiar el monto o la cuenta de un
   movimiento ya "aplicado" al saldo requeriría recalcular ese saldo de
   forma segura ante ediciones concurrentes; es más simple y con menos
   superficie de bugs pedir eliminar y volver a crear el movimiento si el
   monto estaba mal. Se puede revisar en la Fase 6 si resulta molesto en
   el uso real.
4. **Cuentas y categorías se ocultan (`isActive: false`), nunca se borran
   físicamente**, porque los movimientos históricos guardan su
   `accountId`/`categoryId` y borrarlas rompería esas referencias. Los
   selects de "nuevo movimiento" solo muestran las activas; el listado de
   movimientos resuelve el nombre igual aunque la cuenta/categoría ya
   esté oculta.
5. **Listeners en tiempo real (`onSnapshot`)** en vez de fetch único para
   cuentas/categorías/movimientos: para el volumen de una app personal el
   costo de lecturas es despreciable en el plan gratuito, y a cambio el
   saldo se refresca solo en toda la UI sin recargar. `useTransactions`
   limita a 50 documentos para no traer el historial completo en cada
   carga.
6. **Configuración de sueldo con ID de documento == uid del usuario**
   (colección `salaryConfig`), en vez de un campo `userId` + query: así
   la Security Rule es una simple comparación de ID de documento, y solo
   puede existir un documento de config por usuario (lo cual es correcto:
   siempre es "el sueldo vigente").
7. **`z.coerce.number()` en los formularios de montos**, con
   `useForm<z.input<Schema>, unknown, z.output<Schema>>` (en vez de un
   solo genérico): es el patrón correcto para que React Hook Form +
   Zod v4 tipen bien un campo que llega como string del `<input>` pero se
   valida/convierte a `number`.

### Qué falta (siguientes fases)

- **Fase 4:** Gastos recurrentes y Deudas (con denormalización de cuotas
  pagadas/pendientes, igual que las cuentas).
- **Fase 5:** Estadísticas, gráficos (Recharts) y presupuestos.
- **Fase 6:** pulido de validaciones/errores/estados vacíos específicos,
  responsive, y revisar si vale la pena permitir editar monto/cuenta de
  un movimiento.
- **Fase 7:** testing y revisión de seguridad, cálculos y consultas.
- **Fase 8:** deploy en Netlify.

