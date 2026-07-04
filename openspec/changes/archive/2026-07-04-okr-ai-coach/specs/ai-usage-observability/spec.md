## ADDED Requirements

### Requirement: Registro de uso por llamada

Cada llamada de IA SHALL registrar al menos: empresa, usuario, feature
(`definir`/`revisar`), proveedor, modelo, tokens de entrada y de salida, costo
estimado y fecha. El registro SHALL guardarse del lado servidor (la Edge Function),
no desde el cliente.

#### Scenario: Se registra una llamada

- **WHEN** la IA procesa una solicitud de definir o revisar
- **THEN** queda un registro con proveedor, modelo, tokens y costo estimado

#### Scenario: Costo estimado

- **WHEN** se registra el uso
- **THEN** el costo estimado se calcula a partir de los tokens y el precio del
  modelo configurado

### Requirement: Resumen de uso por empresa

El sistema SHALL permitir a los miembros de una empresa ver un **resumen de uso de
IA** de su empresa (p. ej. totales de llamadas, tokens y costo estimado),
respetando RLS (no se ve el uso de otras empresas).

#### Scenario: Ver el uso propio

- **WHEN** un miembro abre el resumen de uso de IA
- **THEN** ve los totales de su empresa (llamadas, tokens, costo estimado)

#### Scenario: Aislamiento entre empresas

- **WHEN** un usuario consulta el uso
- **THEN** solo ve el de su(s) empresa(s), nunca el de otras (RLS)
