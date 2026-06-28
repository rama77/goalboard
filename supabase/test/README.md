# Pruebas del schema + RLS

Validan `supabase/schema.sql` (tablas, progreso calculado, trigger y políticas
Row Level Security) en un Postgres efímero en Docker, **sin tocar ningún proyecto
Supabase real**. Simulan el entorno de Supabase: esquema `auth`, `auth.uid()` y
los roles `anon` / `authenticated` (con RLS activa).

## Correr

```bash
./supabase/test/verify.sh    # requiere Docker corriendo
```

Levanta un contenedor `postgres:15`, aplica el shim + el schema + datos de
prueba, corre las aserciones y limpia el contenedor al terminar.

## Archivos

- `shim.sql` — emula lo mínimo de Supabase (esquema `auth`, `auth.uid()`, roles).
- `seed.sql` — datos deterministas: 3 usuarios, 2 orgs (un admin, un member, y un
  usuario de otra org), un ciclo, un objetivo y un key result.
- `run_tests.sh` — aserciones: transparencia, aislamiento entre orgs, escritura
  acotada a dueño/admin, gestión solo-admin, trigger de check-in, bootstrap de
  organización, CHECK de scoring y cálculo de progreso.

> El motor es el mismo (Postgres 15) que Supabase, pero esto NO reemplaza aplicar
> el schema en el proyecto real: es la validación de lógica previa.
