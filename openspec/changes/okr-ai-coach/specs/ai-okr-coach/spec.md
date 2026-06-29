## ADDED Requirements

### Requirement: Revisión asistida del objetivo y sus KRs

El sistema SHALL ofrecer una revisión de IA de un borrador de objetivo (título +
tipo) y sus key results, que devuelva **hallazgos de coaching** y NO reescriba ni
genere el OKR por el usuario. Los hallazgos SHALL señalar al menos: objetivos que
en realidad son tareas, key results no medibles (sin número inicial→target), y
exceso de key results (pérdida de foco), con una sugerencia por hallazgo.

#### Scenario: Objetivo que es una tarea

- **WHEN** el usuario pide revisar un objetivo redactado como tarea
  (p. ej. "Migrar a AWS")
- **THEN** el coach lo señala como tarea (no resultado) y sugiere reformularlo
  como el resultado que persigue

#### Scenario: Key result no medible

- **WHEN** un KR no tiene un número claro (de→a) o mide una actividad y no un
  resultado
- **THEN** el coach lo marca y sugiere cómo volverlo medible

#### Scenario: Demasiados key results

- **WHEN** el objetivo tiene más de 5 key results
- **THEN** el coach advierte sobre la pérdida de foco

#### Scenario: OKR bien formado

- **WHEN** el objetivo y sus KRs ya están bien (resultado claro, KRs medibles,
  pocos)
- **THEN** el coach lo confirma sin inventar problemas

### Requirement: El coach asesora, no bloquea

La revisión de IA SHALL ser opcional y no bloqueante: el usuario SHALL poder
guardar el objetivo con o sin pedir la revisión, y con o sin aplicar las
sugerencias.

#### Scenario: Guardar sin revisar

- **WHEN** el usuario crea un objetivo sin pedir la revisión de IA
- **THEN** el guardado funciona normalmente

#### Scenario: Ignorar sugerencias

- **WHEN** el usuario pide la revisión, ve los hallazgos y decide no aplicarlos
- **THEN** puede guardar el objetivo tal como lo escribió

### Requirement: La key del modelo nunca está en el cliente

La llamada al modelo SHALL ejecutarse del lado servidor (Edge Function), con la
API key del modelo guardada como secreto del servidor — nunca en el front-end ni
en el repo. La Edge Function SHALL requerir un usuario autenticado.

#### Scenario: Sin sesión

- **WHEN** se invoca la Edge Function sin un JWT de usuario válido
- **THEN** la función rechaza la solicitud (no procesa la revisión)

#### Scenario: Sin key configurada

- **WHEN** la API key del modelo no está configurada en el servidor
- **THEN** la app sigue funcionando y el botón de IA informa que la revisión no
  está disponible (no rompe el flujo de creación)
