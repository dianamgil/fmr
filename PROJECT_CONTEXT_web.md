# Project Context Summary — Academic Personal Website (bio.link-style)




## 1. Purpose & Business Context
- Client: a university professor or other profesionals requesting a personal  website.
- Developer intent: build this as a **reusable template** to resell/replicate to other professors (junior dev, first freelance portfolio piece).
- Design reference: bio.link-style landing page (avatar, name, social icons, stacked link buttons) as the entry point, expanding into a multi-page academic site (CV, Publications, Projects, About) with a shared sticky nav/layout.

## 2. Tech Stack
- **Framework**: Astro v7.3.2 (static output, no SSR/adapter configured)
- **Styling**: Tailwind CSS v4, integrated via official Vite plugin (`@tailwindcss/vite`) — NOT the Tailwind CDN. Entry stylesheet: `src/styles/global.css` containing `@import "tailwindcss";`
- **Data validation**: Zod, via Astro Content Collections (Content Layer API — `loader` pattern, required by Astro v6+; legacy `type: 'data'` collections are unsupported on this version)
- **Language**: TypeScript (type-checking only, fully stripped at build; zero runtime cost)
- **Hosting target**: Vercel (static deploy) — not yet configured
- **No backend, no database, no auth** exist in the project currently. All content is served from build-time static generation.
- **Repo**: GitHub `dianamgil/fmr`, branch `main`. Contains real client data (not yet publication PDFs). Visibility (public/private) was discussed; user accepted risk since profile data is already public info, but flagged that published-article PDFs (copyright-restricted) must NOT be committed without rights confirmation — link to DOI/publisher instead when that's added.
- **Local dev environment**: Windows, PowerShell, VS Code with official Astro extension. Project physically located at `C:\Users\d_mgi\Desktop\Portafolio_DMG\FMR_web\src\fmr`.

## 3. Non-Functional Requirements NFR (govern all architectural decisions) THIS A VERY IMPORTANT POINT 
1. Maximize Lighthouse score.
2.  Scalable/replicable to other professors — "scalable" specifically means: this must be able to grow into a multi-tenant CMS/platform serving **hundreds of professor-users**

"scalable" specifically means: this must be able to grow into a multi-tenant CMS/platform serving **hundreds of professor-users**, not just a manually copy-pasted static template per client. Breaks down into three dimensions:
   - **Code scalability (maintenance & new features)** — the codebase must stay well-structured enough that adding a new screen/feature never breaks the rest of the site. Independent components (`ProfileHeader`, `LinkButton`, `SocialIcons`, etc.) keep concerns separated — changing a button's design must never touch data-fetching logic. Structure must also be clear enough that a new developer joining later can understand it fast without causing production regressions.
   - **Data scalability (database & storage)** — the system must handle growth to many users/records (professors, publications) without slowing down. The Zod schema is treated as the future DB schema/DTO source of truth now, so the eventual real database (indexing, read/write separation, caching layer like Redis if needed) maps cleanly onto it instead of requiring a redesign. Data-fetching logic must stay centralized/abstracted (`getUser()` pattern) to ease that migration.
   - **Server/infrastructure scalability** — depends on the hosting platform chosen at deploy time (Vercel, etc.), out of this project's direct control; assumption is that getting code scalability and data scalability right removes the main blockers, and infra scaling becomes mostly a deployment/ops concern rather than an architecture one.

   User explicitly directs that all decisions assume a **future migration to a full backend ("Option B": NestJS + database + JWT auth)**, even while current implementation stays static. When a more scalable option has no Lighthouse cost, prefer it (e.g. `astro-icon` over hand-written inline SVGs for icons — same zero-JS build-time output, but scales to any icon any of those hundreds of future users might need, without editing code per-user).

3. Security against attacks — no user-facing forms/uploads exist yet; when built (future publications upload form), must include file-type/size validation and auth.
   - **XSS rule (2026-09-27):** all data-driven text is rendered with `{variable}`, which Astro escapes automatically. `set:html` (or `innerHTML` in scripts) is forbidden unless the HTML is fully controlled or sanitized (e.g. DOMPurify) and justified with an inline comment. Reason: once content comes from the NestJS DB/API, an unescaped field would let injected scripts run in every visitor's browser. The future backend must also validate/sanitize on input (defense in depth).
.
4. Strict data validation at the input layer (this is why Zod/Content Collections replaced hand-written TypeScript interfaces).

