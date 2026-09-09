# Fantasy Predict — Admin Console

The complete, standalone admin application for managing the Fantasy Predict platform.
This whole repo (`admin/`) **is the application** — Next.js app root, `src/app` routes,
components, API layer and theme are all here. There is no separate player app in this
repo; deploy this folder as its own project at **`admin.<domain>`** (e.g. `admin.oururl.com`).

> A coding assistant should read this file before modifying or extending the app. It
> documents every backend endpoint, which ones are already integrated and where, and
> how to run the project.

---

## 1. Quick facts

| Item | Value |
| --- | --- |
| Framework | Next.js 16 (App Router, Webpack) + React 19, TypeScript |
| Styling | Tailwind CSS (v3) + vendored primitives in `_components/ui/*` (shadcn-style) |
| Dev port | **2041** (`npm run dev` → `http://localhost:2041`) |
| API base URL | `https://api.fantasy-predict.com` (env: `NEXT_PUBLIC_API_URL`) |
| Swagger / OpenAPI | `https://api.fantasy-predict.com/openapi.json` |
| Auth | `POST /v1/admins/login` → Bearer token stored in `localStorage fp_token` + cookie, user type `admin` |
| Currency formatting | `formatNaira()` from `_lib/mock-data.ts` |
| UI shorthands | `AdminShell` renders the sidebar/topbar; `AdminTable` renders tables (both in `_components/admin-shell.tsx`) |

### Routes

