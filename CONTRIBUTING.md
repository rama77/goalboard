# Contribuir a goalboard

¡Gracias por sumarte! Estas son las reglas para mantener el proyecto sano.

## Flujo de trabajo

1. **Fork** del repo a tu cuenta.
2. Branch por tema: `git checkout -b mi-cambio`.
3. **Un PR, un tema.** Cambios acotados y enfocados; nada de PRs gigantes que
   mezclan cosas no relacionadas.
4. Abrí un **Pull Request contra `main`**.

## `main` está protegida

No se pushea directo a `main`. Todo entra por PR con **al menos una aprobación**
de un/a mantenedor/a.

## Cambios no triviales: OpenSpec primero

Para features o cambios de fondo usamos **OpenSpec** (`/opsx:propose`):

1. Se propone el cambio (proposal + design + specs + tasks).
2. Se revisa la propuesta.
3. Recién ahí se implementa (`/opsx:apply`) y, al terminar, se archiva
   (`/opsx:archive`) para consolidar las specs.

Esto evita escribir código que después haya que tirar.

## Estilo de código

- Mantené el estilo del código existente: **vanilla, sin frameworks ni build**.
- **Sin CDN**, con la única excepción de `@supabase/supabase-js`.
- **Colores por tokens semánticos** (variables CSS), nunca hex sueltos en los
  componentes. Soportá **dark mode**.
- **Consola limpia**: cero errores y cero warnings.
- **Solo claves públicas** en el cliente (URL + anon key). Ningún secreto en el
  repo (jamás la `service_role`).

## Seguridad y permisos

La autorización vive en **Row Level Security** de Supabase, no en el front-end.
Cualquier cambio de permisos se hace y se documenta en las políticas RLS
(`supabase/schema.sql`), normalmente dentro de un change de OpenSpec.