5. **Responsive design** — mandatory on every component/page, mobile-first. Use Tailwind breakpoints `sm:`, `md:`, `lg:` (and up) for sizing/spacing/typography rather than fixed values. Mark responsive rules with a short inline comment in the component (e.g. `<!-- responsive: ... -->`) so intent stays visible. Workflow order: (1) build/validate the base (unprefixed = mobile) styles first, (2) only then layer `sm:`, `md:`, `lg:` (and up) where the layout actually needs to change at that breakpoint — no breakpoint is added speculatively.


Deferred scaling options (documented, not started):
- **Decap CMS** (git-based headless CMS, no backend) — for professor self-service editing without touching code.
- **NestJS + DB + auth** — full backend, for true multi-tenant self-service or a publications upload form.



## 4. Data Layer (Content Collections)

- `src/content.config.ts`
  - Defines the `user`, `legal` and `publications` collections.
  - Uses the `glob` loader (`user`, `legal`) and the `file` loader (`publications`).
  - Must remain at this exact path: `src/content.config.ts`.
  - Uses Zod for data validation.
  - Do NOT use the legacy Content Collections configuration.

- `src/content/user/profile.json`
  - Contains the professor's profile data.
  - Currently contains a single profile entry with id `profile`.
 - Real client data is present in this file.
    ### `teaching`: categoría grado / postgrado
    - Nuevo campo obligatorio en cada entrada de `user.teaching`: `category: z.enum(['grado', 'postgrado'])`.
    - Obligatorio (no `.optional()`): una asignatura sin categoría no saldría en ninguna lista, así que Zod rompe el build en vez de ocultarla.
    - `z.enum` en vez de `z.string()`: valores cerrados que mapean a un enum de columna en la BD futura (NestJS).
    - Se quitó el sufijo "- MÁSTER" de `subject` (ahora lo expresa `category`) y los `"role": ""` vacíos.
    - `bio` renombrado a `shortBio` (`z.string().max(150)`), pareja explícita con `longBio`. `ProfileHeader.astro` actualiza su `Pick<…>`.


`src/lib/getUser.ts`
  - Provides a centralized access point for the user profile data.
  - Uses Astro's `getEntry()` internally.
  - Pages should call `getUser()` rather than duplicating the data-access logic.
  - This abstraction is intentional and should make a future migration from Astro Content Collections to a real API easier.

  `src/lib/boldSegments.ts`
  - Helper de presentación: convierte un texto con marcas `**negrita**` en segmentos `{ text, bold }` (split con grupo de captura; lo marcado queda en posiciones impares).
  - Lo usa `Bio.astro` para pintar `<strong>` dentro de los párrafos de `longBio`, sin `set:html` (cumple la regla XSS de NFR 3): la función devuelve texto plano y el componente decide el HTML.
  - Formato elegido por compatibilidad con CMS: Decap y la mayoría de headless guardan el texto enriquecido como Markdown (`**`), así que no habrá migración de datos.
  - Limitación conocida: solo entiende negrita. En la fase CMS (cursiva, enlaces, listas) se sustituye por un renderizador Markdown completo + sanitizador en este mismo punto, sin tocar JSON ni componentes.
  - Reutilizable en otros componentes (Teaching, Research) si necesitan negrita.


  - **`socials` and `links` were merged into a single unified `links` array** (see "Links data model" below) — the old two-array split (icons vs buttons) was dropped in favor of one array plus per-component id-based selection.
  ### Links data model (unified `links` array)

`profile.json`'s old separate `socials` (icons) and `links` (buttons) arrays were merged into ONE `links` array, each entry shaped as:
```json
{ "id": "linkedin", "name": "LinkedIn", "url": "https://...", "icon": "linkedin" }
```
- `id` — stable identifier per link (also lets components select by id; doubles as the future DB primary key, same convention as the `id` of each entry in the `publications` collection).
- `name` — display text (renamed from the old `title`/`name` split for consistency).
- `url` — external URL or internal path (`/projects`); `LinkButton`/`SocialIcons` detect external vs internal via `url.startsWith('http')`.
- `icon` — optional icon identifier resolved by `astro-icon` (`mdi:` set) or a local SVG in `src/icons/` (see below).

The decision was to keep `profile.json`/Zod schema minimal (no per-link display metadata) and instead let each consuming component decide, Internally, which `id`s it renders (see "Component-level id filtering" below). This keeps the data shape simple while still being CMS-ready: a future CMS only needs to feed a component a list of ids (e.g. from checkboxes), it doesn't need to write back into every link's own record.

