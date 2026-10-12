# PROJECT_CONTEXT — Personal academic/professional website (bio.link style)

**Working rule:** this project is built step by step, following Diana's instructions. Claude acts only as a read-only consultant (see `CLAUDE.md`); all code is integrated manually by the developer in VS Code.

---

## 1. What is the project and its goal?

- **Name:** FMR_webmic (`package.json`)
- **Repo:** `dianamgil/fmr`. Personal website of Professor Fernando Martín Rivera (Universitat de València).
- **Client:** university professors or other professionals (engineers, researchers) who need a personal/professional website.
- **Goal:**
  - Short term: a fast, secure static site with a bio.link-style landing page (avatar, name, social icons, stacked buttons) that expands into a multi-page academic site (Bio, Teaching, Publications, Research, CV, current projects, etc.) with a shared layout and sidebar.
  - Medium/long term: turn it into a **reusable template** and, eventually, a multi-tenant platform for **professionals** with its own backend.

## 2. Tech stack

**Decisions made:**

| Piece | Decision | Reason |
|---|---|---|
| Framework | Astro `^7.3.2`, 100% static output, no SSR, no adapter | Lighthouse, zero JS by default, cheap hosting |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` (no CDN, no legacy `tailwind.config`). Entry point: `src/styles/global.css` with `@import "tailwindcss";` | Official plugin, CSS purged at build time |
| Data validation | Zod with the Content Layer API (`loader: glob()` / `file()` in `src/content.config.ts`) | The Zod schema is the source of truth and the future DTO/DB schema |
| Icons | `astro-icon` + `@iconify-json/mdi`; local SVGs in `src/icons/` (researchgate, google-scholar, orcid) | Same zero JS cost as an inline SVG, but scales to any icon without touching code |
| Language | TypeScript (types only; stripped at build time) | Zero runtime cost |
| Node | `>=22.12.0` (`engines` in `package.json`) | Required by Astro 7 |
| Code quality | ESLint `^10.12.0` (flat config) + `@eslint/js` `^10.0.1` + `eslint-plugin-astro` `^3.2.1` + `typescript-eslint` `^8.71.1`, in `devDependencies` | Catches errors in `.astro` and `.ts` before the build; never reaches the bundle (zero Lighthouse cost) |
| Hosting | **Undecided:** Vercel and Cloudflare Pages are being considered (both with static deploys); **not configured yet** | The build is 100% static (`dist/`), so it runs on either without an adapter |
| Backend / DB / auth | **None.** Everything is generated at build time | Planned future migration: NestJS + DB + JWT |

Production dependencies: `astro`, `@tailwindcss/vite`, `tailwindcss`, `astro-icon`, `@iconify-json/mdi`. Development dependencies: `eslint`, `@eslint/js`, `eslint-plugin-astro`, `typescript-eslint` (added in `83baf9c`; config in `eslint.config.js`, script `npm run lint`). No new dependencies without a justified need.

**Deferred scaling options (documented, not started):**
- **NestJS + DB + auth** for real multi-tenancy or a publication upload form.

## 3. Architecture / folder structure

```text
fmr/
├─ astro.config.mjs            # astro-icon integration + Tailwind Vite plugin
├─ CLAUDE.md                   # consultant rules (read-only, replies in Spanish)
├─ PROJECT_CONTEXT_web.md      # this document
├─ public/
│  ├─ documents/cv_fmartinr.pdf
│  └─ images/                  # avatar_fmr.webp, pub-*.png, images_small/*.webp
└─ src/
   ├─ content.config.ts        # collections + Zod schemas (mandatory path)
   ├─ content/
   │  ├─ user/profile.json                     # user collection (glob)
   │  ├─ publications/publications.json        # publications collection (file)
   │  ├─ projects/projectsresearch.json        # projects collection (file)
   │  └─ legal/privacy.md                      # legal collection (glob, Markdown)
   ├─ lib/                     # data access layer (single entry point)
   │  ├─ getUser.ts  getPublications.ts  getProjects.ts
   │  └─ boldSegments.ts       # presentation helper (**bold** without set:html)
   ├─ layouts/BaseLayout.astro # "sidebar" slot + <main> + Footer
   ├─ components/              # Bio, Dropdown, Footer, LinkButton, ProfileHeader,
   │                           # Publications, Research, Sidebar, SociaLinksIcons, Teaching
   ├─ icons/                   # local SVGs for astro-icon
   ├─ pages/
   │  ├─ index.astro           # bio.link landing (does not use BaseLayout)
   │  ├─ privacy_policy.astro
   │  ├─ aboutme/bio.astro  teaching.astro  publications.astro  research.astro
   │  └─ api/citations/[id].json.ts   # static endpoint: one citations JSON per publication
   └─ styles/global.css
