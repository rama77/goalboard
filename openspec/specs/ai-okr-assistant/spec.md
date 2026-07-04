# ai-okr-assistant Specification

## Purpose
TBD - created by archiving change okr-ai-coach. Update Purpose after archive.
## Requirements
### Requirement: Proponer OKRs desde texto o PDF

El sistema SHALL permitir que el usuario describa qué tiene que hacer mediante
**texto o un archivo PDF**, y la IA SHALL **proponer** uno o más objetivos con sus
key results como borrador editable. La IA NO SHALL guardar los OKRs por el usuario:
él los edita y confirma.

#### Scenario: Proponer desde texto

- **WHEN** el usuario escribe en lenguaje natural qué necesita lograr y pide
  proponer OKRs
- **THEN** la IA devuelve un borrador de objetivo(s) + KRs medibles, que el usuario
  puede editar antes de guardar

#### Scenario: Proponer desde un PDF

- **WHEN** el usuario aporta un PDF (p. ej. su plan/área) y pide proponer OKRs
- **THEN** la IA extrae el contexto del documento y propone OKRs en base a él

### Requirement: Alinear y validar contra los OKRs de la empresa

Al proponer o revisar, la IA SHALL considerar los **objetivos existentes de la
organización** (los OKRs de la empresa, según RLS) y SHALL indicar cómo el borrador
se **alinea** con ellos o señalar **desalineación / faltante de aporte**.

#### Scenario: Aporta a un objetivo de empresa

- **WHEN** el borrador del usuario contribuye a un objetivo de la empresa
- **THEN** la IA lo indica y sugiere enlazarlo a ese objetivo padre

#### Scenario: No aporta a nada

- **WHEN** el borrador no se relaciona con ningún objetivo de la empresa
- **THEN** la IA lo señala como posible desalineación, para que el usuario decida

### Requirement: Ayudar al foco

La IA SHALL favorecer el **foco**: proponer pocos objetivos y 3–5 key results, y
si el borrador tiene demasiados, sugerir cuáles priorizar o recortar.

#### Scenario: Demasiados objetivos/KRs

- **WHEN** el material sugiere muchos objetivos o un objetivo tiene más de 5 KRs
- **THEN** la IA propone un set acotado y prioriza, explicando el recorte

### Requirement: Revisar un borrador (analizar)

La IA SHALL revisar un borrador de objetivo + KRs y devolver **hallazgos** de
coaching (objetivo-que-es-tarea, KR no medible de→a, exceso de KRs) con una
sugerencia por hallazgo, sin reescribir por el usuario.

#### Scenario: Objetivo que es una tarea

- **WHEN** se revisa un objetivo redactado como tarea (p. ej. "Migrar a AWS")
- **THEN** la IA lo señala como tarea (no resultado) y sugiere reformularlo

#### Scenario: OKR bien formado

- **WHEN** el objetivo y sus KRs ya están bien
- **THEN** la IA lo confirma sin inventar problemas

### Requirement: Asistente opcional y no bloqueante

La asistencia de IA SHALL ser opcional: el usuario SHALL poder crear y guardar OKRs
sin usarla, y aplicar o ignorar sus propuestas y hallazgos.

#### Scenario: Guardar sin IA

- **WHEN** el usuario crea un objetivo sin invocar la IA
- **THEN** el guardado funciona normalmente

