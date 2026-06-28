## 1. Estructura del repo

- [x] 1.1 Crear la estructura de carpetas: `css/`, `js/`, `supabase/`
- [x] 1.2 Crear `.gitignore` (`.DS_Store`, `.vscode/`, `.idea/`, `*.log`)
- [x] 1.3 Crear `supabase/schema.sql` como placeholder versionado (comentario indicando que aquí irán DDL + políticas RLS en un change posterior)

## 2. Configuración y cliente de Supabase

- [x] 2.1 Crear `js/config.js` versionado con placeholders (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) y comentarios que aclaren que la anon key es pública y que nunca va la `service_role`
- [x] 2.2 Crear `js/supabase.js` que importe `createClient` de `@supabase/supabase-js@2` por ESM/CDN y exporte una única instancia inicializada con la config
- [ ] 2.3 Verificar que el cliente se inicializa sin errores ni warnings en la consola del browser _(requiere abrirlo en un browser; ver nota al final)_

## 3. Autenticación (magic link)

- [x] 3.1 Crear `js/auth.js` con: `signInWithOtp(email)`, `getSession()`, `onAuthChange(cb)` y `signOut()` sobre el cliente de Supabase
- [x] 3.2 Crear `index.html` con una sola página y entry point `<script type="module" src="./js/app.js">`
- [x] 3.3 Crear `js/app.js` (bootstrap): leer sesión inicial, renderizar vista de login vs. app, y suscribirse a `onAuthChange` para actualizar la UI en vivo
- [x] 3.4 Implementar la vista de login (input de email + solicitar magic link + mensaje "revisá tu correo")
- [x] 3.5 Implementar el estado autenticado mínimo con acción de cerrar sesión
- [ ] 3.6 Verificar el flujo completo: solicitar magic link → ingresar → persistir tras recarga → cerrar sesión _(requiere un proyecto Supabase real con credenciales; ver nota al final)_

## 4. Estilos (tokens + dark mode)

- [x] 4.1 Crear `css/styles.css` con tokens semánticos como variables CSS (sin hex sueltos) y soporte de dark mode
- [x] 4.2 Estilar la vista de login y el shell autenticado usando solo los tokens

## 5. Gobernanza y documentación

- [x] 5.1 Crear `LICENSE` (MIT, © 2026 Ramiro Galván)
- [x] 5.2 Escribir `README.md`: qué es goalboard, stack, cómo crear el proyecto Supabase, habilitar Auth magic link, configurar `config.js`, servir por HTTP, y tabla de variables
- [x] 5.3 Escribir `CONTRIBUTING.md`: flujo fork → PR acotado → PR contra `main` protegida (≥1 aprobación), OpenSpec para cambios no triviales, estilo (tokens, dark mode, consola limpia, solo claves públicas)
- [x] 5.4 Escribir `AGENTS.md` con las reglas no negociables y la estructura del repo
- [x] 5.5 Crear `CLAUDE.md` apuntando a `AGENTS.md`

## 6. Verificación final

- [ ] 6.1 Servir la app por HTTP y confirmar consola limpia (cero errores/warnings) _(servido OK — todos los recursos responden 200; la consola limpia requiere abrirlo en un browser)_
- [x] 6.2 Confirmar dark mode y ausencia de colores hardcodeados _(bloque `prefers-color-scheme: dark` presente; verificado sin hex sueltos fuera de los tokens)_
- [x] 6.3 Revisar que no haya secretos en el repo (solo URL + anon key públicas)
