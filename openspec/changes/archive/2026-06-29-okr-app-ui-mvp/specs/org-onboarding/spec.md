## ADDED Requirements

### Requirement: Crear empresa al no tener ninguna

Cuando un usuario autenticado no pertenece a ninguna organización, la app SHALL
ofrecerle crear una (su empresa/tenant). Al crearla, el usuario SHALL quedar como
`admin` de esa organización (vía la función `create_organization`).

#### Scenario: Primer ingreso sin empresa

- **WHEN** un usuario recién logueado no es miembro de ninguna organización
- **THEN** la app muestra un onboarding para crear su empresa (pidiendo un nombre)
  y no muestra vistas de OKRs hasta que exista una

#### Scenario: Empresa creada

- **WHEN** el usuario crea su empresa desde el onboarding
- **THEN** la organización queda creada con el usuario como `admin`, pasa a ser la
  empresa activa, y la app muestra sus vistas de OKRs (vacías)

### Requirement: Seleccionar y cambiar la empresa activa

Cuando el usuario pertenece a una o más organizaciones, la app SHALL mantener una
**empresa activa** y permitir cambiarla. Todas las vistas de OKRs SHALL operar
sobre la empresa activa.

#### Scenario: Varias empresas

- **WHEN** el usuario pertenece a más de una organización
- **THEN** puede elegir cuál es la empresa activa desde la UI, y las vistas se
  recargan con los datos de esa empresa

#### Scenario: Aislamiento entre empresas

- **WHEN** el usuario cambia de empresa activa
- **THEN** solo ve datos de la empresa seleccionada (el aislamiento lo garantiza
  RLS; la UI nunca mezcla datos de distintas organizaciones)
