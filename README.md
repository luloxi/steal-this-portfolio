**Español** | [English](README.en.md)

# ¡Robate este portfolio! 🦝

El sitio personal de Luciano Oliva Bianco (Lulox), online en **https://lulox.com.ar**.
Un portfolio simple y bilingüe (ES/EN) con blog, editor inline para el admin y una calculadora de presupuesto, todo en un solo Cloudflare Worker.
Forkealo, cambiá el contenido y publicalo. Esa es toda la idea. ✨
Es copyleft a propósito: llevátelo, mejoralo y dejalo abierto para el que venga. 🏴‍☠️

## ✨ Qué trae

- 🏠 **Inicio**: foto, nombre y menú (Contratar, Blog, Sobre mí, Proyectos, Contacto). En desktop ocupa la pantalla justa y en el celu entra en la primera pantalla.
- ✍️ **Blog** con editor Markdown/WYSIWYG, borradores, portadas (subidas a R2) y reordenar secciones arrastrando.
- 👤 **Sobre mí**: tu historia, las cards de experiencia y tus publicaciones (citas de artículos), editables inline como admin.
- 🧪 **Proyectos**: cards y páginas de detalle.
- 💸 **Contratar**: calculadora de presupuesto y un formulario que te manda por mail el mensaje y el presupuesto.
- 🌗 Tema claro y oscuro, 🇦🇷/🇺🇸 español e inglés.
- 🔐 Login con Google para cualquiera; admin solo los emails que permitas.
- 🤝 **Referidos**: cualquiera con cuenta de Google crea su código y gana el 15% de lo que abone el cliente que traiga; registro de pagos para el admin.
- 🎛️ Tira de admin (modo edición): ocultar, mostrar y reordenar secciones y proyectos sin borrar nada.

## 🧰 Stack

