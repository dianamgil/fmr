# PROJECT_CONTEXT — Web personal académica/profesional (estilo bio.link)

**Borrador** generado el 2026-10-12 a partir del commit `7ae762b` de `dianamgil/fmr

**Regla de trabajo:** este proyecto se hace paso a paso, siguiendo las instrucciones de Diana. Claude actúa solo como consultor de solo lectura (ver `CLAUDE.md`); todo el código lo integra programador manualmente en VS Code.

---

## 1. ¿Qué es el proyecto y objetivo?

- **Nombre:** FMR_webmic (`package.json`)
 **Repo:** `dianamgil/fmr`. Web personal del profesor Fernando Martín Rivera (Universitat de València).
- **Cliente:** profesor universitario u otros profesionales (ingenieros, investigadores) que necesiten una web personal-profesional.
- **Objetivo:**
  - Corto plazo: web estática, rápida y segura con landing estilo bio.link (avatar, nombre, iconos sociales, botones apilados) que se expande a un sitio académico multipágina (Bio, Docencia, Publicaciones, Investigación, CV, proyectos actuales,  etc.) con layout y sidebar compartidos.
  - Medio/largo plazo: convertirlo en una **plantilla reutilizable**  y, en el futuro, en una plataforma multi-tenant para **profesionales** con backend propio..


## 2. Stack técnico

**Decisiones tomadas:**

| Pieza | Decisión | Motivo |
|---|---|---|
| Framework | Astro `^7.3.2`, salida 100 % estática, sin SSR ni adapter | Lighthouse, cero JS por defecto, hosting barato |
| Estilos | Tailwind CSS v4 vía `@tailwindcss/vite` (no CDN, no `tailwind.config` legacy). Entrada: `src/styles/global.css` con `@import "tailwindcss";` | Plugin oficial, CSS purgado en build |
| Validación de datos | Zod con la Content Layer API (`loader: glob()` / `file()` en `src/content.config.ts`) | El esquema Zod es la fuente de verdad y el futuro DTO/esquema de BD |
| Iconos | `astro-icon` + `@iconify-json/mdi`; SVG locales en `src/icons/` (researchgate, google-scholar, orcid) | Mismo coste cero de JS que un SVG inline, pero escala a cualquier icono sin tocar código |
| Lenguaje | TypeScript (solo tipado; se elimina en build) | Cero coste en runtime |
| Node | `>=22.12.0` (`engines` en `package.json`) | Requisito de Astro 7 |
| Calidad de código | ESLint `^10.12.0` (flat config) + `@eslint/js` `^10.0.1` + `eslint-plugin-astro` `^3.2.1` + `typescript-eslint` `^8.71.1`, en `devDependencies` | Detecta errores en `.astro` y `.ts` antes del build; no llega al bundle (cero coste en Lighthouse) |
| Hosting | **Sin decidir:** se valoran Vercel y Cloudflare Pages (ambos con deploy estático); **no configurado aún** | El build es 100 % estático (`dist/`), así que sirve en cualquiera de los dos sin adapter |
| Backend / BD / auth | **No existen.** Todo se genera en build | Migración futura prevista: NestJS + BD + JWT  |

Dependencias actuales (todas de producción): `astro`, `@tailwindcss/vite`, `tailwindcss`, `astro-icon`, `@iconify-json/mdi` De desarrollo: `eslint`, `@eslint/js`, `eslint-plugin-astro`, `typescript-eslint` (instaladas en local, pendientes de subir a `main` a fecha de este borrador). No se añaden dependencias nuevas sin necesidad justificada.

**Opciones de escalado aplazadas (documentadas, no iniciadas):**
- **NestJS + BD + auth** para multi-tenant real o un formulario de subida de publicaciones.

## 3. Arquitectura / estructura de carpetas
 
```text
fmr/
├─ astro.config.mjs            # integración astro-icon + plugin Vite de Tailwind
├─ CLAUDE.md                   # reglas del consultor (solo lectura, en español)
├─ PROJECT_CONTEXT_web.md      # este documento
├─ public/
│  ├─ documents/cv_fmartinr.pdf
│  └─ images/                  # avatar_fmr.webp, pub-*.png, images_small/*.webp
└─ src/
   ├─ content.config.ts        # colecciones + esquemas Zod (ruta obligatoria)
   ├─ content/
   │  ├─ user/profile.json                     # colección user (glob)
   │  ├─ publications/publications.json        # colección publications (file)
   │  ├─ projects/projectsresearch.json        # colección projects (file)
   │  └─ legal/privacy.md                      # colección legal (glob, Markdown)
   ├─ lib/                     # capa de acceso a datos (única puerta de entrada)
   │  ├─ getUser.ts  getPublications.ts  getProjects.ts
   │  └─ boldSegments.ts       # helper de presentación (**negrita** sin set:html)
   ├─ layouts/BaseLayout.astro # slot "sidebar" + <main> + Footer
   ├─ components/              # Bio, Dropdown, Footer, LinkButton, ProfileHeader,
   │                           # Publications, Research, Sidebar, SociaLinksIcons, Teaching
   ├─ icons/                   # SVG locales para astro-icon
   ├─ pages/
   │  ├─ index.astro           # landing bio.link (no usa BaseLayout)
   │  ├─ privacy_policy.astro
   │  ├─ aboutme/bio.astro  teaching.astro  publications.astro  research.astro
   │  └─ api/citations/[id].json.ts   # endpoint estático: un JSON de citas por publicación
   └─ styles/global.css
```

**WORKFLOW**
**Flujo de datos (regla obligatoria):
`src/content/**` → Zod (`content.config.ts`) → `src/lib/get*.ts` → página → componente (props) → HTML estático (`dist/`)

1. Datos (`src/content/**`): solo almacenan, sin lógica *analogía: despensa de datos*
2. Validación (`content.config.ts`): Zod valida en build; un dato inválido rompe el build. Es el futuro DTO de NestJS. *analogía: el control de calidad de los datos*
3. Acceso centralizado a los datos (`src/lib/get*.ts`):  Único archivo que importa funciones de `astro:content` (`getCollection` = todas las entradas, `getEntry` = una). Calcula derivados, ordena y exporta la función y su tipo (`Publication`, `Project`, …). *analogía: cocinero que entra en la despensa  para preparar e  importar los datos*
4. Página (`src/pages/**`): Importa `get*()` de `src/lib/` y pasa el resultado por props. No sabe de dónde salen los datos. *analogía: camarero no sabe donde estan los datos ni  prepararlos,  solo pide y entrega*
5. Componente (`src/components/**`): Solo pinta lo que recibe por props. Importa tipos, nunca datos. *analogía: emplatado no sabe de donde viene todo solo lo pone bonito*

Regla: solo `src/lib/` importa `astro:content`.

**Migración a NestJS**
Solo cambia el interior de `get*()`: de `getCollection` a `fetch` a la API + `schema.parse()` de la respuesta, para que los datos del backend sigan validados. El tipo de retorno no cambia; páginas y componentes no se tocan.