- `longBio: z.array(z.string().trim().min(1)).min(1)` — bio larga, un string por párrafo. El `.min(1)` interno rechaza párrafos vacíos y el externo exige al menos un párrafo. Separado de `bio` (máx. 150, bio corta del `ProfileHeader`). Se eligió array en JSON en vez de Markdown por escalabilidad: mapea directo a una columna `text[]`/JSON en el futuro backend. Contenido actual: lorem ipsum provisional.

### Component-level id filtering (resolved — props-based, no longer hardcoded)

`SociaLinksIcons.astro` (replaces `SocialIcons.astro`, deleted) receives the **entire** `links` array plus an explicit `ids: string[]` prop from whichever page/component calls it — the id list is no longer a hardcoded constant inside the component:
```ts
export interface Props {
  socials: LinkItem[];
  ids: string[];       // required — decided by the caller, every time
  showLabels?: boolean; // false (default) = icon-only; true = pill with icon + name
}
const filtered = ids
  .map((id) => socials.find((social) => social.id === id))
  .filter((social): social is LinkItem => Boolean(social)); // order follows \
  ```


### `publications` Collection (decisions of October 4–6, 2026)

Separate collection from `user`, loaded with `file('src/content/publications/publications.json')` (one JSON array, one object per publication; 57 as of 2026-10-06).

**Files**
- `src/lib/getPublications.ts`: single entry point. Throws if empty, derives `year` and `href` (DOI first, else `url`), sorts by `date` desc then `id` desc.
- `src/components/Publications.astro`: list, DOI/URL button, "Citar" button and shared citations `<dialog>`.
- `src/pages/api/citations/[id].json.ts`: static endpoint, one citations JSON per publication.

**Schema (Zod)**
- `id`: `pub-YYYY-NNNNN`, unique and stable. `date`: `YYYY-MM`, not in the future.
- `authors[]`: `isMe` only for names in `MY_NAMES` (accentless variants accepted: the name is kept as each journal published it). Bold with `<b>`, never `set:html`.
- `doi` or `url` (when there is no DOI).
- `citations`: `apa` required; `vancouver`, `bibtex`, `ris` optional. All reject mojibake; BibTeX and RIS have format checks. Stored pre-formatted, as obtained from the DOI.

**Key decisions**
- Separate collection: each object = future row of a `publications` table; on migration to NestJS only `getPublications.ts` changes.
- Rule: the schema holds what is stored; `getPublications` holds what is derived.
- `file()` over `glob()`: easiest to maintain; `glob()` reserved for a future CMS. A duplicate `id` only warns and loses an entry: check ids when adding publications.

### Citations modal (decision of October 6, 2026)

"Citar" opens one shared native `<dialog>` with APA, Vancouver, BibTeX and RIS, each with a "Copiar" button (copy & paste only, no download).

**Static endpoint `src/pages/api/citations/[id].json.ts`**
- In `src/pages` because only files there become URLs (`src/content` is not shipped).
- `getStaticPaths()` + `getPublications()` → one `dist/api/citations/{id}.json` per publication. No SSR.
- `api/` mirrors the future NestJS route `GET /publications/:id/citations`; on migration only the fetch URL changes.

**Runtime flow**
1. Build: list HTML without citations + one citations JSON per publication (keeps the page light).
2. "Citar" → `showModal()` → `fetch` of that publication's JSON (cached per id) → rendered with `textContent` (XSS rule).
3. "Copiar" → `navigator.clipboard.writeText()` (needs https or localhost) → "¡Copiado!" + `role="status"` for screen readers.

### Architectural decision

The current implementation uses Astro Content Collections for static, build-time data.

The data-access layer must remain centralized so that it can later be replaced by API calls when the project migrates to the planned backend architecture (`NestJS + database + JWT authentication`).

Zod is the source of truth for data validation and should remain aligned with the future data model.



5. Static Assets
public/images/avatar.jpg — profile photo
public/documents/cv.pdf — CV (renamed from earlier "pdfs" convention). Referenced in JSON as "cv": "/documents/cv.pdf", resolved by <iframe src={user.cv}> on a planned /cv page (not yet built) for inline viewing, not direct download.
public/documents/publications/ — planned location for individual article PDFs (none uploaded yet; copyright check pending before adding real publisher PDFs).


6. Components (src/components/)
ProfileHeader.astro — renders avatar, name, role, university, bio.

## ProfileHeader.astro

