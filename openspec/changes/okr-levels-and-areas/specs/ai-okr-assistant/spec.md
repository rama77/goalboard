## MODIFIED Requirements

### Requirement: Alinear y validar contra los OKRs de la empresa

Al proponer o revisar, la IA SHALL considerar los **objetivos de nivel `empresa`** de la
organización (según RLS) como ancla de alineación, y SHALL indicar cómo el borrador se
**alinea** con ellos o señalar **desalineación / faltante de aporte**. La IA SHALL tener
en cuenta el **nivel** del borrador (empresa/área/individual) para encuadrar su consejo
(los de empresa: amplios y estratégicos; los individuales: concretos y medibles).

#### Scenario: Aporta a un objetivo de empresa

- **WHEN** el borrador del usuario contribuye a un objetivo de nivel empresa
- **THEN** la IA lo indica y sugiere enlazarlo a ese objetivo padre

#### Scenario: No aporta a nada

- **WHEN** el borrador no se relaciona con ningún objetivo de nivel empresa
- **THEN** la IA lo señala como posible desalineación, para que el usuario decida

#### Scenario: Encuadre según nivel

- **WHEN** se define/revisa un objetivo de nivel `empresa` redactado como algo muy
  operativo, o uno `individual` demasiado vago
- **THEN** la IA sugiere ajustar el encuadre al nivel (estratégico vs concreto)
