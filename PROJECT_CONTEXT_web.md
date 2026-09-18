# Project Context Summary — Academic Personal Website (bio.link-style)

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

## 3. Non-Functional Requirements (govern all architectural decisions) THIS A VERY IMPORTANT POINT 
1. Maximize Lighthouse score.
2. Scalable/replicable to other professors — user explicitly directs that all decisions assume a **future migration to a full backend ("Option B": NestJS + database + JWT auth)**, even while current implementation stays static. The Zod schema is treated as the future DB schema/DTO source of truth. Data-fetching logic must stay centralized/abstracted to ease that migration.
3. Security against attacks — no user-facing forms/uploads exist yet; when built (future publications upload form), must include file-type/size validation and auth.
4. Strict data validation at the input layer (this is why Zod/Content Collections replaced hand-written TypeScript interfaces).
5. **Responsive design** — mandatory on every component/page, mobile-first. Workflow order: (1) build/validate the base (unprefixed = mobile) styles first, (2) only then layer `sm:`, `md:`, `lg:` (and up) where the layout actually needs to change at that breakpoint — no breakpoint is added speculatively. Mark responsive rules with a short inline comment in the component (e.g. `<!-- responsive: ... -->`) so intent stays visible. `ProfileHeader.astro` (avatar, heading, text, padding) is the first component updated under this requirement; not yet visually verified across breakpoints.

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
  - ORCID and GitHub URLs are still placeholders and need to be filled in.
  - Real client data is present in this file.

- `src/lib/getUser.ts`
  - Provides a centralized access point for the user profile data.
  - Uses Astro's `getEntry()` internally.
  - Pages should call `getUser()` rather than duplicating the data-access logic.
  - This abstraction is intentional and should make a future migration from Astro Content Collections to a real API easier.

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

SocialIcons.astro — Props { socials: Social[] }. Renders circular link icons. Currently a placeholder implementation: displays the first letter of each network's name instead of real brand icons/SVGs.

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
