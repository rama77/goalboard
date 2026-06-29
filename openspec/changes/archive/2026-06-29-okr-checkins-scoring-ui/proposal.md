## Why

goalboard ya deja ver y crear OKRs, pero un OKR sin seguimiento es una planilla
estática — exactamente lo que falló en Excel. El valor del método de Doerr está
en el **ritual de check-in**: actualizar cada KR seguido, con un indicador de
confianza, y al cierre del ciclo ponerle un puntaje honesto. El modelo de datos
ya soporta todo esto (tabla `check_ins`, columnas `score`, trigger que sincroniza
el KR con el último check-in, RLS); falta la **UI** que lo haga usable.

## What Changes

- **Check-in sobre un KR**: desde la card del objetivo, abrir un KR y registrar un
  check-in con el **nuevo valor**, un **indicador de confianza**
  (🟢 en camino / 🟡 en riesgo / 🔴 trabado) y una **nota** opcional. El valor
  actual del KR se actualiza (vía el trigger ya existente) y su progreso se
  recalcula.
- **Confianza visible**: cada KR muestra su confianza del último check-in; el
  objetivo muestra un rollup (la confianza "más floja" de sus KRs) para ver de un
  vistazo qué está en riesgo.
- **Historial del KR**: ver la serie de check-ins de un KR (valor + confianza +
  nota + fecha + autor), para leer cómo se movió en el tiempo.
- **Cierre de ciclo con scoring**: un admin puede **cerrar el ciclo**, asignando a
  cada KR un puntaje **0.0–1.0** (con la guía de Doerr: 0.7 es buen resultado).
  Al cerrar, el ciclo queda en estado `cerrado` y de solo-lectura.
- **Permisos**: registrar check-ins lo hace el dueño del objetivo o un admin;
  cerrar el ciclo, solo un admin (lo impone RLS, ya existente).

## Capabilities

### New Capabilities
- `checkin-ui`: registrar check-ins de un KR (valor + confianza + nota), ver el
  historial, y mostrar la confianza vigente en KRs y objetivos.
- `cycle-scoring-ui`: cerrar el ciclo activo asignando puntajes 0.0–1.0 a los KRs,
  y mostrar los ciclos cerrados como solo-lectura.

### Modified Capabilities
<!-- Las capabilities de datos (`okr-check-ins`, `okr-access-control`) ya existen
y no cambian sus requisitos: este change es la UI encima. -->

## Impact

- **Front-end**: nuevas funciones de datos (registrar check-in, listar historial,
  cerrar ciclo + guardar scores) y UI (panel/modal de check-in, historial,
  indicadores de confianza, modal de cierre de ciclo). Sin cambios de esquema.
- **Sin cambios de backend**: usa la tabla `check_ins`, el trigger y las columnas
  `score`/`status` ya existentes; todo sujeto a RLS.
- **Dev/verificación**: local-first contra el stack de la Supabase CLI.
- **Fuera de alcance (futuros)**: IA coach (que asista el check-in), notificaciones
  de "hace X que no actualizás", y la capa SaaS de planes/billing.
