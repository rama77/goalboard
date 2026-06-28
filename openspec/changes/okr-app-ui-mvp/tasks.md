## 1. Sistema de diseño (de mindboard)

- [x] 1.1 Reescribir `css/styles.css` con los tokens de mindboard: `:root` + `.dark` (paleta `oklch`, marca teal/azul, `--radius`), reemplazando los tokens hex del bootstrap
- [x] 1.2 Portar los componentes base usados: shell (`ap-app`/`ap-sidebar`/`ap-main`), topbar, `ap-header`/`ap-title`/`ap-subtitle`, `ap-btn`(+`.ghost`)/`ap-icon-btn`, `ap-card`, `ap-modal`, badges
- [x] 1.3 Dark mode por clase `.dark` en `<html>` con `localStorage` + default por `prefers-color-scheme`, y un toggle de tema (`state.js` + bootstrap inline en `index.html` + botón en la topbar)

## 2. Acceso a datos y estado

- [x] 2.1 `js/data.js`: listar organizaciones del usuario; crear empresa vía RPC `create_organization`; listar/crear ciclos; listar objetivos + KRs (con progreso); crear objetivo y crear KRs
- [x] 2.2 `js/state.js`: empresa activa y ciclo activo, persistidos por usuario en `localStorage`, con validación contra lo que devuelve Supabase

## 3. App shell y navegación

- [x] 3.1 `index.html` + módulo de shell: layout sidebar + topbar + página al estilo mindboard
- [x] 3.2 Sidebar: empresa activa con opción de cambiar (si hay varias) y lista de ciclos con selección del ciclo activo
- [x] 3.3 `app.js`: orquestar sesión → ¿tiene org? → onboarding vs app

## 4. Onboarding de empresa (tenant)

- [x] 4.1 Vista de onboarding cuando el usuario no tiene organización: crear empresa (nombre) vía `create_organization`
- [x] 4.2 Al crear, pasa a ser empresa activa y entra a la app; si ya tiene una o más, entra directo con la activa

## 5. Ver y crear OKRs

- [x] 5.1 Crear ciclo (nombre + cadencia anual/trimestral) y seleccionarlo; estado vacío que invita a crear el primero (sugiere el año actual)
- [x] 5.2 Lista de objetivos del ciclo como cards: título, tipo, dueño, KRs y barra de progreso (promedio de KRs); estado vacío que invita a crear el primero
- [x] 5.3 Modal "nuevo objetivo": título + tipo (comprometido/aspiracional) + agregar KRs (tipo numérico/porcentaje/hito, inicial/target/actual)
- [x] 5.4 Validación mínima (título, tipo, target del KR) y advertencia al pasar de 5 KRs (sin bloquear)
- [x] 5.5 Guardar objetivo + KRs vía `data.js` y reflejarlo en la lista

## 6. Verificación local (cierre condicionado a esto)

- [ ] 6.1 Contra el stack local: login (magic link vía Mailpit) → crear empresa → crear ciclo → crear objetivo + KRs → ver progreso _(el camino de datos crear→progreso ya está verificado de punta a punta con un usuario autenticado por script; falta confirmar el login y el render en el browser)_
- [ ] 6.2 Transparencia: con un segundo usuario en la misma empresa, ver los objetivos del otro (RLS)
- [ ] 6.3 Dark mode funciona y consola limpia (cero errores/warnings)
- [ ] 6.4 Verificar que la UI luce consistente con mindboard (tokens/componentes)
