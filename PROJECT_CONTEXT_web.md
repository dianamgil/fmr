# Project Context Summary — Academic Personal Website (bio.link-style)

ESTE PROYECTO SE HARÁ PASO A PASO, SIGUIENDO MIS INSTRUCCIONES. LO QUE SE AHCE EN ÉL LO ESCRIBO YO BASANDOSE EN LO SIGUIENTE:


## 1. Purpose & Business Context
- Client: a university professor requesting a personal academic website.
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
4. Strict data validation at the input layer (this is why Zod/Content Collections replaced hand-written TypeScript interfaces).

5. **Responsive design** — mandatory on every component/page, mobile-first. Use Tailwind breakpoints `sm:`, `md:`, `lg:` (and up) for sizing/spacing/typography rather than fixed values. Mark responsive rules with a short inline comment in the component (e.g. `<!-- responsive: ... -->`) so intent stays visible. Workflow order: (1) build/validate the base (unprefixed = mobile) styles first, (2) only then layer `sm:`, `md:`, `lg:` (and up) where the layout actually needs to change at that breakpoint — no breakpoint is added speculatively.


Deferred scaling options (documented, not started):
- **Decap CMS** (git-based headless CMS, no backend) — for professor self-service editing without touching code.
- **NestJS + DB + auth** — full backend, for true multi-tenant self-service or a publications upload form.



## 4. Data Layer (Content Collections)

- `src/content.config.ts`
  - Defines the `user` collection.
  - Uses Zod for data validation.
  - Uses the `glob` loader from Astro Content Collections.
  - Must remain at this exact path: `src/content.config.ts`.
  - Do NOT use the legacy Content Collections configuration.

- `src/content/user/profile.json`
  - Contains the professor's profile data.
  - Currently contains a single profile entry with id `profile`.
  - The `publications` field is currently omitted and defaults to an empty array.
 - Real client data is present in this file.

`src/lib/getUser.ts`
  - Provides a centralized access point for the user profile data.
  - Uses Astro's `getEntry()` internally.
  - Pages should call `getUser()` rather than duplicating the data-access logic.
  - This abstraction is intentional and should make a future migration from Astro Content Collections to a real API easier.


  - **`socials` and `links` were merged into a single unified `links` array** (see "Links data model" below) — the old two-array split (icons vs buttons) was dropped in favor of one array plus per-component id-based selection.
  ### Links data model (unified `links` array)

`profile.json`'s old separate `socials` (icons) and `links` (buttons) arrays were merged into ONE `links` array, each entry shaped as:
```json
{ "id": "linkedin", "name": "LinkedIn", "url": "https://...", "icon": "linkedin" }
```
- `id` — stable identifier per link (also lets components select by id; doubles as the future DB primary key, same convention as `publications[].id`).
- `name` — display text (renamed from the old `title`/`name` split for consistency).
- `url` — external URL or internal path (`/projects`); `LinkButton`/`SocialIcons` detect external vs internal via `url.startsWith('http')`.
- `icon` — optional icon identifier resolved by `astro-icon` (`mdi:` set) or a local SVG in `src/icons/` (see below).

The decision was to keep `profile.json`/Zod schema minimal (no per-link display metadata) and instead let each consuming component decide, Internally, which `id`s it renders (see "Component-level id filtering" below). This keeps the data shape simple while still being CMS-ready: a future CMS only needs to feed a component a list of ids (e.g. from checkboxes), it doesn't need to write back into every link's own record.

### Component-level id filtering (temporary, CMS-ready pattern)

`SocialIcons.astro` and the buttons-list component each receive the **entire** `links` array as a prop (never pre-filtered by the calling page) and filter it themselves against a hardcoded id list, e.g.:
```ts
const iconIds = ['linkedin', 'facebook', 'email']; // TEMPORARY — will become a prop fed by the CMS/backend later
const filtered = socials.filter((link) => iconIds.includes(link.id));
```
Intent: `index.astro` never needs code changes to add/remove/reassign a link's display — today the id list is a literal constant inside the component (single-professor stage), but the component's own logic will not change when migrating to a CMS — only where that id list comes from will (constant → `Astro.props.ids`, populated from stored professor config/checkboxes). `index.astro` always passes the raw `user.links` array unfiltered: `<SocialIcons socials={user.links} />`.

- 
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

SocialIcons.astro — Props { socials: Social[] }. Renders circular link icons using `astro-icon` (set `mdi` for linkedin/facebook/email) plus local SVGs in `src/icons/` (`researchgate.svg`, `google-scholar.svg`) for brands not covered by an installed icon set. A `localIcons` list decides whether `social.icon` is used as-is or prefixed with `mdi:`. Falls back to the network's first letter only if `icon` doesn't resolve to any known icon.

LinkButton.astro — Props { title: string; url: string }. Renders a full-width pill button; detects external links via url.startsWith('http') to set target="_blank" rel="noopener noreferrer".

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
