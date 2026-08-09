# Nutrio

Aplicación web (PWA instalable, mobile-first) para el seguimiento diario de un plan nutricional
basado en el **sistema de bloques / intercambio de alimentos**.

Todos los datos se guardan **en el propio dispositivo** con `localStorage`. No hay backend, no hay
cuentas y no se envía nada por la red: la app funciona completamente offline una vez cargada.

---

## Instalación y comandos

Requiere Node.js 18 o superior.

```bash
npm install       # instala dependencias
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # compila TypeScript y genera dist/ (con service worker)
npm run preview   # sirve la build de producción
npm run test      # ejecuta la suite de Vitest
npm run typecheck # solo comprobación de tipos
npm run icons     # regenera emblem/wordmark/lockup + iconos PWA desde logo.png

# Licencia (acceso remoto)
# Copia `.env.example` → `.env.local` y deja LICENSE_ACTIVE=true para desarrollo.
# En Vercel, define LICENSE_ACTIVE en Environment Variables. Solo el valor exacto
# `true` abre la app; cualquier otro (o un fallo de red) muestra la pantalla de pausa.
# El endpoint vive en `api/check-license.ts`; en local lo replica el middleware de Vite.

# Verificación visual de layout (requiere `npm run build` + `npm run preview` en otra terminal).
# Captura Hoy, Nueva comida, Calendario y el detalle del día a 375×667 y 320×568, y comprueba
# por consola que el botón «Guardar comida» no queda tapado por la barra de navegación.
npm run verificar:layout
```

### Instalar en el móvil

1. Ejecuta `npm run build && npm run preview -- --host` (o publica `dist/` en cualquier hosting
   estático: Netlify, Vercel, GitHub Pages…).
2. Abre la URL en el navegador del móvil.
3. **Android/Chrome:** menú → «Instalar aplicación». **iOS/Safari:** compartir → «Añadir a
   pantalla de inicio».

La app queda cacheada por el service worker y arranca sin conexión.

---

## El sistema de bloques en 2 minutos

Un **bloque** es una unidad de medida nutricional. Cada alimento tiene su equivalencia en gramos
(la columna «x1» de las tablas del nutricionista), y el plan asigna un número de bloques de cada
grupo a cada comida del día.

```
bloques = gramos / gramosPorBloque
gramos  = bloques * gramosPorBloque
```

Ejemplo: 1 bloque de arroz son 20 g → 100 g de arroz = **5 bloques de Carbohidratos**.

### Los seis grupos

| Grupo | Color | Qué incluye |
|---|---|---|
| Carbohidratos | ámbar | Cereales, tubérculos, pan, legumbres, azúcares |
| Alim. Proteicos I | salmón | Proteína magra (pollo, pescado blanco, claras, 0%) |
| Alim. Proteicos II | rojo oscuro | Proteína grasa (huevo, pescado azul, quesos, carnes grasas) |
| Grasas | gris | Aceites, frutos secos, aguacate, quesos grasos, salsas |
| Verduras y hortalizas | verde | Verduras y hortalizas |
| Frutas | morado | Frutas (1 bloque = 1 porción) |

Los alimentos **solo se intercambian dentro de su mismo grupo**.

### Reglas especiales que implementa la app

- **Legumbres (doble cómputo).** Las legumbres y las pastas de legumbre restan a la vez de
  Carbohidratos **y** de Alimentos Proteicos I. 60 g de legumbre cruda (1 bloque = 30 g) son
  2 bloques de CH y 2 de Proteicos I. En la interfaz se marcan con el badge `CH + PROT I`.
- **Frutas por porciones.** No se piden gramos sino bloques (stepper de 0,5 en 0,5), con la ayuda
  de la categoría: pieza muy grande, grande, mediana o pequeña.
- **Huevo completo.** Se cuenta por unidades: 1 huevo talla M/L ≈ 60 g = 1 bloque de Proteicos II.
- **Crudo vs. cocido.** Las tablas están siempre en crudo. Si pesas el alimento cocinado, activa
  «he pesado en cocido» y elige el factor (arroz ×3, pasta ×2,5, legumbres ×2,8, carne roja ×0,7,
  carne blanca ×0,75, pescado ×0,85). La app guarda internamente **siempre el peso en crudo**.
