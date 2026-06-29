## 1. Datos

- [x] 1.1 `data.js`: `createCheckIn(orgId, krId, {value, confidence, note})` (insert en `check_ins`; el trigger actualiza el KR)
- [x] 1.2 `data.js`: `listCheckIns(krId)` — historial del KR (valor, confianza, nota, fecha, autor) en orden cronológico
- [x] 1.3 `data.js`: traer el último check-in por KR en `listObjectives` (select anidado de `check_ins` ordenado desc) para la confianza vigente
- [x] 1.4 `data.js`: `closeCycle(cycleId, scores[])` — actualizar `score` de cada KR (0..1) y poner `cycles.status='cerrado'`

## 2. Confianza visible

- [x] 2.1 Indicador de confianza por KR (punto de color del último check-in; estado neutro si no hay)
- [x] 2.2 Rollup de confianza en el objetivo (la confianza más floja entre sus KRs)
- [x] 2.3 Tokens/estilos del indicador reusando `--success/--warning/--danger`

## 3. Check-in (UI)

- [x] 3.1 Botón "Check-in" por KR que abre un modal: nuevo valor + confianza (3 opciones) + nota
- [x] 3.2 Validación: confianza obligatoria; al confirmar, guardar y refrescar la vista (progreso recalculado)
- [x] 3.3 Manejo de error de permisos (RLS) sin romper la UI

## 4. Historial (UI)

- [x] 4.1 Acceso "Historial" por KR que abre un modal con la serie de check-ins (valor, confianza, nota, fecha, autor)

## 5. Cierre de ciclo + scoring (UI)

- [x] 5.1 Acción "Cerrar ciclo" visible solo para admin y ciclo `activo`
- [x] 5.2 Modal de cierre: lista de KRs con input de score 0.0–1.0 + guía de Doerr; validación de rango
- [x] 5.3 Al confirmar: guardar scores + status `cerrado`; reflejar en la vista
- [x] 5.4 Ciclo `cerrado` en modo solo-lectura (sin nuevo objetivo / check-in / cerrar; muestra scores finales; score de objetivo = promedio de KRs)

## 6. Verificación local (cierre condicionado a esto)

- [ ] 6.1 Registrar check-in: valor/confianza/nota → KR se actualiza (trigger) y progreso cambia
- [ ] 6.2 Historial muestra la serie en orden; rollup del objetivo refleja la confianza más floja
- [ ] 6.3 Permisos: un member no puede check-in ajeno; un no-admin no ve/cierra el ciclo (RLS)
- [ ] 6.4 Cerrar ciclo con scores → queda `cerrado` y de solo-lectura con los puntajes finales
- [ ] 6.5 Consola limpia y UX consistente con mindboard