```

### Data flow
`src/content/**` → Zod (`content.config.ts`) → `src/lib/get*.ts` → page → component (props) → static HTML (`dist/`)

1. Data (`src/content/**`): storage only, no logic. *Analogy: the pantry.*
2. Validation (`content.config.ts`): Zod validates at build time; invalid data breaks the build. It is the future NestJS DTO. *Analogy: quality control.*
3. Centralized data access (`src/lib/get*.ts`): the only files that import functions from `astro:content` (`getCollection` = all entries, `getEntry` = one). Computes derived fields, sorts, and exports the function and its type (`Publication`, `Project`, …). *Analogy: the cook, who takes from the pantry and hands out the tray.*
4. Page (`src/pages/**`): imports `get*()` from `src/lib/` and passes the result via props. It does not know where the data comes from. *Analogy: the waiter, who neither knows where the food is stored nor how to cook it; they just order and deliver the tray.*
5. Component (`src/components/**`): only renders what it receives via props. Imports types, never data. *Analogy: plating; it does not know where anything came from, it just makes it look good.*

**Mandatory rule:** only `src/lib/` imports functions from `astro:content` (`getCollection`, `getEntry`, `render`). Pages never read collections directly, and components never import from `astro:content`, not even types.

**Data vs. types**
- `import { getEntry } from 'astro:content'` → a real function: it fetches data at build time. Only in `src/lib/`.
- `import type { User } from '../lib/getUser'` → only describes the shape of the data (autocomplete and errors in VS Code); it disappears at build time and adds nothing to the site. Components take their types from `src/lib/` (`User`, `LinkItem`, `Publication`, `Project`), never from `astro:content`.
- Analogy: `getEntry` is the food; the type is the label on the container saying what is inside.

**Documented exceptions**
- `src/content.config.ts` imports `defineCollection` and `z` from `astro:content`: it is where the collections are defined (step 2).
- `src/components/Publications.astro` runs a browser `fetch` to `/api/citations/{id}.json` (citation modal). It is the only data read client-side; when migrating, only that URL changes.
- **Pending:** `src/pages/privacy_policy.astro` uses `getEntry`/`render` directly → create `getLegal()` in `src/lib/` (bug 4). After the migration, the Markdown will come from the API and must be converted to **sanitized** HTML (XSS rule).

**Migration to NestJS**
Only the inside of `get*()` changes: from `getCollection` to a `fetch` to the API + `schema.parse()` on the response, so backend data stays validated. The return type does not change; pages and components are not touched.

### 3.1 Collections (Content Layer)

- **`user`** (`glob`, `src/content/user/*.json`, one entry: `profile`). Fields: `name`, `role`, `university`, `universityLink` (url), `avatar`, `shortBio` (max. 150), `longBio` (array of paragraphs, min. 1), `email`, `cv`, `skills[]` (default `[]`), `teaching[]`, `links[]`.
  - `teaching[]`: `period` (`YYYY-` or `YYYY-YYYY`, years 1950–2100, end ≥ start), `subject`, `role?`, `category: z.enum(['grado','postgrado'])` (required; maps to a column enum in the future DB), `university`.
  - `links[]` (unified model, formerly `socials` + `links`): `{ id, name, url, icon? }`. `id` is stable and will be the future PK. Each component chooses which `ids` it renders (see 3.3).
  - `longBio` is an array in JSON (not Markdown) because it maps directly to a `text[]`/JSON column. It already contains real text (no lorem ipsum).
- **`publications`** (`file`, 57 entries as of 2026-10-06). `id` `pub-YYYY-NNNNN`; `date` `YYYY-MM`, not in the future; `authors[]` with `isMe` only for variants in `MY_NAMES`; `doi` (regex) or `url`; `journal`; `abstract?`; `image?`; `citations` (`apa` required; `vancouver`, `bibtex`, `ris` optional; all reject mojibake; BibTeX and RIS with format validation).
- **`projects`** (`file`, `projectsresearch.json`). `id` `proj-YYYY-NNN`; `title`, `code`, `funder`, `participants?`, `role`, `start`, `end?` (no `end` = "present"); refine `end >= start`.
- **`legal`** (`glob`, Markdown with `title`, `updatedAt` frontmatter). Rendered with `render()` at build time (no `set:html`).

**Rule:** the schema holds what is stored; `get*.ts` computes what is derived (`year`, `href`, `displayPeriod`, ordering).

### 3.2 Data access layer (`src/lib/`)

- `getUser()` — `getEntry('user','profile')`; throws if it does not exist.
- `getPublications(limit?)` — throws if empty; derives `year` and `href` (DOI first, otherwise `url`); sorts by `date` desc, then `id` desc. Exports the `Publication` type.
- `getProjects()` — throws if empty; derives `displayPeriod`; sorts by `start` desc. Exports the `Project` type.
- `boldSegments(text)` — converts `**bold**` into `{ text, bold }` segments. Bold only; in the CMS phase it will be replaced at this same point by a Markdown renderer + sanitizer.

### 3.3 Key components

- **ProfileHeader** — avatar (LCP element: `loading="eager"`, `fetchpriority="high"`), name, role, university, `shortBio`. Props typed with `Pick<User, …>` (`User` exported by `src/lib/getUser.ts`).
- **SociaLinksIcons** — props `{ socials, ids, showLabels? }`. Filters with `socials.filter((s) => ids.includes(s.id))`: shows only the requested `ids`, in `profile.json` order (decision: kept as is; to reorder, change the order in the JSON). `showLabels=false` → icon only (home); `true` → pill with icon + name (sidebar). Local icons via `localIcons`.
- **LinkButton** — full-width pill button; external links (`url.startsWith('http')`) get `target="_blank" rel="noopener noreferrer"`.
- **Dropdown** — "About Me" menu on the landing page, using native `<details>/<summary>` + `<script>`.
- **Sidebar** — fixed `w-75` (300 px), 3 blocks (profile / navigation / socials-CV with ids `rg_link`, `email_link`, `gs_link`, `cv_link`, `orcid_link`) + a link back to home. Responsive: below `md` it is hidden with `-translate-x-full` and opens with a native hamburger button (`aria-expanded`, `aria-controls`), `bg-black/40` overlay; layers: overlay `z-30` < sidebar `z-40` < button `z-50`. Module script with `addEventListener` and a single `setOpen(open)`; closes via the button, overlay, Escape, or a link click.
- **BaseLayout** — `<slot name="sidebar" />` + `<main class="md:ml-75 …">` + `<Footer />` (footer also `md:ml-75`; **pending commit**: `main` still has `md:ml-70`, see bug 10). The margin must always match the sidebar width. Used by `/aboutme/*` and `/privacy_policy`.
- **Teaching** — splits `teaching` into Grado / Postgrado (presentation filter in the frontmatter, not in `lib/`); `formatPeriod("2019-")` → `"2019-present"`.
- **Research** — `<ol>` timeline with a center line (`before:`), one column on mobile and `odd:/even:` alternation from `md`; CSS only.
- **Publications** — list with authors (`isMe` in `<b>`), DOI/URL button, "Cite" button and a single shared `<dialog>`.
- **Footer** — copyright + link to the privacy policy.

### 3.4 Citation modal (static endpoint)

1. Build: list HTML without citations + `dist/api/citations/{id}.json` per publication (`getStaticPaths` + `getPublications`). No SSR.
2. "Cite" → `showModal()` → `fetch` of that publication's JSON (cached by id) → rendered with `textContent`.
3. "Copy" → `navigator.clipboard.writeText()` (requires https or localhost) → "Copied!" with `role="status"`.
- The `api/` route mirrors the future NestJS `GET /publications/:id/citations`: when migrating, only the `fetch` URL changes.

### 3.5 Static assets

- `public/images/avatar_fmr.webp` — profile photo.
- `public/documents/cv_fmartinr.pdf` — CV (linked from `links` with id `cv_link`).
- `public/images/pub-*.png` (39 PNGs, ~18 MB total) and `images_small/` — publication images. **[REVIEW]** no data uses them yet (`publications.json` has no `image` field filled in).

## 4. Code conventions

- **Imports:** relative paths (`../../lib/getUser`); no aliases in `tsconfig`. Usual order: layout → components → `lib` → styles. Types via `import type` from `src/lib/` (never from `astro:content`).
- **Data:** pages call `get*()`; components receive data via props and do not import collections. No manual TS interfaces duplicating Zod: types are exported from `src/lib/` (`User`, `LinkItem`, `Publication`, `Project`, derived with `ReturnType<typeof get*>`); components never import from `astro:content`.
- **Styling:** Tailwind utilities only in markup; `global.css` contains only `@import "tailwindcss";`. Mobile-first: unprefixed classes first, then `sm:`/`md:`/`lg:` only when the design changes. Every responsive rule gets its `<!-- responsive: ... -->` comment.
- **Template security:** all dynamic text via `{variable}`; `set:html` / `innerHTML` forbidden unless the HTML is controlled or sanitized and justified with a comment. In scripts, `textContent` and `addEventListener` (never `onclick="..."`).
- **Accessibility:** native HTML first (`<button>`, `<dialog>`, `<details>`, `<time>`); ARIA attributes only for state (`aria-expanded`, `aria-controls`, `role="status"`).
- **Data IDs:** stable and formatted (`pub-YYYY-NNNNN`, `proj-YYYY-NNN`, `*_link`); designed as future PKs.
- **Comments:** in Spanish, short, explaining the why.
- **Lint:** code must pass ESLint with no errors before every commit (recommended rules from `@eslint/js`, `typescript-eslint` and `eslint-plugin-astro`).

## 5. Constraints and decisions made

### 5.1 Priority criteria (strict order)

When two goals conflict, the lower number wins.

1. **Correctness and maintainability** — the code does what it should and is easy to understand. Independent components: changing a button's design never touches data logic; a new developer should understand the structure quickly without breaking production.
2. **Security** (preventing vulnerabilities and leaks)
   - XSS rule (2026-09-27): dynamic text always via `{variable}`; `set:html`/`innerHTML` forbidden unless the HTML is controlled or sanitized (e.g. DOMPurify) and justified. Reason: once data comes from the NestJS API, an unescaped field would run scripts for every visitor. The backend will also validate/sanitize on input (defense in depth).
   - Strict validation at the input layer: Zod breaks the build on invalid data (which is why it replaced manual TS interfaces).
   - External links with `rel="noopener noreferrer"`.
   - No forms or uploads yet; when they exist (publication upload), they will require file type/size validation and authentication.
   - Do not upload copyrighted PDFs; consider making the repo private (it contains real data).
3. **Scalability and architectural alignment** (with this document) — "scalable" means being able to grow into a multi-tenant platform for hundreds of professionals, not copy-pasting a template per client:
   - *Code:* modular structure, independent components.
   - *Data:* the Zod schema is the future DB schema/DTO; access centralized in `src/lib/` (`getUser()` pattern), so the real DB (indexes, Redis-style cache if needed) fits in without a redesign.
   - *Infrastructure:* depends on the hosting (Vercel or Cloudflare Pages, still undecided); with code and data done right, it becomes an operations concern.
   - Every decision assumes the future migration to **NestJS + DB + JWT**, even though the site is static today. Do not introduce a backend now.
4. **Stack best practices** — Content Layer API (no legacy collections, `content.config.ts` at that exact path), Tailwind v4 via the Vite plugin, `astro-icon` instead of inline SVG, `.astro` components without JS unless needed (module scripts).
5. **Mobile-first responsive design** — mandatory in every component/page; Tailwind breakpoints instead of fixed values; no speculative breakpoints; `<!-- responsive: ... -->` comment.
6. **Lighthouse 100** (without compromising 1–4) — zero JS by default, avatar LCP with `eager` + `fetchpriority="high"`, heavy content on demand (citations via static JSON). If a more scalable option costs nothing in Lighthouse, it is preferred.
7. **Simplicity over complexity** — the simplest solution that meets 1–6; no new dependencies unless necessary.

### 5.2 Current architectural decisions

- Static site; no backend, DB, or auth for now.
- Zod is the source of truth for validation and must stay aligned with the future data model.
- Data access stays centralized in `src/lib/`.
- One collection per entity (each object = a future table row): `user`, `publications`, `projects`, `legal`.
- `file()` for single-JSON collections (easier to maintain); `glob()` reserved for a future CMS. Note: a duplicate `id` in `file()` only warns and drops an entry; check ids when adding data.
- Sidebar: native button + script (replaces the Popover API), `md` breakpoint (768 px).
- Pre-formatted citations stored in JSON and served via a static endpoint.
- Rich bio text in `**Markdown**` format (compatible with Decap/headless CMS).

## 6. Git and workflow

- **Repo:** GitHub `dianamgil/fmr`, main branch `main`. Local development on Windows (PowerShell + VS Code with the official Astro extension) at `C:\Users\d_mgi\Desktop\Portafolio_DMG\FMR_web\src\fmr`.
- **Roles:** Claude analyzes and proposes (2–3 alternatives with pros and cons, ready-to-copy snippets); Diana decides, integrates the code, and manages git.
- **Recommended flow per task:**
  1. Update: `git switch main` → `git pull`.
  2. Short branch per task: `git switch -c feat/<scope>` (or `fix/`, `docs/`, `refactor/`, `chore/`).
  3. Small change → validation from section 8.1 → `git status` → `git add <files>` → `git commit`.
  4. **Commits:** Conventional Commits in English: `type(scope): description` with `feat`, `fix`, `refactor`, `docs`, `chore`, etc. (e.g. `feat(teaching): add category …`). One logical change per commit; changes to this document with `docs(project-context): …`. Do not mix `feat` and `refactor` in the same commit.
  5. Before bringing it to `main` → validation from section 8.2 → `git switch main` → `git merge <branch>` → `git push`. View history: `git tree`. **Note:** `git tree` is not a built-in git command; it is a custom alias configured in local git. On a machine without that alias, use `git log --oneline --graph`.
  6. If a decision or the project state changes, update this document in the same work block.
- **Forbidden without an explicit request:** `git reset --hard`, `git push --force`, deleting branches.
- **`.gitignore`:** `dist/`, `.astro/`, `node_modules/`, `.env*`, `AGENTS.md`. Do not commit secrets or copyrighted PDFs.

## 7. Pending tasks

- Visual check of every page in the browser (mobile and desktop) and a Lighthouse audit.
- Decide what to do with the bugs in 7.1.
- Use or remove the publication images (and convert them to WebP if used).
- Decide the repo visibility (private is recommended because of the real data).
- Choose hosting (Vercel or Cloudflare Pages), configure the deploy, and define the CV caching strategy (versioned URL or `Cache-Control`).
- Deferred (do not start without instruction): `/cv` page with `<iframe>`, `/projects`, `/about`, Decap CMS, NestJS + DB + JWT backend, publication upload form.

### 7.1 Bugs and inconsistencies found [REVIEW]

1. **`projects`: inconsistent date format.** `YEAR_MONTH` in `content.config.ts` requires `YYYY/MM` (with a slash; the data uses `"2020/07"`), but the error message and the comment say `YYYY-MM`, and `publications.date` uses a hyphen. Also, the `20[5-9]\d` group is redundant (already covered by `20\d{2}`) and 19xx years are not allowed.
2. **Hardcoded professor name** in `Footer.astro` and in the `index.astro` footer ("Fernando Martín Rivera") instead of `user.name`. Breaks reuse as a template.
3. **`index.astro` duplicates its own footer** instead of using `Footer.astro` (and does not link the privacy policy).
4. **`privacy_policy.astro` reads the `legal` collection directly** with `getEntry` instead of going through a helper in `src/lib/` (exception to the centralized access rule).
5. **Field outside the schema:** the `facebook_link` entry in `profile.json` has `"displayAs": ["icon"]`, which Zod silently drops (leftover from the previous model).
6. **Unused publication images** (~18 MB of PNGs in `public/images/`): they are published in the deploy even though nothing references them; their names do not match the current ids.
7. Minor typos in `content.config.ts`: the variable `projectsColletion`, and the comment for the projects section says "COLECCIÓN DE PUBLICACIONES".
8. **`astro check` reports 1 error** in `Publications.astro:42`: a `// … -->` comment written inside the HTML (not visible on the page, but it breaks type checking). Use `<!-- … -->`.
9. **Deprecation warning:** importing `z` from `astro:content` is marked deprecated in Astro 7 (warnings in `astro check`). Check the Astro guide for the recommended import.
10. **Sidebar covers 20 px of content from `md` up:** `<aside>` uses `w-75` (300 px) while `BaseLayout`/`Footer` use `md:ml-70` (280 px). Agreed fix: `md:ml-75` in both. **Pending commit.**

## 8. How to validate changes

### 8.1 On every commit

| Step | Command / action | What to check |
|---|---|---|
| Install (only if `package-lock.json` changed) | `npm ci` | Installs exactly what is in the lock file |
| Development | `npm run dev` | `http://localhost:4321` loads with no errors in the terminal |
| Lint | `npm run lint` | 0 errors |
| Build | `npm run build` | Ends with `Complete!`; Zod rejects no data |
| Visual review | Browser | The page you touched looks right on mobile and desktop |
| Security | Search for `set:html` and `innerHTML` in `src/` | None new |

### 8.2 Before releasing to production

**Code quality**

| Area | Command / action | Pass criterion |
|---|---|---|
| Lint | `npm run lint` | 0 errors |
| Types | `npx astro check` | 0 errors. Not installed yet: requires `npm i -D @astrojs/check typescript@6` (fails with TypeScript 7, which does not expose the API `astro check` uses). Currently reports 1 known error (bug 8) |
| Production build | `npm run build` | No new errors or warnings |
| Dependencies | `npm audit --omit=dev` | No *high* / *critical* vulnerabilities in production |
| Data | Review build warnings | No duplicate `id` warnings (with `file()` an entry is silently lost) |

**Functional, on `npm run preview`** (the real build, not dev mode)

| Area | What to check |
|---|---|
| Responsive | Mobile (≈375 px), `md` (768 px) and desktop (≥1280 px); no horizontal scroll |
| Sidebar | Opens/closes with the button, overlay, Escape and links; always visible from `md` up |
| Navigation | Every internal link leads to an existing page (no 404) |
| External links | DOI, ResearchGate, Scholar, ORCID, LinkedIn open correctly and have `rel="noopener noreferrer"` |
| Citations | "Cite" opens the modal, all 4 formats load and "Copy" works |
| CV and legal | The CV PDF opens; the privacy policy shows the correct date |
| Console | No errors or warnings in DevTools → Console, on every page |
| Network | DevTools → Network: no 404 resources |
| Browsers | Chrome, Firefox and Safari/iOS (or a real phone) |

**Accessibility**

| Area | What to check |
|---|---|
| Keyboard | Everything is usable with `Tab`, `Enter` and `Escape`; focus order is logical |
| Focus | Always visible; when the modal or sidebar closes, focus returns to the button that opened it |
| Semantics | A single `<h1>` per page; images with `alt`; buttons with text or `aria-label` |
| Contrast | Lighthouse → Accessibility shows no contrast warnings |

**Performance and SEO** (Lighthouse in an incognito window, **mobile** mode, on `npm run preview`)

| Area | Pass criterion |
|---|---|
| Performance / Accessibility / Best Practices / SEO | 100 as the target; never lower than the previous version |
| LCP | Avatar with `loading="eager"` + `fetchpriority="high"`; LCP < 2.5 s |
| Weight | Images in WebP and properly sized; nothing unused in `public/` (check `dist/` to see what gets published) |
| Meta | Every page has its own `<title>` and `<meta name="description">`, `lang="es"` |

**Security**

| Area | What to check |
|---|---|
| XSS | No new `set:html` / `innerHTML`; dynamic text via `{variable}` or `textContent` |
| Secrets | No keys or `.env` in the commit (`git diff --staged` before committing) |
| Personal data | Only data the professor has approved for publication; no copyrighted PDFs |
| Headers | When configuring hosting: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` **[pending hosting]** |

**After the deploy**

- Open the public URL (not localhost) and repeat: home, one `/aboutme/*` page, the citation modal and the CV.
- If something fails: roll back to the previous version from the hosting dashboard and fix it on a branch.

## 9. Current state / latest checkpoint

> Updated every time this document is updated, with the latest `main` commit.

- **Commit:** `a157a55` (2026-10-12). Verified on 2026-10-12 against that commit: `npm run build` passes (6 pages + 57 citation JSON files) and `npm run lint` reports 0 errors.
- **Last completed task:** type refactor: components no longer import `CollectionEntry` from `astro:content`; they use `User`/`LinkItem` exported by `src/lib/getUser.ts`. Before that: ESLint added (`83baf9c`) and `Research.astro` timeline (`7ae762b`).
- **Pending commit:** `md:ml-75` margin in `BaseLayout` and `Footer` (bug 10).
- **Pending for the data flow rule:** `privacy_policy.astro` still imports `getEntry`/`render` from `astro:content` (bug 4 in 7.1).
- **Pages done:** `/` (landing), `/aboutme/bio`, `/aboutme/teaching`, `/aboutme/publications`, `/aboutme/research`, `/privacy_policy`, `/api/citations/[id].json`.