- **Aceite de cocinado y aliños.** Atajo de «+1 bloque de grasa (5 g AOVE)» en el formulario.
- **Leche semi.** 200 ml/día para los cafés; no cuenta como bloques, se registra aparte en ml.
- **Yogur bifidus (125 g).** Al activar el toggle del día, los objetivos se ajustan
  automáticamente: −0,5 CH, −0,5 Proteicos I, −0,5 Grasas.
- **Regla A/B.** No se mezclan las estructuras A y B dentro del mismo día; cambiarla exige
  confirmación. Los bloques **sí** se pueden mover entre comidas: lo que cuenta es el total diario.

### Planes por defecto

| Grupo | A: Des/Com/Cena | **Total A** | B: Des/Com/Cena | **Total B** |
|---|---|---|---|---|
| Carbohidratos | 3 / 3 / 2 | **8** | 3 / 3 / 2 | **8** |
| Alim. Proteicos I | 2 / 4 / 3 | **9** | 2 / 4 / — | **6** |
| Alim. Proteicos II | — | **0** | — / — / 3 | **3** |
| Grasas | 2.5 / 2 / 2 | **6.5** | 1.5 / 2 / 2 | **5.5** |
| Verduras | — / 1.5 / 1.5 | **3** | — / 1.5 / 1.5 | **3** |
| Frutas | — / 1 / 1 | **2** | — / 1 / 1 | **2** |
| Leche semi | | **200 ml** | | **200 ml** |

Los días con yogur los totales pasan a: **A** → CH 7,5 · Prot I 8,5 · Grasas 6, y **B** → CH 7,5 ·
Prot I 5,5 · Prot II 3 · Grasas 5. Este ajuste se calcula, no está hardcodeado.

---

## Pantallas

| Ruta | Pantalla |
|---|---|
| `/` | **Hoy**: tabla de seguimiento del día, toggles de yogur y leche, comidas registradas |
| `/nueva` | **Nueva comida**: buscador de alimentos, gramos ↔ bloques, resumen en vivo |
| `/calendario` | **Calendario**: rejilla mensual de menús previstos y herramientas de planificación |
| `/planificar` | El mismo formulario de comida en modo planificación (se abre desde el calendario) |
| `/racha` | **Racha semanal**: racha actual y récord, tira de 7 días, gráfica y resumen |
| `/plan` | **Editar plan**: rejilla A/B por comida y grupo, con totales calculados |
| `/alimentos` | **Consulta de alimentos**: buscador, filtros y ficha con equivalencias |
| `/usuario` | **Usuario**: perfil, ajustes, backup, borrado y guía del plan |

Al abrir la app el primer día se muestra un selector de plan **A/B** que no se puede saltar.

`/nueva` y `/planificar` son pantallas a pantalla completa: ocupan todo el alto disponible, el
formulario hace scroll por dentro y la **barra de acciones queda anclada justo encima de la barra de
navegación** (clase `.panel-pantalla`, que reserva `--nav-total`). Así el botón de guardar es
siempre visible y nunca puede quedar tapado.

---

## Calendario mensual de menús

El calendario sirve para **planificar con antelación**. La regla que lo gobierna todo:

> Un plato planificado **nunca suma bloques por sí solo**. El seguimiento y la racha reflejan
> siempre lo realmente comido.

### Los dos modos

| | **Agenda** (por defecto) | **Programar** |
|---|---|---|
| Al llegar el día | No aparece nada en el seguimiento | Los platos aparecen en su comida, **pendientes** |
| Aviso en Hoy | Tarjeta *«Tienes N platos planificados para hoy»* con botón **Ver** | Tarjetas atenuadas con icono de reloj y etiqueta «Planificado» |
| Cómo se registra | Botón **Registrar**: abre el formulario prerrellenado para ajustar gramos | Checkbox **«Lo he comido»**: conversión directa, con toast de Deshacer |
| Barra de progreso | Sin cambios | Segmento **rayado** con el aporte pendiente, fuera de `CONSUMIDO` y `RESTA` |

El modo se elige en Ajustes (pantalla Usuario) o desde el propio calendario, y se guarda en
`ajustes.modoCalendario`. En ambos modos, `estadoDelDia` y `calcularRacha` ignoran por completo la
planificación.

### Qué hay en la pantalla

- **Rejilla mensual** con la semana empezando según `ajustes.primerDiaSemana`. Cada celda muestra el
  número del día, badge A/B del plan previsto, hasta 4 puntos de color (una por comida planificada),
  el anillo de estado del día (verde cumplido, ámbar parcial, rojo incumplido) reutilizando
  `estadoDelDia`, y un icono de reloj si quedan planificados sin confirmar. Se cambia de mes con las
  flechas o deslizando en horizontal.