- Location: `src/components/ProfileHeader.astro`
- Displays the user's avatar, name, role, university, and bio.
- Receives the user data through component props.
- The props type is derived from Astro's generated `CollectionEntry` type rather than using a manually defined TypeScript interface.
- The avatar is the page's LCP element, so it uses `loading="eager"` and `fetchpriority="high"`.
- The component is currently used by `src/pages/index.astro`.
Props type sourced from the auto-generated CollectionEntry type (not a hand-written interface) — consistent with the decision to remove manual TS interfaces in favor of Zod-derived types.

SociaLinksIcons.astro — reemplaza a SocialIcons.astro (borrado). Props { socials: LinkItem[]; ids: string[]; showLabels?: boolean }.
- `ids` ya no es un array hardcodeado dentro del componente: es obligatorio y lo decide cada vista que lo llama (`index.astro` pasa un subconjunto para el home solo-ícono; `Sidebar.astro` pasa otro subconjunto con nombre visible). Esto reemplaza el patrón "TEMPORARY hardcoded id list" descrito antes en la sección 4 — ya quedó resuelto de forma permanente vía props, no vía CMS futuro.
- El orden de aparición sigue el orden del array `ids` (se resuelve con `ids.map(id => socials.find(...))`, no con `.filter()`, para que reordenar `ids` reordene la UI sin tocar `profile.json`).
- `showLabels` (default `false`): `false` renderiza solo el círculo del ícono (usado en `index.astro`, home); `true` renderiza una píldora `w-full` con ícono + nombre lado a lado (usado en `Sidebar.astro`, bloque de redes).
- Sigue usando `localIcons = ['researchgate', 'google-scholar']` para resolver íconos SVG locales (`src/icons/`) en vez de `mdi:` cuando corresponde — mismo patrón que `LinkButton.astro`.

LinkButton.astro — Props { title: string; url: string }. Renders a full-width pill button; detects external links via url.startsWith('http') to set target="_blank" rel="noopener noreferrer".

## Teaching.astro
- Separa `user.teaching` en dos listas en el frontmatter (`grado`, `postgrado`) con `.filter()` por `category`.
- Cada lista se pinta bajo su `<h2>` ("Grado", "Postgrado") y solo si tiene elementos.
- `formatPeriod(period)` en el frontmatter: `"2019-2023"` → `"2019-2023"`, `"2019-"` → `"2019-present"`. Sustituye la lógica inline del `.map()`.
- Sin archivos nuevos: el filtrado es presentación, no acceso a datos, por eso no va a `src/lib/`.

### Avatar (ProfileHeader y Sidebar)
- `rounded-2xl` en lugar de `rounded-full` en ambos componentes, por coherencia visual.
- ProfileHeader: `w-28 h-28 md:w-32 md:h-32 object-contain bg-white` (foto completa, sin recorte).
- Sidebar: `w-40 h-40 object-cover rounded-2xl`.

### Research.astro: timeline con línea central
- La lista de proyectos pasa a `<ol>` con una línea vertical central hecha con el pseudo-elemento `before:` (`left-1/2 w-0.5 bg-gray-200`), sin nodos extra en el DOM.
- Cada `<li>` es `grid grid-cols-2` y alterna lado con `odd:`/`even:`; punto azul `size-3 rounded-full bg-blue-600`.
- Fecha en `<time>`; la celda vacía de la alternancia lleva `aria-hidden="true"`.
- Solo CSS de Tailwind, cero JS (sin coste en Lighthouse).

7. Pages (src/pages/)
index.astro — the only page built so far (the bio.link-style landing):


Status: implementation just applied, not yet visually verified in-browser as of last message. Prior to this fix, this file had reverted to Astro's default scaffold (<h1>Astro</h1>) at least once during the session — regression risk to re-check.

8. Known Fixed Issues (context for future debugging)
Astro project was initially scaffolded inside an accidental nested .Empty/ folder — resolved by moving contents up and deleting the wrapper.
LegacyContentConfigError — required moving config from src/content/config.ts to src/content.config.ts and switching from type: 'data' to loader: glob(...).
InvalidContentEntryDataError — caused by schema/data field-name mismatch (links schema had name, JSON had title), an overly strict .url() validator on internal-path fields, and missing cv/publications fields in the JSON.
ProfileHeader.astro was missing its opening --- frontmatter fence and had a stray invalid \\ line — fixed.
PowerShell blocked npm due to default execution policy — resolved via Set-ExecutionPolicy -Scope CurrentUser RemoteSigned.
git push rejected (non-fast-forward, unrelated histories) — resolved via force push (single-owner repo, accepted risk).