| Route | Page |
| --- | --- |
| `/` | Login / landing page (shown as the app's first screen) |
| `/signup` | Create admin account + OTP verification |
| `/overview` | Overview/dashboard (stats from `GET /v1/admins/dashboard`) |
| `/users` | Users list (from `GET /v1/admins`) |
| `/pools` | Pools list (from `GET /v1/pools`) |
| `/results` | Fixtures & results (from `GET /v1/matches` + `GET /v1/competitions`) |
| `/payments` | Payments dashboard (from `GET /v1/admins/dashboard` + `GET /v1/transactions`) |

### Files & structure inside `src/app`

| Path | Purpose |
| --- | --- |
| `page.tsx` | **Login / landing page** (`adminLogin()` + session bootstrap, then → `/overview`) |
| `signup/page.tsx` | **Sign up** — create admin (`adminSignup()`) then verify OTP (`adminVerifyAccount()`) |
| `fonts.ts` | `next/font/google` — Exo 2 (`--font-display`) + Montserrat (`--font-sans`) |
| `layout.tsx` | Root layout: `ThemeProvider`, bootstrap script, `sonner` `<Toaster />` |
| `globals.css` | Tailwind v3 theme tokens, CSS variables, `num`/`font-display` utilities |
| `overview/page.tsx` | Overview/dashboard (stats from `GET /v1/admins/dashboard`) |
| `users/page.tsx` | Users list (from `GET /v1/admins`) |
| `pools/page.tsx` | Pools list (from `GET /v1/pools`) |
| `results/page.tsx` | Fixtures & results (from `GET /v1/matches` + `GET /v1/competitions`) |
| `payments/page.tsx` | Payments dashboard (from `GET /v1/admins/dashboard` + `GET /v1/transactions`) |
| `error.tsx` | Error boundary; redirects to `/` on 401 |
| `_components/admin-shell.tsx` | `AdminShell` (nav layout) + `AdminTable` |
| `_components/ui/*` | Vendored UI primitives: `avatar`, `badge`, `button`, `card`, `input`, `skeleton` |
| `_components/logo.tsx` | Brand logo (needs `next/image` + public assets) |
| `_components/theme-provider.tsx` | Theme provider (`fp-theme` key) + bootstrap script |
| `_components/theme-toggle.tsx` | System/light/dark toggle |
| `_components/stat-card.tsx` | Lean `StatCard` KPI tile |
| `_lib/api/` | **All API functions** — `config.ts`, `session.ts`, `client.ts` (`apiFetch`/`ApiError`), `endpoints.ts` (admin + shared `getTransactions`/`getPools`/`getMatches`/`getUserCompetitions`), `index.ts` |
| `_lib/mock-data.ts` | `Match`/`Pool`/`Transaction` types + `formatNaira()` |
| `_lib/utils.ts` | `cn()` (clsx + tailwind-merge) |
| `_lib/admin-data.ts` | Mock/fallback data (payouts, activity, results, stats) |
| `README.md` | This file |

### Self-contained

The app root (`admin/`) contains the full Next.js project. All code under `src/app`
resolves imports relative to itself (or into globally resolvable npm packages / `public` assets).
The API client (`apiFetch`, token/session/cookie handling), shared endpoints, types,
`formatNaira()`, `cn()`, the UI primitives, logo, theme provider/toggle, and `StatCard`
all live in this repo.

### External assets & deps used by the app

- **npm packages**: `next`, `react`, `react-dom`, `tailwindcss` (v3),
  `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-avatar`,
  `@radix-ui/react-slot`, `lucide-react`, `sonner`.
- **Public image assets** (used by `_components/logo.tsx`): `logos.png`,
  `logos-white.png`, `icon-logo.png`, `icon-logo-white.png` (placeholders committed).
- **Tailwind theme tokens** — the classes used by the UI (`bg-sidebar`,
  `border-sidebar-border`, `text-gold`, `bg-navy`, `text-navy-foreground`,
  `text-success`, `border-gold/*`, `border-success/*`, `border-destructive/*`,
  `shadow-[var(--shadow-card)]`, `font-display`, `num`, `animate-rise`, ...) are defined
  in this repo's `globals.css` + `tailwind.config.js`.

---

## 2. Running the app

1. `npm install`
2. `npm run dev` → http://localhost:2041 (Webpack dev server)
3. `npm run build` → production build; `npm start` → serves on port 2041
4. Point `NEXT_PUBLIC_API_URL` at the Fantasy Predict API (`.env.local` already sets it).

---

## 3. Auth (admin login & signup flow)

Endpoints are ordered per the OpenAPI docs: create → fetch → verify-account → login → profile → dashboard.

- Sign up — `POST /v1/admins`, body `{ email*, password*, firstName?, lastName? }`.
  - Frontend: `adminSignup()` in `_lib/api/`, used by `src/app/signup/page.tsx`.
  - Response: `{ data: {}, status: true, message: "Account created successfully" }`.
  - **Important:** on the live API the account is created with `isActive: true`
    immediately — no OTP gate. The verify step is **optional/best-effort** and the
    signup page never blocks sign-in on it.
- Verify account (optional) — `POST /v1/admins/verify-account`, body `{ email*, otp* }`.
  - Frontend: `adminVerifyAccount()` in `_lib/api/`.
  - **Note:** this endpoint currently returns **HTTP 500** on the live API (backend
    issue). The signup page catches that and still lets the admin proceed to sign in.
- Login — `POST /v1/admins/login`, body `{ email, password }`.
  - Response shape used by the app: `{ meta: { token, refreshToken }, data: { ... } }`.
  - Frontend: `adminLogin()` in `_lib/api/`, then the signing code in `src/app/page.tsx`
    stores the token, sets `localStorage fp_user_type = "admin"`, and redirects to `/overview`.
- Current admin profile — `GET /v1/admins/profile` via `getAdminProfile()`;
  `DELETE /v1/admins/profile` via `deleteAdminProfile()` (both in `_lib/api/`).
- All data calls send `Authorization: Bearer <fp_token>` (via `getToken()` from `_lib/api/session.ts`).
- 401 handling: `apiFetch` tries to refresh via `POST /v1/users/refresh-token`, then
  redirects to `/` (the `src/app/error.tsx` boundary also handles 401s).
- Logout calls `clearSession()` which wipes the token/user-type/pin keys and cookies.

---

## Design system (matches the player app)

- **Brand colors** — Primary Blue `#1D4ED8` · Dark Navy `#0F172A` · Premium Gold `#F4B400`,
  exposed as CSS variables in `globals.css` (`:root` light + `.dark` theme) and mapped
  through `tailwind.config.js` (`primary`, `navy`, `gold`, `success`, `sidebar`, ...).
- **Fonts** — `next/font/google` in `fonts.ts`: **Exo 2** (`--font-display`, headings) and
  **Montserrat** (`--font-sans`, body/UI), applied on `<html>` in `layout.tsx`. No external
  font requests at runtime (self-hosted).
- **Shadows** — `--shadow-card` / `--shadow-elevated` (default + `shadow-card`/`shadow-elevated` utilities).
- **Radii** — `--radius: 0.75rem` scale (`rounded-sm`…`rounded-4xl`) matching the player app.
- **Animations** — `animate-rise` (`fp-rise` keyframe); utilities `num`, `surface-navy`, `text-balance-tight` in `globals.css`.

---

## 4. Endpoint integration matrix

Legend: ✅ **Integrated** (function exists in `_lib/api/` and a page calls it) · ⚠️ **Partially wired** (function exists, no UI/flow yet) · ❌ **Not integrated** (missing)

### Admins

| Method & path | Summary | Status | Function / location |
| --- | --- | --- | --- |
| `POST /v1/admins` | Create admin — body `{ email*, password*, firstName?, lastName? }` | ✅ | `adminSignup()` → `_lib/api/` → used by `signup/page.tsx` |
| `GET /v1/admins` | Fetch admins (query filters: `username`, `firstName`, `lastName`, `email`, `phoneNumber`) | ✅ | `getAdminUsers()` → `_lib/api/` → used by `users/page.tsx` |
| `POST /v1/admins/verify-account` | Verify account — body `{ email*, otp* }` | ⚠️ | `adminVerifyAccount()` → `_lib/api/` → used by `signup/page.tsx` (live API returns 500) |
| `POST /v1/admins/login` | Login — body `{ email*, password* }` | ✅ | `adminLogin()` → `_lib/api/` → used by `page.tsx` |
| `GET /v1/admins/profile` | Current admin profile | ✅ | `getAdminProfile()` → `_lib/api/` |
| `DELETE /v1/admins/profile` | Delete admin account | ✅ | `deleteAdminProfile()` → `_lib/api/` |
| `GET /v1/admins/dashboard` | Dashboard stats | ✅ | `getAdminDashboard()` → `_lib/api/` → used by `page.tsx`, `payments/page.tsx` |

### Data the admin pages also consume (re-exported through `_lib/api/`)

| Method & path | Summary | Status | Function / used by |
| --- | --- | --- | --- |
| `GET /v1/transactions` | All transactions | ✅ | `getTransactions()` → `payments/page.tsx` |
| `GET /v1/pools` | All pools (`page`, `limit`, `name`, `privacy`, `createdBy`, `personal`) | ✅ | `getPools()` → `pools/page.tsx` |
| `GET /v1/pools/{id}` | Single pool | ✅ | `getPool()` (player app `endpoints.ts`, not vendored) |
| `GET /v1/matches` | Matches — query: `competition*`, `stage`, `status`, `matchday`, `date` | ✅ | `getMatches()` → `results/page.tsx` |
| `GET /v1/matches/score` | Score endpoint | ✅ | `getMatchScores()` (player app `endpoints.ts`, not vendored) |
| `GET /v1/competitions` | Competition list | ✅ | `getUserCompetitions()` → `results/page.tsx` |

### Backend surface relevant to a fuller admin build (not yet wired into this admin UI)

| Method & path | Summary | Status | Notes |
| --- | --- | --- | --- |
| `POST /v1/settlements` | Run settlement | ❌ | Natural fit for `results` page ("Settle results" flow) |
| `GET /v1/predictions/in-review` | Predictions awaiting review (`competition`, `poolId`, `fromDate`, `toDate`) | ❌ | — |
| `POST /v1/predictions/send-mail` | Send result mails — body `{ matchday*, competition* }` | ❌ | — |
| `GET /v1/members` | Pool member search | ❌ | — |
| `GET /v1/pool-members` / `POST` / `PATCH /v1/pool-members/{_id}` | Pool membership mgmt | ⚠️ | `joinPool`, `getPoolMembers`, `updatePoolMemberStatus` exist in player `endpoints.ts` |
| `GET /v1/pool-members/count` | Membership counts | ❌ | — |
| `GET /v1/users/count` | User count | ❌ | — |
| `GET /v1/users` | Fetch users | ❌ | — |
| `GET /v1/feedbacks` | User feedback list | ⚠️ | only `submitFeedback` (POST) exists |
| `GET /v1/competitions/news` | Competition news | ❌ | — |
| `GET /v1/contest`, `POST /v1/contest`, `POST /v1/contest/join`, `GET /v1/contest/single/{_id}` | Contests | ❌ | — |
| `POST /v1/pins` | Save PIN | ✅ | `setPin()` (player-side) |
| `GET/POST /v1/wallets`, `GET /v1/wallets/pay`, `POST /v1/wallets/verify-payment` | Wallets / payments | ⚠️ | player endpoints exist; no admin view |
| `POST /v1/withdrawals` | Withdrawal request | ⚠️ | `createWithdrawal()` (player-side) |
| `GET /v1/banks`, `GET /v1/banks/account`, `POST /v1/banks/verify-account` | Banks | ⚠️ | player endpoints exist |
| `GET /v1/webhook`, `GET /v1/pay` | Misc/health | ❌ | infra, not UI |

---

## 5. Full Swagger (OpenAPI) reference

Served at `https://api.fantasy-predict.com/openapi.json`. All routes share the base
`https://api.fantasy-predict.com` and standard response envelope `{ status, data, message }`
(`data` is unwrapped by `apiFetch` unless `unwrap: false`, as used for login).

### Admins

| Method | Path | Request body (schema) |
| --- | --- | --- |
| POST | `/v1/admins` | `{ "email"*: string, "password"*: string, "lastName"?: string, "firstName"?: string }` |
| GET | `/v1/admins` | query: `username`, `firstName`, `lastName`, `email`, `phoneNumber` |
| POST | `/v1/admins/login` | `{ "email"*: string, "password"*: string }` |
| POST | `/v1/admins/verify-account` | `{ "email"*: string, "otp"*: string }` |
| GET | `/v1/admins/profile` | — |
| DELETE | `/v1/admins/profile` | — |
| GET | `/v1/admins/dashboard` | — |

### Users

| Method | Path | Request body / query |
| --- | --- | --- |
| POST | `/v1/users` | `{ email*, password*, phoneNumber*, username?, countryCode?, firstName?, lastName?, gender?, dateOfBirth? }` |
| GET | `/v1/users` | query: `username`, `firstName`, `lastName`, `email`, `phoneNumber` |
| GET | `/v1/users/count` | — |
| POST | `/v1/users/login` | `{ "to"*, "password"* }` |
| POST | `/v1/users/forget-password` | `{ "email"* }` |
| POST | `/v1/users/reset-password` | `{ "email"*, "otp"*, "password"* }` |
| POST | `/v1/users/verify-account` | `{ "email"*, "otp"* }` |
| POST | `/v1/users/resend-code` | `{ "email"* }` |
| POST | `/v1/users/refresh-token` | `{ "refreshToken"* }` |
| PATCH | `/v1/users/change-password` | `{ "oldPassword"* (min 8), "password"* (min 8) }` |
| GET | `/v1/users/profile` | — |
| PUT | `/v1/users/profile` | `{ firstName?, lastName?, username?, gender?, phoneNumber?, avatar?, favouriteTeam? }` |
| DELETE | `/v1/users/profile` | — |
| PATCH | `/v1/users/bvn/{_id}` | `{ "bvn"* }` |
| POST | `/v1/users/send-notification` | `{ "sendNotification"*: boolean }` |

### Matches & predictions

| Method | Path | Request body / query |
| --- | --- | --- |
| GET | `/v1/matches` | query: `competition*`, `stage`, `status`, `matchday`, `date` |
| GET | `/v1/matches/matchday` | query: `matchday*`, `competition*` |
| GET | `/v1/matches/score` | query: `competition*` |
| POST | `/v1/predictions` | `{ "match"*, "competition"*, "outcome"*, "pool"? }` (outcome = `"home-away"`, e.g. `"2-1"`) |
| GET | `/v1/predictions` | query: `competition`, `pool`, `fromDate`, `toDate` |
| GET | `/v1/predictions/comp-leaderboard` | query: `competition*` |
| GET | `/v1/predictions/in-review` | query: `competition`, `poolId`, `fromDate`, `toDate` |
| POST | `/v1/predictions/send-mail` | `{ "matchday"*, "competition"* }` |

### Contests & competitions

| Method | Path | Request body / query |
| --- | --- | --- |
| GET | `/v1/competitions` | — |
| POST | `/v1/competitions/{code}` | body: competition config; path: `code*` |
| PATCH | `/v1/competitions/{id}` | body: competition config; path: `id*` |
| GET | `/v1/competitions/news` | — |
| POST | `/v1/contest` | `{ title*, description*, endDate*, startDate*, competition*, amount*, winType{first?, second?, third?} }` |
| GET | `/v1/contest` | query: `name`, `search`, `privacy`, `createdBy` |
| POST | `/v1/contest/join` | `{ "invitationCode"* }` |
| GET | `/v1/contest/single/{_id}` | path: `_id*` |

### Pools, members, transactions & payments

| Method | Path | Request body / query |
| --- | --- | --- |
| POST | `/v1/pools` | `{ name*, description*, privacy*, competition*, config{amount, paid}*, icon?, maxMembers? }` |
| GET | `/v1/pools` | query: `page`, `limit`, `name`, `privacy`, `createdBy`, `personal` |
| GET | `/v1/pools/{id}` | path: `id*` |
| GET | `/v1/pools/leadboard/pool` | — (returns pool leaderboard; note the typo "leadboard") |
| POST | `/v1/pool-members` | `{ poolId?, code? }` |
| GET | `/v1/pool-members` | query: `name`, `privacy`, `createdBy`, `status`, `user`, `poolId` |
| PATCH | `/v1/pool-members/{_id}` | `{ "poolId"*, "status"*: pending\|approved\|declined }`; path `_id*` |
| GET | `/v1/pool-members/count` | — |
| GET | `/v1/members` | query: `name`, `privacy`, `createdBy`, `status`, `user`, `contest` |
| GET | `/v1/transactions` | — |
| POST | `/v1/settlements` | — |
| POST | `/v1/withdrawals` | `{ "amount"*, bankCode?, accountNumber?, accountName?, bankName? }` |

### Wallets & banks & misc

| Method | Path | Request body / query |
| --- | --- | --- |
| GET | `/v1/wallets` | — |
| POST | `/v1/wallets` | — |
| GET | `/v1/wallets/pay` | query: `email*`, `amount*` |
| POST | `/v1/wallets/verify-payment` | — |
| GET | `/v1/banks` | — |
| GET | `/v1/banks/account` | — |
| POST | `/v1/banks/verify-account` | — |
| POST | `/v1/pins` | — |
| GET | `/v1/feedbacks` | — |
| POST | `/v1/feedbacks` | `{ name, email, subject, message }` |
| GET | `/v1/pay` | query: `email*`, `amount*` (infra) |
| GET | `/v1/webhook` | — (infra) |
| POST | `/v1/user-competitions` | — |
| GET | `/v1/user-competitions` | — |

---

## 6. Coding conventions

- Admin pages are Next.js App Router pages (`"use client"`) under `src/app/*`.
- API calls go through `apiFetch` (`_lib/api/client.ts`), which unwraps `{ data }`
  automatically, sends the bearer token, and refreshes on 401.
- Every page should import API functions from `_lib/api/` (never from any external
  module) so the app layer stays self-contained.
- Use `AdminShell` (title, description, optional `actions`) for page scaffolding and
  `AdminTable` for tabular data. Use `StatCard` for KPI tiles.
- Currency: `formatNaira()` for ₦ amounts. Types and helpers live in `_lib/mock-data.ts`
  and `_lib/utils.ts`.
- Keep mock fallback data in `_lib/admin-data.ts`; replace with live endpoints as they
  are integrated. Each section using mock data notes it in a `<p>` under the section.

---

## 7. Common tasks

- **Add a new page** — create `src/app/<feature>/page.tsx`, wrap content in
  `<AdminShell>`, add the nav entry in `ADMIN_NAV` inside `_components/admin-shell.tsx`.
- **Wire a missing endpoint** — add/export the function from `_lib/api/endpoints.ts`
  (mirror the existing `apiFetch` calls), then call it from the page. For admin-only
  endpoints use `token: getToken()`; for login use `unwrap: false`.
- **API shape changes** — refresh the OpenAPI at the URL above; keep `_lib/api/` and
  the integration matrix (section 4) in sync.