- **Detalle del día** (bottom sheet): plan previsto A/B, platos por comida con «+ Añadir plato»,
  tabla comparativa **objetivo vs planificado** para cuadrar el menú antes de cocinar, y una sección
  aparte con lo ya **registrado**.
- **Herramientas**: *Duplicar en…* (varias fechas a la vez), *Repetir semanal* (1–8 semanas),
  *Guardar plantilla* / *Aplicar plantilla*, *Vaciar día*, *Mover a…* por plato y añadir desde
  favoritos.

### Modelo de datos

`AppState` gana `planificacion: Record<fecha, DiaPlanificado>` y `plantillasMenu: PlantillaMenu[]`;
`Plato` gana `planificadoId` (rastro del planificado que lo originó) y `DiaRegistro` gana
`planificadosDescartados` (para que un planificado rechazado no reaparezca). La lógica pura vive en
`src/lib/planificacion.ts`.

---

## Arquitectura

```
src/
  data/          alimentos.ts (seed completo), planSeed.ts, grupos.ts,
                 factoresConversion.ts, instrucciones.ts
  lib/           bloques.ts (lógica pura), planificacion.ts (calendario),
                 fechas.ts, nombres.ts, search.ts,
                 storage.ts (localStorage + migraciones), backup.ts
  store/         AppContext.tsx, useApp.ts
  components/    BottomNav, TablaSeguimiento, FilaGrupo, ChipGrupo,
                 SelectorAlimento (combobox), FilaIngrediente, TarjetaPlato,
                 FormularioComida (compartido registro/planificación),
                 RejillaMes, DetalleDiaPlanificado, TarjetaPlanificado,
                 SelectorFechas, SelectorPlanDia, CalculadoraCrudoCocido,
                 Modal, Toast
  pages/         Hoy, NuevaComida, Calendario, PlanificarComida,
                 RachaSemanal, EditarPlan, ConsultaAlimentos, Usuario
scripts/
  generate-icons.mjs   recorta logo.png → assets UI + favicon/PWA/og (sharp)
  capturas.mjs         verificación visual de layout a 375×667 y 320×568
```

Toda la lógica de negocio vive en funciones puras:

- `src/lib/bloques.ts` — `gramosABloques`, `bloquesDePlato`, `objetivosDelDia`, `consumidoDelDia`,
  `estadoDelDia`, `calcularRacha`, `crudoDesdeCocido`…
- `src/lib/planificacion.ts` — `bloquesPlanificadosDelDia`, `comparaPlanVsObjetivo`,
  `confirmarPlanificado`, `descartarPlanificado`, `deshacerConfirmacion`, `copiarDia`,
  `aplicarPlantilla`, `guardarComoPlantilla`, `repetirSemanal`, `moverPlanificado`,
  `limpiarPlanificacionAnterior`, `matrizMes`. Todas devuelven un `AppState` nuevo, sin mutar.

`FormularioComida` es el **único** formulario de ingredientes de la app: `/nueva` lo usa en modo
`registro` y `/planificar` en modo `planificacion`, así que la lógica de bloques, el combobox de
alimentos y la conversión crudo/cocido no están duplicadas.

### Persistencia y versionado

El estado completo se serializa bajo la clave `nutrio:estado` con un campo `schemaVersion`.
`src/lib/storage.ts` aplica migraciones acumulativas al cargar, de forma que un backup antiguo se
adapta al esquema actual. Al añadir campos nuevos, sube `SCHEMA_VERSION` y registra la migración
correspondiente en el mapa `MIGRACIONES`.

### Objetivos inmutables por día

Cada día guarda un **snapshot completo del plan** (`objetivosSnapshot`) en el momento de crearse.
Editar el plan solo afecta a los días futuros y al día en curso; los días ya cerrados conservan
para siempre los objetivos con los que se registraron.

---

## Tests

```bash
npm run test
```

97 tests en seis archivos:

- `src/lib/__tests__/bloques.test.ts` — funciones puras: conversiones, doble cómputo de legumbres,
  ajuste por yogur, estado del día, cálculo de rachas, búsqueda e integridad del catálogo.
- `src/lib/__tests__/planificacion.test.ts` — lógica del calendario: bloques planificados,
  comparativa contra el objetivo, confirmar/descartar (idempotente e inmutable), copiar día,
  repetir semanal, plantillas, `matrizMes` y la migración v1 → v2.