9. Outstanding / Immediate Next Steps
Confirm index.astro currently renders the real landing page (not the Astro default) — run npm run dev and visually verify.
Fill placeholder values in profile.json (ORCID, GitHub URLs still "...").
Replace SocialIcons first-letter placeholder with real per-network icons.
Build BaseLayout.astro + NavBar.astro (sticky top bar) for internal pages, matching the reference screenshots shown (academic template with Home/Publications/Projects nav).
Build /cv.astro — embed user.cv PDF via <iframe>.
Build /publications.astro — iterate user.publications (currently empty); resolve copyright question before hosting any real publisher PDF (link to DOI instead if rights unclear).
Build /projects.astro and /about.astro (long-form bio) — not started.
Decide and configure repo visibility (private recommended given real personal data present).
Configure Vercel deployment (not yet connected/configured).
Plan cache-busting strategy for cv.pdf updates (versioned URL or Cache-Control header) — deferred to deployment-configuration phase.
Longer-term, not started: Decap CMS integration; NestJS+DB+auth backend migration; publications upload form (depends on backend).
- Terminar el toggle JS del sidebar (paso actual: reemplazar popover nativo por clases + script con transición de opacidad).
- Completar `BaseLayout.astro` (actualmente vacío) y conectarlo a las páginas existentes.
- `Bio.astro` tiene un `import Sidebar` sin usar y le falta el cierre `---` del frontmatter — revisar/limpiar.

10. ## Current status

- Landing page working in process.
- Visual check of `index.astro` pending.
- ORCID and GitHub pending.
- Social icons pending.
- BaseLayout + NavBar pending.
- `/cv` pending.
- `/publications` pending.
- `/projects` pending.
- `/about` pending.
- Vercel pending.

11. ## Architectural decisions

- The project is currently static.
- The architecture must facilitate a future migration to NestJS + DB + JWT.
- Zod is the source of truth for validation.
- Data access must remain centralized.
- Do not introduce a backend at this time.

## 12. Sidebar & Layout (BaseLayout.astro, Sidebar.astro)

src/layouts/BaseLayout.astro — estructura compartida de las páginas /aboutme/*: <slot name="sidebar" /> + <main> con el <slot /> por defecto.
 El <main> lleva md:ml-70 (= ancho del sidebar w-70) para que el sidebar fijo no tape el contenido desde md, y pt-16 en móvil para dejar hueco al botón hamburguesa.

src/components/Sidebar.astro — sidebar fijo (fixed inset-y-0 left-0 w-70) en 3 bloques separados por border-b:
* Perfil: nombre, foto, role, departamento, universidad, dirección.
* Navegación: links internos con rutas absolutas (/, /aboutme/bio, /aboutme/teaching, /aboutme/research). 
* Redes/CV: SociaLinksIcons con showLabels (ids rg_link, email_link, gs_link, cv_link).

Responsive (decisión: botón nativo + script, sustituye al Popover API)
Breakpoint: md (768px). Por debajo, sidebar oculto + botón hamburguesa; desde md, sidebar siempre visible y botón oculto. (Alternativa documentada: breakpoint propio de 750px vía @theme { --breakpoint-nav: 46.875rem; } en global.css.)

Ocultar/mostrar: el <aside> lleva -translate-x-full transition-transform duration-300 + md:translate-x-0. El JS solo alterna -translate-x-full; la clase md: se emite después en el CSS y gana en pantallas grandes, así que el script no necesita conocer el breakpoint.

Botón: <button id="sidebar-toggle" type="button"> con aria-controls="mySidenav" y aria-expanded (fuente del estado abierto/cerrado), md:hidden, fixed top-4 right-4.
Overlay: <div id="sidebar-overlay"> fixed inset-0 bg-black/40, hidden md:hidden; el JS alterna hidden.
Capas z-index: overlay z-30 < sidebar z-40 < botón z-50. Sin z-40 en el sidebar el overlay lo tapaba y bloqueaba los clics (bug encontrado y corregido).

Script (<script> de Astro, módulo): usa addEventListener, nunca onclick="..." inline — las funciones de un módulo no son globales (ReferenceError). Una única función setOpen(open) actualiza clases y atributos ARIA. Cierra con: clic en el botón, clic en el overlay, tecla Escape, clic en un enlace del sidebar.