- [Next.js](https://nextjs.org) (App Router), compilado para Cloudflare con [OpenNext](https://opennext.js.org/cloudflare)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) + **D1** (SQLite) + **R2** (imágenes y archivos) + Rate Limiting
- [Better Auth](https://www.better-auth.com) con login de Google
- [Resend](https://resend.com) para el mail del formulario (con `send_email` de Cloudflare Email Routing como respaldo)
- Tailwind CSS 4, TypeScript y `tsx --test` para los tests

## 🚀 Arranque rápido

Necesitás **Node.js 24.22.1+** (la última LTS; está en `.nvmrc`, corré `nvm use`) y una cuenta gratis de Cloudflare (solo para publicar). Te recomiendo **pnpm** (está fijado en `package.json`); npm también funciona.

```bash
# 1. Instalar
pnpm install                  # o: npm install

# 2. Variables (secretos locales, ignorados por git)
cp .dev.vars.example .dev.vars
# completá BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TURNSTILE_SECRET_KEY (RESEND_API_KEY es opcional)

# 3. Base local (D1 en .wrangler/state) + posts de ejemplo
pnpm db:migrate:local         # o: npm run db:migrate:local
pnpm seed:blog                # o: npm run seed:blog

# 4. Correrlo
pnpm dev                      # o: npm run dev  → http://localhost:3000
```

### Variables

| Nombre | Dónde | Qué es |
|---|---|---|
| `BETTER_AUTH_SECRET` | secret | String aleatorio para las sesiones |
| `BETTER_AUTH_URL` | opcional | URL pública del sitio |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | secret | Cliente OAuth de Google. Redirect: `<sitio>/api/auth/callback/google` |
| `RESEND_API_KEY` | secret opcional | Envía el mail del formulario |
| `TURNSTILE_SECRET_KEY` | secret | Clave secreta de Cloudflare Turnstile. El formulario de /contratar verifica el token en el server (siteverify) antes de mandar el mail; sin ella responde 503. La site key pública está en `src/content/site.ts` (`turnstileSiteKey`); si forkeás, creá tu widget (dominios: el tuyo y `localhost`) y cambiala |
| `CONTACT_RL`, `REF_CHECK_RL` | `ratelimits` en `wrangler.jsonc` | Rate limit del formulario y del alta de referidos (5/min por IP) y del chequeo de códigos en vivo (60/min por IP) |
| `CONTACT_TO`, `CONTACT_FROM`, `CONTACT_INBOX` | `vars` en `wrangler.jsonc` | A dónde llega el mail del formulario, el remitente (un dominio verificado en Resend) y la casilla para tu copia |

En local van en `.dev.vars`. En producción: `npx wrangler secret put <NOMBRE>`.

### Comandos de todos los días

| pnpm | npm | Hace |
|---|---|---|
| `pnpm test` | `npm test` | Tests (`tests/*.test.mts`) |
| `pnpm typecheck` | `npm run typecheck` | Chequeo de TypeScript |
| `pnpm lint` | `npm run lint` | ESLint |
| `pnpm cf:build` | `npm run cf:build` | Build de producción para Cloudflare |
| `pnpm preview` | `npm run preview` | Build + el Worker real en local |
| `pnpm run deploy` | `npm run deploy` | Build + publicar en Cloudflare |

### ☁️ Publicar en Cloudflare

1. `npx wrangler login`
2. Creá tus recursos y poné nombres/ids en `wrangler.jsonc`:
   - `npx wrangler d1 create <tu-db>` (copiá el `database_id`)
   - `npx wrangler r2 bucket create <tu-bucket>`
   - cambiá `name`, `routes` (tu dominio), el destino de `send_email` y `vars` (`CONTACT_TO`, `CONTACT_FROM`, `CONTACT_INBOX`)
3. `pnpm db:migrate:remote` (el script usa el binding `DB` de `wrangler.jsonc`, no el nombre de la base: no hace falta tocar `package.json`)
4. Secrets: `npx wrangler secret put BETTER_AUTH_SECRET` (igual para los de Google, `TURNSTILE_SECRET_KEY` y `RESEND_API_KEY`)
5. `pnpm run deploy` (si falla una vez, volvé a correrlo)

## 🎨 Hacelo tuyo

**Primero esto** 👇
- `src/content/site.ts`: nombre, secciones del menú, redes, links de gustos, `CALL_BOOKING_URL` (tu agenda).
- `src/lib/auth/admin.ts`: `ADMIN_EMAILS`, las únicas cuentas de Google que pueden editar. Cualquier otra cuenta puede ingresar, pero es un usuario común: sin modo edición, sin admin, sin borradores (todas las APIs de admin responden 401/403), y solo ve su propio panel de referidos.
- `src/lib/auth/options.ts`: `ALLOWED_HOSTS` y `TRUSTED_ORIGINS` (tus dominios, si no el login los rechaza).
- `public/`: reemplazá las fotos (`avatar*.jpg`), imágenes de proyectos y logos.
- `public/og.png`: la imagen para compartir (og:image/twitter:image, 1200x630), recorte desde arriba de `avatar-hero.jpg`. Si cambiás la foto, regenerala. Los posts con portada usan su propia portada.
- **URLs en dos idiomas:** el español vive en la raíz y el inglés bajo `/en` con rutas traducidas: `/` ↔ `/en`, `/contratar` ↔ `/en/hire`, `/sobre-mi` ↔ `/en/about`, `/proyectos(/<id>)` ↔ `/en/projects(/<id>)`, `/contacto` ↔ `/en/contact`, `/privacidad` ↔ `/en/privacy`, `/blog` ↔ `/en/blog`, `/blog/<slug>` ↔ `/en/blog/<slug_en>`, `/ingresar` ↔ `/en/sign-in`, `/referidos` ↔ `/en/referrals` (`/en/tastes` y `/en/gustos` van a `/en/about`). **El idioma lo define la URL**, para el contenido y para la metadata: `src/proxy.ts` pone el header `x-lulox-locale` según la ruta (pisa el que mande el cliente) y reescribe `/en/...` a la página en español que la renderiza. La cookie `lulox-locale` solo guarda lo último que elegiste en el selector; no se usa para redirigir ni para elegir idioma (tampoco `Accept-Language`). El selector lleva a la misma página en el otro idioma (en un artículo, a su otro slug, leyendo el `hreflang` de la página). El mapa vive en `src/lib/routes.ts` (`SEGMENTS_ES_TO_EN`); los links internos se escriben en español y pasan por `href()` de `useLocale()`. Las URLs viejas en inglés de la raíz (`/about`, `/projects`, `/contact`, `/privacy`, `/login`) siguen redirigiendo igual que antes a las españolas.
- **Tarjetas para compartir (SEO):** cada URL tiene su `og:title`, `og:description`, `twitter:*`, `og:url` y `canonical` propios, en el idioma de la URL: `og:locale` `es_AR` en la raíz y `en_US` bajo `/en` (no dependen de cookies ni de `Accept-Language`). Cada página lleva `hreflang` `es-AR`, `en-US` y `x-default` (= español), y `sitemap.xml` lista las dos versiones de cada página con sus alternates. Formato "Página | Lulox"; la home queda "Lulox". Los artículos usan su título y su `summary` en ese idioma (si falta el resumen, el comienzo del artículo); las demás páginas tienen su descripción corta propia en cada idioma. El helper está en `src/lib/page-metadata.ts` (`pageMetadata("/ruta-en-español", { es, en })`); el texto de cada ruta vive en su `layout.tsx` (o en `privacidad/page.tsx`). Si agregás una ruta, sumala a `SEGMENTS_ES_TO_EN` y dale su `pageMetadata(...)`.
- `wrangler.jsonc` y el link del footer en `src/app/page.tsx`.

**Sección por sección**

| Sección | Ruta | Archivos | Cómo se edita |
|---|---|---|---|
| Inicio + menú | `/` | `src/app/page.tsx`, `src/components/section-nav.tsx`, `src/components/hire-button.tsx` | Ítems y orden por defecto: `sections` en `src/content/site.ts` (`hire` es la píldora que brilla). El admin puede ocultarlos y reordenarlos desde la tira del modo edición (ver "Secciones y proyectos"). En desktop el título "lulox" queda centrado sobre los botones del menú, sin línea debajo. |
| Blog | `/blog`, `/blog/[slug]`, `/en/blog`, `/en/blog/<slug_en>` | `src/app/blog/`, `src/components/views/blog-*.tsx`, `src/lib/blog.ts` | Los posts viven en D1 (`blog_posts`). Entrá como admin y escribí en `/blog/nuevo` o editá cualquier post. Ejemplos: `src/content/blog/seed.ts`. Cada post tiene `slug` (español, clave) y `slug_en` (inglés, columna de la migración `0007_blog_slug_en.sql`, rellenada desde `title_en`). En el editor se cambian los dos ("slug (ES)" y "slug (EN)"); el server valida que `slug_en` sea kebab-case en minúsculas sin tildes y que no lo use otro post (ni como `slug_en` ni como `slug`). Si queda vacío, al publicar se genera desde `title_en`; un borrador puede quedar sin `slug_en` y se sirve en `/en/blog/<slug>`. `/en/blog/<slug>` (slug en español) redirige 301 a `/en/blog/<slug_en>` y `/blog/<slug_en>` redirige 301 a `/blog/<slug>`. Antes de deployar este cambio hay que aplicar la migración 0007 (`pnpm db:migrate:remote`). Borradores: solo los ve el admin con el modo edición encendido (cookie `lulox-edit-mode`, espejo del localStorage, ver `src/lib/edit-mode.ts`); con el modo edición apagado el admin ve el blog como un visitante (sin borradores en la lista y el slug de un borrador da 404). |
| Extras del editor | | `src/components/blog-post-edit.tsx`, `md-wysiwyg.tsx`, `section-reorder.tsx`, `src/lib/article-sections.ts` | Portadas e imágenes van a R2 (`/api/media`, servidas en `/media/...`). "Orden de secciones" corta el post por títulos y `---` y te deja arrastrarlas. |
| Sobre mí | `/sobre-mi` | `src/app/sobre-mi/page.tsx`, `src/components/views/about-view.tsx`, `src/lib/page-layout.ts`, `src/lib/md-sections.ts` | Texto y cards de experiencia (`about.timeline`) en `src/i18n/messages.ts`. Como admin editás inline; se guarda en D1 (`site_copy`) y gana sobre el código. La animación de las secciones (el vistazo a las primeras líneas de "Primeros pasos" y el sacudón del botón) se pausa cuando sale de pantalla y sigue al volver (`IntersectionObserver` en `src/components/copy-markdown.tsx`); con `prefers-reduced-motion` no hay animación. |
| Publicaciones (Sobre mí) | `/sobre-mi`, `/en/about`, `PUT /api/publications` | `src/components/publications.tsx`, `src/lib/publications.ts`, `src/lib/publications-db.ts`, `src/lib/publications-api.ts`, `src/app/api/publications/route.ts`, `src/components/views/about-view.tsx`, `migrations/0011_publications.sql`, `scripts/sql/about-publications-copy.sql` | Un bloque propio "Publicaciones" / "Publications" para citar artículos, distinto de las cards de experiencia: lista numerada con título (link en pestaña nueva, `rel="noopener noreferrer"`, toda la entrada es clickeable), bajada corta por idioma y la cita (autores · año · medio). Va justo debajo del relato "Agentes e investigación" / "Agents and research": en el layout (`about.layout`) es el token `pubs:0`, después de `story:4`; un layout guardado sin el token lo pone después del último relato, y un cuerpo sin secciones `## ` lo muestra al final del texto. El título se muestra como fue publicado; `title_en` solo se usa si existe una versión real en inglés. Sin filas en D1 (o sin la tabla) se ven los dos artículos por defecto de `DEFAULT_PUBLICATIONS`. Como admin con el modo edición prendido: agregar, editar (título, título en inglés, bajada ES/EN, autores, año, medio, link), reordenar (↑ ↓), quitar y restaurar; los cambios quedan locales hasta "Guardar" (`PUT /api/publications`, 401 sin sesión, 403 si no sos admin o con el modo edición apagado). Validación estricta (`validatePublicationsPayload`): lista completa (máx. 30), ids `a-z 0-9 -`, links solo `https://` sin usuario/clave (máx. 600), título 1 a 300, bajadas hasta 160, autores hasta 400, medio hasta 80, año entero 1900 a 2100 o vacío, `hidden` booleano, sin campos extra. D1 `publications`: solo `INSERT ... ON CONFLICT DO UPDATE` y `UPDATE`; quitar es `hidden = 1` (nunca `DELETE`) y una fila que no viene en el guardado queda oculta. Los visitantes (y el admin con el modo edición apagado) nunca reciben las ocultas; `/sobre-mi` se renderiza por request (`force-dynamic`). Texto viejo: si un relato todavía termina con la lista de links a estas publicaciones, se omite al mostrarlo (`stripPublicationLinks`); en modo edición se ve el texto guardado tal cual. El cambio de copy en D1 (cerrar la frase sin los links, ES y EN) es manual: `scripts/sql/about-publications-copy.sql` (UPDATE por `key` + `locale`, solo si el texto actual coincide; correrlo dos veces no hace nada). Antes de deployar hay que aplicar la migración 0011 (`pnpm db:migrate:remote`); sin ella el sitio muestra los valores por defecto, pero guardar falla. |
| Links (LinkedIn + gustos) | al final de `/sobre-mi` | `src/app/sobre-mi/page.tsx`, `tasteLinks` en `src/content/site.ts`, textos en `src/i18n/messages.ts` (`about.linkedInCta`/`about.linkedInDetail`, `tastes.platforms`) | Un solo grupo de cuatro botones sin título: LinkedIn (azul), Letterboxd, Last.fm y Spotify, cada uno con título y descripción corta. `/tastes` y `/gustos` redirigen a `/sobre-mi`. Todo lo clickeable lleva `cursor: pointer` (deshabilitado: `not-allowed`). |
| Proyectos | `/proyectos`, `/proyectos/[id]` | `src/content/projects.ts`, `src/components/views/project*.tsx` | Agregá proyectos en `projects.ts` (ids: `djtube`, `mochi`, `sami`, `punksociety`). DJTube es el primero y el único activo (URL en vivo: https://dj.lulox.com.ar). El admin puede pisar estado y textos (D1 `project_overrides`) y ocultar o reordenar cada proyecto desde la tira del modo edición (D1 `project_settings`). Si `project_settings` ya tiene filas, un proyecto nuevo sin fila queda al final: para dejar a DJTube primero hay que ordenarlo desde esa tira. |
| Secciones y proyectos (admin) | `/` y `/en` (solo la landing) | `src/components/admin-strip.tsx`, `src/components/site-order-context.tsx`, `src/lib/site-sections.ts`, `src/lib/site-order.ts`, `src/app/api/sections/route.ts`, `migrations/0008_site_sections.sql` | Con sesión de admin y el modo edición encendido, solo en la landing (`/` y `/en`; lo decide `src/components/admin-strip-gate.tsx`), aparece abajo una tira de texto (solo títulos) con un switch Secciones / Proyectos, un buscador chico que filtra los títulos en vivo y botones ← →. Tocar o hacer click en un título lo oculta o lo muestra (oculto = tachado y atenuado); se reordena arrastrando (mouse al toque; en el celu, mantener apretado un instante y arrastrar, así la tira sigue scrolleando con el dedo) o con el teclado: flechas ← → sobre el título enfocado, o los botones ← → para el último elegido, con aviso para lectores de pantalla. Inicio no se puede ocultar ni mover (`not-allowed`). Cada cambio se guarda al instante en D1 (`PUT /api/sections`, solo admin, valida que vengan todas las claves una vez y `visible` booleano): `site_sections` (`key`, `position`, `visible`, `updated_at`) y `project_settings` (`id`, `position`, `visible`, `updated_at`). Ocultar no borra nada: una sección oculta desaparece del menú de la home, de los links del pie y de otras páginas (p. ej. Contacto en el artículo y en Contratar, el botón de contratar en Contacto), del `sitemap.xml` y de las APIs públicas, y sus páginas dan 404 en español y en `/en` (subpáginas incluidas: `/blog/<slug>`, `/proyectos/<id>`; `/tastes` sigue a Sobre mí). Un proyecto oculto sale de `/proyectos` y `/en/projects`, del sitemap y de `/api/projects/public`, y `/proyectos/<id>` y `/en/projects/<id>` dan 404. Volver a mostrarlo lo deja exactamente como estaba. El admin con el modo edición encendido sigue viendo y abriendo lo oculto, marcado con borde punteado y atenuado; con el modo edición apagado ve el sitio como un visitante (mismo criterio que los borradores). El 404 lo decide `src/proxy.ts` (`isPathHidden`), que solo lee D1 en rutas de secciones. Sin filas (o sin las tablas) todo se ve como siempre: todo visible y en el orden del código (`sections` en `src/content/site.ts`, `pastProjects` en `src/content/projects.ts`: `djtube`, `mochi`, `sami`, `punksociety`). DJTube es el primero y el único activo. Si `project_settings` ya tiene filas, los proyectos nuevos sin fila van al final: para ponerlo primero hay que ordenarlo desde la tira de admin. Antes de deployar hay que aplicar la migración 0008 (`pnpm db:migrate:remote`); sin ella el sitio anda igual con los valores por defecto, pero guardar falla. |
| Referidos | `/referidos`, `/en/referrals`, `/admin/referidos` | `src/app/referidos/`, `src/components/views/referrals-view.tsx`, `src/app/admin/referidos/`, `src/components/views/referrals-admin.tsx`, `src/lib/referrals.ts`, `src/lib/referrals-db.ts`, `src/lib/referrals-api.ts`, `src/lib/viewer.ts`, `src/app/api/referrals/`, `src/app/api/admin/referrals/`, `migrations/0009_referrals.sql` | Quien trae un cliente gana el 15% (`REFERRAL_PCT`) de lo que ese cliente abone. **Alta:** `/referidos` explica el programa a cualquiera; sin sesión muestra una frase corta y el botón "Entrar con Google" ahí mismo (vuelve a `/referidos`, el componente `GoogleSignInButton` de `sign-in-panel.tsx`), y abajo los tres pasos. Con sesión aparece el alta: nombre prellenado de Google, email de la cuenta (no editable), WhatsApp opcional y un código propio (a-z, 0-9 y guiones internos, 3 a 24, se guarda en minúsculas, chequeo en vivo con debounce contra `GET /api/referrals/check`, palabras reservadas bloqueadas en `RESERVED_CODES`). Un código por cuenta (`referrers.user_id` único). Después ve su link (`/contratar?ref=CODIGO` y `/en/hire?ref=CODIGO`) con botón de copiar, cuántos clientes trajo y lo que tiene por cobrar y cobrado; solo sus datos, buscados por el `user_id` de la sesión en el server (`GET /api/referrals`). **Atribución:** `?ref=CODIGO` en cualquier página guarda la cookie `lulox-ref` 90 días si el código existe y está activo (gana el último válido; lo hace `src/proxy.ts`). `/contratar` y `/en/hire` muestran "Referido por: CODIGO" / "Referred by: CODIGO" y un campo editable con el código (así un referido arma el presupuesto y se lo pasa al cliente). `/api/hire-contact` guarda cada envío en `hire_leads` con el presupuesto recalculado en el server y el código solo si está activo, y suma "Referido por: código (nombre)" al mail. **Registro:** `/admin/referidos` (solo admin; para cualquier otro es 404, lo decide `src/proxy.ts` y la página lo vuelve a chequear) lista referidos con contacto, código, fecha, botones de mail y `wa.me`, y sus clientes; en cada uno cargás lo que abonó (ARS o USD) y el server calcula el 15% (`referral_payouts`), con estado pendiente o pagado y fecha. Arriba de cada referido, lo que le debés por moneda. Desactivar un referido no borra nada: su código deja de atribuir. El admin también puede crear su propio código en `/referidos`. La sección se oculta desde la tira de admin como las demás (404, fuera del menú y del sitemap). En la home el botón Referidos solo aparece con sesión iniciada. Antes de deployar hay que aplicar la migración 0009 (`pnpm db:migrate:remote`). |
| Contacto | `/contacto` | `src/app/contacto/page.tsx` | Muestra `contactSocials` de `site.ts` y el botón de contratar. |
| Contratar | `/contratar` | `src/components/hire-calculator.tsx`, `src/lib/pricing.ts` | Tarifas, tamaños, descuentos y límites por defecto en `PRICING` (`pricing.ts`, con tests en `tests/pricing.test.mts`); los montos se pueden cambiar desde la página (ver "Montos de Contratar"). Todos los textos con montos ("+US$ X", tarifas, "Anticipo (X%)", la nota de anticipo y la fórmula con los descuentos) salen de los montos guardados. Formulario "Escribime": campos con `id`/`name`/`autocomplete` (`hire-name`, `hire-email`, `hire-message`), mensaje de hasta 280 caracteres contados por code point (un emoji cuenta 1; se aplica en JS con `clampMessage` de `src/lib/hire-limits.ts` y el server valida igual). Urgencia: en modo por hora es un toggle fijo de +US$ 100 (el trabajo por hora se estima como un día, sin selector de días; el server fuerza 1 día y el mail dice "Urgencia: sí"); en modo por proyecto se cobra por día. Uso privado: toggle opcional "Uso privado" en las dos modalidades (`PRICING.privateUse`: +US$ 500 por proyecto, +US$ 200 por hora), con una línea propia en el resumen, sin descuento por tamaño y sumado al total y al anticipo. Por defecto (apagado) Luciano puede mostrar el trabajo en su portfolio y el código queda open source; prendido queda solo para el cliente. El server lo recibe como `budget.privateUse` (booleano estricto: si falta es `false`, así los presupuestos viejos siguen andando; cualquier otro valor da `invalid_budget`), lo recalcula, lo pone en el mail ("Uso privado: sí/no" y la línea "Uso privado" con su monto) y lo guarda dentro de `hire_leads.budget_json` (sin migración). El 15% de referidos sale del total, con el uso privado incluido. Horas: slider + campo numérico sincronizados (solo enteros, `clampHours` en `pricing.ts`: 1 a 6 por hora, 8 a 40 por proyecto; el server aplica el mismo recorte). Por proyecto: menos de 8 h es trabajo por hora y más de 40 h se negocia (la calculadora lo aclara). Tamaños: Chico 20 h, Mediano 30 h, Grande 40 h (los botones ponen esas horas). Descuento por tamaño sobre horas × tarifa: 8–19 h sin descuento, 20–29 h 15% (Chico), 30–39 h 20% (Mediano), 40 h 25% (Grande). Si se pasa o llega al tope aparece un modal (`src/components/limit-modal.tsx`): fondo carmesí, borde arcoíris de los CTA girando, solo el título "Máximo 280 caracteres" y un anillo con la cuenta; no se cierra solo: los primeros 5 s no se puede cerrar (Esc, tocar afuera y el botón no hacen nada; el botón muestra la cuenta y el foco queda atrapado en el diálogo), después "Entendido" se habilita y cierra con el botón, Esc o tocando afuera, devolviendo el foco al mensaje; pegar de nuevo reinicia la cuenta a 5; se centra con `visualViewport` (sirve con el teclado abierto). El resumen que se envía arranca por el total, honeypot `hire_hp`, Turnstile y rate limit. También acepta un POST de formulario normal (sin fetch) en `/api/hire-contact`. Para agentes de IA, `public/llms.txt` explica cómo usarlo (si forkeás, cambiá el dominio y el link de la agenda). |
| Montos de Contratar (admin) | `/contratar`, `/en/hire`, `PUT /api/pricing` | `src/components/pricing-admin.tsx`, `src/lib/pricing-settings.ts`, `src/lib/pricing-db.ts`, `src/lib/pricing-api.ts`, `src/app/api/pricing/route.ts`, `src/app/contratar/page.tsx`, `migrations/0010_pricing_settings.sql` | Con sesión de admin y el modo edición prendido, arriba de la calculadora aparece un panel compacto "Montos · solo vos" (cerrado por defecto) para cambiar sin tocar código: tarifa por hora (baja, media, alta), presencial, viático y urgencia por día, uso privado (por proyecto y por hora), anticipo % y descuento por tamaño (Chico 20 h, Mediano 30 h, Grande 40 h). "Guardar" valida como el server y la calculadora cambia al toque; "Valores por defecto" vuelve a cargar los números de `PRICING` (hay que guardar). Se guarda en D1 `pricing_settings` (clave/valor, solo `INSERT ... ON CONFLICT DO UPDATE`, nunca se borra). Sin filas o sin la tabla, todo queda como `PRICING`; un valor guardado faltante o inválido vuelve al default de ese campo (y si los tres descuentos quedan incoherentes, vuelven los tres). Validación estricta (`validatePricingPayload`): todas las claves, enteros (no strings), tarifas 0 a 1000, presencial/viático/urgencia 0 a 10000, uso privado 0 a 100000, anticipo 0 a 100 %, descuentos 0 a 90 % y de menor a mayor (Chico ≤ Mediano ≤ Grande). La API responde 401 sin sesión, 403 si no sos admin (`ADMIN_EMAILS`) o si el modo edición está apagado (cookie `lulox-edit-mode=off`). `/contratar` se renderiza por request (`force-dynamic`, sin caché) y lee los montos de D1, así lo guardado se ve en la próxima carga; `/api/hire-contact` lee los mismos montos para el mail y `hire_leads` y nunca usa números del navegador. Las horas mín./máx., los tamaños y los topes de días quedan en código. `public/llms.txt` no menciona montos, así que sigue estático. Visitantes: nada nuevo. Antes de deployar hay que aplicar la migración 0010 (`pnpm db:migrate:remote`). |
| Mail del formulario | `/api/hire-contact` | `src/lib/hire-contact.ts`, `src/app/api/hire-contact/route.ts` | Valida (280 caracteres, email), honeypot, rate limit (`CONTACT_RL`), recalcula el presupuesto en el server (incluido el uso privado, `privateUse` dentro de `budget_json`), guarda el envío en D1 (`hire_leads`, con el código de referido si es válido y activo) y manda el mail a `CONTACT_TO` (hola@lulox.com.ar, buzón en Zoho según los MX) con el visitante como reply-to. Se envía por Resend; el binding `send_email` de Email Routing es solo respaldo y solo entrega a su dirección verificada. |
| Textos e i18n | todo el sitio | `src/i18n/messages.ts`, `src/i18n/locale-provider.tsx`, `src/lib/routes.ts` | Cada texto en `es` y `en`. El idioma sale de la URL (raíz = español, `/en` = inglés; ver "URLs en dos idiomas"). |
| Temas | todo el sitio | `src/components/providers/theme-provider.tsx`, `src/app/globals.css` | Claro/oscuro con la clase `.dark`. En el header va primero oscuro y después claro (como 🇦🇷 → 🇺🇸), con el activo resaltado. Sin preferencia guardada sigue al sistema (`prefers-color-scheme`): el script inline del `<head>` (`PREFS_HEAD_SCRIPT` en `src/lib/prefs-shared.ts`) lo aplica antes del primer render, sin flash, y si el sistema cambia con la página abierta se actualiza en vivo. Si elegís un tema a mano se guarda en la cookie `lulox-theme` y manda sobre el sistema. Los colores son variables CSS arriba de `globals.css`. |
| Footer | `/` | `src/app/page.tsx` (`home-steal`) | El link "¡Robate este portfolio!" / "Steal this portfolio!" (`ui.stealPortfolio` en `src/i18n/messages.ts`). Apuntalo a tu fork o sacalo. |

### 🖱️ Convención de cursor

Todo lo clickeable muestra `cursor: pointer` y lo deshabilitado `cursor: not-allowed`. Lo resuelve una regla global al final de `src/app/globals.css` (links, botones, roles ARIA clickeables, `label[for]`, `select`, `summary`, inputs tipo range/checkbox/radio/submit/file/color y sus thumbs), así que componentes nuevos no necesitan nada extra. Excepciones a propósito: `.sec-reorder-handle` (`grab`), los títulos de la tira de admin muestran `grabbing` mientras se arrastran, `.avatar-hud` (easter egg de doble click) y `.md-acc-btn-edit` (contenedor editable). Para chequearlo: con `pnpm dev` corriendo, `pnpm audit:cursor` recorre todas las rutas en español y bajo `/en` (home, blog y artículos, contratar, sobre mí, proyectos, contacto, tastes, rothko, privacidad, ingresar, 404) en claro/oscuro con Chrome headless y falla si algo clickeable no tiene el cursor correcto (`AUDIT_URL`, `AUDIT_ROUTES`, `AUDIT_WAIT=load` para apuntar a otro sitio). Para recorrerlo como admin, pasale una sesión local con `AUDIT_COOKIE="better-auth.session_token=..."` (solo contra tu preview local). Los campos de escribir (texto, número, búsqueda, fecha) mantienen el cursor de texto.

## 🗂️ Estructura del proyecto

```
├── src/
│   ├── app/            # rutas (páginas + api/), globals.css
│   ├── components/     # piezas de UI (calculadora, editor, nav, íconos...)
│   ├── content/        # site.ts, projects.ts, posts de ejemplo
│   ├── i18n/           # messages.ts (ES/EN), provider de idioma
│   └── lib/            # presupuestos, blog, auth, base de datos, lógica del formulario
├── migrations/         # migraciones SQL de D1
├── scripts/            # scripts de seed y mantenimiento (scripts/sql: SQL manual, no son migraciones)
├── tests/              # tests unitarios (pnpm test)
├── public/             # imágenes, audio
├── worker.ts           # entrada del Worker (redirige www al dominio raíz y después OpenNext)
└── wrangler.jsonc      # config de Cloudflare: D1, R2, email, rate limit, vars
```

## 🦝 Quién está atrás

Soy **Luciano Oliva Bianco**, pero me dicen **Lulox** (Lulo de chico, la X llegó después, por la risa de Carlitox). Investigo, construyo, creo, desde La Boca, Buenos Aires.

- 🎬 **FEDUN** (2015 - 2020): community manager, filmación de clases, marketing y desarrollo web.
- 🛠️ **BuidlGuidl** (2023 - 2024): desarrollador fullstack Web3, dApps con Scaffold-ETH 2 y Solidity como bienes públicos.
- 🔬 **Input Output Global** (jul 2025 - oct 2026): investigación y desarrollo en blockchain, finanzas e IA, además de automatizaciones, agentes y web apps. Coautor de papers sobre tokenización y el contexto legal del comercio agéntico.

Minué Bitcoin por 2009 y perdí la seed phrase, así que creeme con lo de "no subas tus secretos a git". 😅

### 💼 Contratame

¿Te gustó el sitio? Hago cosas así, y también automatizaciones, agentes de IA y apps blockchain.
Sacá tu presupuesto en segundos en **[lulox.com.ar/contratar](https://lulox.com.ar/contratar)**: US$ 10 - 25/h según complejidad, descuento por volumen en proyectos grandes y opción presencial. 50% al arrancar, 50% al entregar. ☕ Café y buena charla incluidos.

## 🤝 Contribuir

Issues y PRs bienvenidos. Simple:
1. `pnpm test && pnpm typecheck` antes de pushear.
2. Un cambio por PR, con una descripción clara.
3. Si agregás o cambiás algo, actualizá los dos READMEs (`README.md` en español y `README.en.md` en inglés).
4. Estilo: nada de rayas largas en textos que lea un visitante (ver `AGENTS.md`).

## 📄 Licencia

El **código** es [GNU AGPL-3.0-or-later](LICENSE). Si corrés una versión modificada en un servidor, tenés que compartir su código con sus usuarios.

El **contenido personal no** entra en esa licencia: las fotos, textos, posts, datos de proyectos, audio y logos de organizaciones (`public/orgs/`) son de Luciano (o de sus dueños). Reemplazalos por los tuyos. Las fuentes vienen de Google Fonts con sus propias licencias (OFL).