- `src/components/__tests__/selectorAlimento.test.tsx` — combobox de alimentos.
- `src/__tests__/app.test.tsx` — recorrido de la app en jsdom, con un test por cada criterio de
  aceptación funcional (selector de plan obligatorio, 100 g de arroz = 5 bloques, legumbre con
  doble cómputo, ajuste por yogur, búsqueda sin acentos, inmutabilidad de días registrados,
  export/import de backup).
- `src/__tests__/guardarComida.test.tsx` — el flujo de guardado completo: botón visible, validación
  con motivo, nombre automático, Deshacer, edición sin duplicar y confirmación al salir.
- `src/__tests__/calendario.test.tsx` — los dos modos del calendario, las 6 pestañas, que planificar
  no altera los bloques, descartar persistente e importación de backups v1 y v2.

El layout (que la barra de acciones no quede tapada por la navegación a 375×667 y 320×568) se
verifica aparte con `npm run verificar:layout`, que mide las cajas en Chromium headless.

---

## Decisiones tomadas ante puntos ambiguos

- **Router de hash.** Se usa `HashRouter` y `base: './'` para que la build funcione tal cual desde
  cualquier subcarpeta o abierta como ficheros estáticos, sin configurar reescrituras en el
  servidor.
- **Comida «Extra».** Además de las comidas del plan, siempre existe una comida `extra` para
  registrar picoteos o platos fuera de estructura. No tiene objetivos propios, pero suma al total
  diario.
- **Gramaje de referencia de las frutas.** Como las frutas se miden en porciones, se les asigna un
  `gramosPorBloque` orientativo por categoría (muy grande y grande 160 g, mediana 125 g, pequeña
  110 g) que solo se usa para mostrar equivalencias; la interfaz siempre pide bloques.
- **Cambiar el plan de un día.** Cambiar de A a B conserva los platos ya registrados y solo renueva
  el snapshot de objetivos, así que el seguimiento se recalcula sin perder datos.
- **Racha del día en curso.** Si hoy todavía no cumple los objetivos, la racha no se rompe: se
  cuenta desde ayer, porque el día sigue abierto.
- **Fusión de backups.** Ante un conflicto de fecha gana el día cuyo plato más reciente sea
  posterior. Los favoritos se unen sin duplicar identificadores.
- **Iconos de la PWA.** `npm run icons` parte de `logo.png`, mide la tinta por luminancia
  (el crema tiene textura, así que no vale un match de color), y emite emblem/wordmark/lockup
  transparentes + versiones en verde claro para modo oscuro. Los iconos de app llevan solo el
  emblema: a 48 px el wordmark es ilegible. Verde de marca muestreado: `#408C7C`; crema `#F4F4F1`.
- **Gráficas bajo demanda.** La pantalla de racha se carga con `React.lazy` para que `recharts` no
  entre en el bundle inicial.
- **El formulario de planificación es una ruta, no un modal.** El detalle del día ya es un bottom
  sheet; anidar dentro el formulario completo dejaba muy poco alto útil en móvil. `/planificar`
  reutiliza el mismo componente a pantalla completa y vuelve al calendario al guardar.
- **Duplicar y aplicar plantilla sustituyen el día destino** en lugar de acumular platos, que es lo
  que se espera al «copiar un menú». Para añadir sin borrar están «+ Añadir plato» y los favoritos.
- **Confirmar un planificado es idempotente.** `confirmarPlanificado` comprueba que no exista ya un
  plato con ese `planificadoId`, así que un doble toque no duplica bloques.
- **Descartar no borra la planificación.** El id se guarda en `planificadosDescartados` del día, así
  que el menú previsto sigue intacto en el calendario y solo deja de sugerirse en Hoy.
- **Arrastrar platos entre días.** Se ha implementado como «Mover a…» con un selector de fecha, tal
  y como permite el enunciado: el drag & drop con el dedo sobre celdas de 52 px resultaba poco
  fiable frente a un selector explícito.
- **Deslizar para cambiar de mes** se detecta con eventos táctiles (umbral de 60 px y comprobación
  de que el gesto sea más horizontal que vertical) para no interferir con el scroll vertical.

---

## Aviso

Nutrio es una herramienta de seguimiento personal. No sustituye el criterio de tu nutricionista ni
constituye consejo médico.
