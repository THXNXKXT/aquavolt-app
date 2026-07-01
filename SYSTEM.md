# AquaVolt — System Documentation

> **Technical reference for developers.**
> For setup and quick start, see the [README](./README.md).

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Authentication & Security](#4-authentication--security)
5. [Business Logic](#5-business-logic)
6. [API Reference](#6-api-reference)
7. [Money Handling](#7-money-handling)
8. [Error Handling](#8-error-handling)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Component Reference](#10-component-reference)
11. [Configuration](#11-configuration)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. System Overview

AquaVolt is a dormitory utility management system built for single-property operators. It handles the full monthly billing cycle: meter reading → cost calculation → invoice generation → payment tracking → reporting.

### Core Workflow

```
Building → Room → Tenant (move-in)
                        ↓
              Monthly Meter Reading
                        ↓
              Auto Cost Calculation
              (usage × rate + rent + fees)
                        ↓
              Invoice Generation
              (unique per room/month/year)
                        ↓
              Payment Tracking
              (pending → paid / overdue)
                        ↓
              Reports & Excel Export
```

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
│                                                          │
│  React 19 Components ← useTranslations (next-intl)      │
│       ↓                                                  │
│  API Client (lib/api.ts) ← auth cookies (httpOnly)      │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS (same-origin)
┌──────────────────────────┴───────────────────────────────┐
│                 Next.js 16 (Server)                       │
│                                                          │
│  App Router [locale] pages → Server Components            │
│       ↓                                                  │
│  Route Handlers (/api/*) ← route() wrapper               │
│       ↓                  ↓                               │
│  requireAuth()    Zod Validation                         │
│       ↓                                                  │
│  Drizzle ORM → PostgreSQL (Neon)                         │
│                                                          │
│  Better-Auth ← session cookies → /api/auth/*             │
└──────────────────────────────────────────────────────────┘
```

### Request Flow

```
Client fetch("/api/invoices")
  → Next.js Route Handler
    → route() wrapper catches errors
      → requireAuth() checks session cookie
        → auth.api.getSession() → DB lookup
      → validate(req, schema) → Zod parse
      → DB query via Drizzle
    → Response.json() or error (401/400/409/500)
```

---

## 3. Database Schema

### Entity Relationship

```
buildings ──1:N──→ rooms ──1:N──→ tenants
                     │
                     ├──1:N──→ meter_readings
                     │
                     └──1:N──→ invoices ──→ tenants

utility_rates     (standalone — rate per unit)
settings          (key-value store)
activities        (event log)

user              ──1:N──→ session
user              ──1:N──→ account
verification      (standalone — email tokens)
```

### Tables (12 total)

#### Business Tables (8)

| Table | PK | Columns | Notes |
|-------|----|---------|-------|
| `buildings` | `id (text)` | name, address, timestamps | Root entity |
| `rooms` | `id (text)` | buildingId (FK cascade), roomNumber, floor, status (enum), rentalFee, timestamps | `status`: vacant / occupied / maintenance |
| `tenants` | `id (text)` | roomId (FK), name, phone, lineId, moveInDate, moveOutDate, contractDuration, isActive, wifiEnabled, timestamps | Syncs room status on create/update/delete |
| `meter_readings` | `id (text)` | roomId, month, year, water/electric previous+current+usage, notes, timestamps | **uniqueIndex(roomId, month, year)** |
| `invoices` | `id (text)` | roomId, tenantId, meterReadingId, month, year, costs (rental/water/electric/service/wifi), status (enum), dates, invoiceNumber (unique), timestamps | **uniqueIndex(roomId, month, year)** |
| `utility_rates` | `id (text)` | name, unit, ratePerUnit (numeric), isActive, timestamps | Water/electric rates |
| `settings` | `id (text)` | key (unique), value, updatedAt | Key-value config store |
| `activities` | `id (text)` | type (enum), action, detail, createdAt | Audit log |

#### Auth Tables (4)

| Table | PK | Columns | Notes |
|-------|----|---------|-------|
| `user` | `id (text)` | name, email (unique), emailVerified, image, timestamps | Better-Auth managed |
| `session` | `id (text)` | expiresAt, token (unique), ipAddress, userAgent, userId (FK cascade), timestamps | Session tokens |
| `account` | `id (text)` | accountId, providerId, userId (FK cascade), accessToken, refreshToken, password, timestamps | Credentials storage |
| `verification` | `id (text)` | identifier, value, expiresAt, timestamps | Email verification tokens |

### Key Constraints

- `rooms.buildingId` → `buildings.id` (ON DELETE CASCADE)
- `invoices` has **unique index** on `(roomId, month, year)` — prevents duplicate invoices
- `meter_readings` has **unique index** on `(roomId, month, year)` — prevents duplicate readings
- `invoiceNumber` is **globally unique** — format: `INV-YYYYMM-NNN`

---

## 4. Authentication & Security

### Better-Auth Configuration

```
src/lib/auth.ts        → Server config (drizzleAdapter, emailAndPassword, rateLimit)
src/lib/auth-client.ts → React client (signIn, signOut, useSession, changePassword)
src/lib/api-helper.ts  → requireAuth() — throws 401 if no session
```

### Auth Flow

```
Login:
  POST /api/auth/sign-in/email
    → Better-Auth validates password (bcrypt hash in account table)
    → Creates session → Sets httpOnly cookie
    → Returns session token

API Request:
  GET /api/invoices
    → route() wrapper → requireAuth()
    → getSession() reads cookie → validates against session table
    → No session → throws Error (status: 401) → returns 401 JSON

Client 401:
  api.ts request() checks res.status === 401
  → window.location.href = "/login" (auto-redirect)
```

### Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt (via Better-Auth) |
| Session storage | DB + httpOnly cookie |
| Rate limiting | Better-Auth built-in (`rateLimit: { enabled: true }`) |
| API auth | `route()` wrapper auto-calls `requireAuth()` on all 32 handlers |
| Password change | Settings → Security tab → Better-Auth `changePassword()` |
| SSL | Configurable via `DB_SSL_REJECT_UNAUTHORIZED` env var |
| Input validation | Zod schemas on every POST/PATCH endpoint |

---

## 5. Business Logic

### Utility Cost Calculation

```typescript
// src/lib/calculators.ts

waterUsage = max(0, waterCurrent - waterPrevious)
electricUsage = max(0, electricCurrent - electricPrevious)

waterCost = waterUsage × waterRate
electricCost = electricUsage × electricRate
rentalCost = room.rentalFee (fixed)
serviceCharge = from settings
wifiCost = tenant.wifiEnabled ? settings.wifiRate : 0

totalAmount = waterCost + electricCost + rentalCost + serviceCharge + wifiCost
```

`Math.max(0, ...)` prevents negative usage when meters are misread.

### Meter Validation

When recording a meter reading where `current < previous`, the API returns warnings (but still saves):

```json
{
  "id": "...",
  "waterUsage": "0",
  "warnings": ["Water meter current is lower than previous — please verify"]
}
```

### Invoice Numbering

```
Format: INV-YYYYMM-NNN
Example: INV-202607-001

nextInvoiceNumber() runs INSIDE the insert transaction:
  1. COUNT existing invoices WHERE invoiceNumber LIKE 'INV-202607-%'
  2. Increment count + 1
  3. Pad to 3 digits

This serializes concurrent generators under the row lock.
```

### Duplicate Invoice Prevention

Two layers:

1. **API check** — `SELECT ... WHERE roomId = ? AND month = ? AND year = ?` before insert → returns 400
2. **DB constraint** — `uniqueIndex(roomId, month, year)` → throws 409 if race condition

### Tenant → Room Status Sync

All runs inside `db.transaction()`:

| Trigger | Action |
|---------|--------|
| Create tenant (isActive) | Room → `occupied` |
| Update tenant (isActive=false or moveOutDate) | If no other active tenant → Room → `vacant` |
| Update tenant (roomId change) | Old room freed → New room `occupied` |
| Delete tenant (isActive) | If no other active tenant → Room → `vacant` |

### Overdue Auto-Promotion

`markOverdue()` runs lazily on dashboard read:

```sql
UPDATE invoices SET status = 'overdue'
WHERE status = 'pending' AND due_date < NOW()
```

Not a cron job — sufficient for single-dorm scale.

### Cascade Deletes

All delete cascades run inside transactions:

```
DELETE building → invoices → tenants → rooms → building
DELETE room     → invoices → meter_readings → tenants → room
```

---

## 6. API Reference

All endpoints require a valid session cookie. Unauthenticated requests return `401`.

### Response Format

```typescript
// Success: 200 / 201
{ "id": "...", "name": "...", ... }

// Error: 400 / 401 / 404 / 409 / 500
{ "error": "Human-readable message" }
```

### Status Code Mapping

| Status | When |
|--------|------|
| 200 | GET / PATCH success |
| 201 | POST success |
| 204 | DELETE success (no body) |
| 400 | Validation error, duplicate invoice |
| 401 | No session (unauthorized) |
| 404 | Resource not found |
| 409 | DB constraint violation (unique, FK) |
| 500 | Unhandled server error (logged to console) |

### Endpoints

#### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/sign-in/email` | Login with email + password |
| `POST` | `/api/auth/sign-up/email` | Register new user |
| `POST` | `/api/auth/sign-out` | Logout (clears session) |
| `GET` | `/api/auth/get-session` | Get current session |
| `POST` | `/api/auth/change-password` | Change password |

#### Buildings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/buildings` | List all buildings (with room count) |
| `POST` | `/api/buildings` | Create building `{ name, address? }` |
| `GET` | `/api/buildings/:id` | Get single building |
| `PATCH` | `/api/buildings/:id` | Update building |
| `DELETE` | `/api/buildings/:id` | Delete building (cascade in transaction) |

#### Rooms

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/rooms` | List all rooms (with building name) |
| `POST` | `/api/rooms` | Create room `{ buildingId, roomNumber, floor?, status?, rentalFee? }` |
| `GET` | `/api/rooms/:id` | Get single room |
| `PATCH` | `/api/rooms/:id` | Update room |
| `DELETE` | `/api/rooms/:id` | Delete room (cascade dependents in transaction) |

#### Tenants

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tenants` | List all tenants (with room/building) |
| `POST` | `/api/tenants` | Create tenant + auto room status sync |
| `GET` | `/api/tenants/:id` | Get single tenant |
| `PATCH` | `/api/tenants/:id` | Update tenant + room status sync |
| `DELETE` | `/api/tenants/:id` | Delete tenant + room status sync |

#### Invoices

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/invoices` | List invoices (filter: `?month=&year=&status=`) |
| `POST` | `/api/invoices` | Create invoice (duplicate check + auto numbering) |
| `GET` | `/api/invoices/:id` | Get invoice with computed `totalAmount` |
| `PATCH` | `/api/invoices/:id` | Update status (paid/pending), auto-sets paidDate |

#### Meters

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/meters` | List meter readings (filter: `?roomId=&month=&year=`) |
| `POST` | `/api/meters` | Create reading (auto-computes usage, returns warnings) |
| `PATCH` | `/api/meters/:id` | Update reading values |
| `DELETE` | `/api/meters/:id` | Delete reading |

#### Other

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard` | Aggregated stats (calls `markOverdue()` first) |
| `GET` | `/api/rates` | List utility rates |
| `POST` | `/api/rates` | Create rate |
| `PATCH` | `/api/rates/:id` | Update rate |
| `DELETE` | `/api/rates/:id` | Delete rate |
| `GET` | `/api/settings` | Get all settings (as key-value map) |
| `PATCH` | `/api/settings` | Upsert settings (atomic transaction) |
| `GET` | `/api/activities` | List activities (filter: `?type=&limit=`) |
| `POST` | `/api/activities` | Create activity log entry |

---

## 7. Money Handling

### The Problem

PostgreSQL `numeric(10,2)` returns values as **strings** in Node.js. If code does arithmetic directly on these strings, JavaScript silently coerces them — potentially losing precision.

### The Solution

```
DB (numeric) → string → toMoney(string) → number → arithmetic → String(number) → DB
```

| Function | Location | Purpose |
|----------|----------|---------|
| `toMoney(v)` | `lib/calculators.ts` | Safe parse string/number/null → number (0 on NaN) |
| `sumInvoice(inv)` | `lib/calculators.ts` | Single source of truth for invoice totals |
| `formatCurrency(amount)` | `lib/formatters.ts` | `Money` type → THB formatted string |
| `money` (Zod) | `lib/validation.ts` | `z.coerce.number().min(0)` — validates all money inputs |

### Rules

1. **Never** do arithmetic on raw DB values — always `toMoney()` first
2. **Never** compute totals in multiple places — use `sumInvoice()`
3. **Always** store back as `String(number)` for numeric columns
4. **Always** accept money via Zod `money` schema on API input

---

## 8. Error Handling

### API Layer

```typescript
// src/lib/route-handler.ts
route(async (req) => {
  // ... handler logic
})
// Catches ALL throws → converts to structured JSON response
```

| Error Source | Detection | Response |
|-------------|-----------|----------|
| Postgres constraint (code starts with `23`) | `pg.code` | `409 { error: message }` |
| Custom error with `status` property | `err.status` | `{ status, error }` |
| Everything else | catch-all | `500 { error: "Internal server error" }` |

### Client Layer

| Layer | Mechanism |
|-------|-----------|
| `safeApi()` | Wraps promise → returns `[data, error]` + toast |
| API client `request()` | Checks `res.status === 401` → redirect to `/login` |
| ErrorBoundary | Wraps all pages via `[locale]/layout.tsx` → fallback UI |
| Toast notifications | `react-hot-toast` for all user-facing feedback |

---

## 9. Internationalization (i18n)

### Configuration

```
next-intl with locale-based routing:
  /[locale]/dashboard  →  th or en
  /api/*               →  no locale (API routes)
```

### Files

| File | Keys | Description |
|------|------|-------------|
| `messages/en.json` | ~380 | English translations |
| `messages/th.json` | ~380 | Thai translations |

### Namespaces

`auth`, `nav`, `dashboard`, `buildings`, `rooms`, `tenants`, `invoices`, `meters`, `rates`, `settings`, `common`, `reports`, `toast`, `app`

### Usage

```tsx
const t = useTranslations();

// Simple key
t("dashboard.totalRooms")           // → "Total Rooms" / "จำนวนห้องทั้งหมด"

// With interpolation
t("invoices.overdueDaysCount", { days: 5 })
// → "Overdue by 5 days" / "เกินกำหนดชำระ 5 วัน"

// Namespaced
const t = useTranslations("auth");
t("title")                          // → "Sign In" / "เข้าสู่ระบบ"
```

### Rules

- **Zero hardcoded UI text** — all visible strings use `t()`
- Date formatting uses `toLocaleDateString(locale)` — not i18n keys
- Both files must have identical key structures

---

## 10. Component Reference

### Dashboard Widgets (`components/dashboard/`)

| Component | Key Props | Description |
|-----------|-----------|-------------|
| `MetricCards` | totals, counts | 4 summary stat cards |
| `RevenueCard` | invoices, chartData | Donut + bar chart + cost breakdown |
| `CollectionRate` | rate, paid, total | Animated progress bar |
| `MeterStatus` | read, unread | Reading progress + action button |
| `QuickActions` | — | 4 shortcut buttons (memoized) |
| `RoomGridUsage` | rooms, topMeters | Room grid + utility bars |
| `ContractStatusCard` | stats | Contract expiry summary |
| `OverdueAlert` | invoices, maxDays | Red alert banner |
| `RecentActivity` | activities, timeAgo | Activity feed |
| `RecentInvoices` | invoices | Latest 5 invoices |

### Shared Components (`components/shared/`)

| Component | Description |
|-----------|-------------|
| `AnimatedNumber` | Count-up animation on mount |
| `AnimatedProgressBar` | CSS transition width animation |
| `SelectApple` | Custom dropdown with Apple-style UI |
| `StatusBadge` | Color-coded status pill (room/invoice) |
| `Pagination` | Page navigation controls |
| `EmptyState` | "No data" placeholder with icon + action |
| `FieldError` | Form validation error display |
| `ConfirmDialog` | Modal confirmation for destructive actions |
| `ErrorBoundary` | React error boundary with reload button |
| `Modal` | Reusable modal dialog |
| `PromptPayQR` | Generates PromptPay QR code (dynamic import) |
| `LocaleSwitcher` | Language toggle (TH/EN) |
| `Reveal` | Framer Motion entrance animation wrapper |

### Layout (`components/layout/`)

| Component | Description |
|-----------|-------------|
| `NavWrapper` | Desktop sidebar + mobile nav shell |
| `GlobalNav` | Navigation menu with groups + active state |
| `GlobalSearch` | ⌘K command palette (search rooms/tenants/invoices) |
| `PageHeader` | Page title + description |
| `SubNav` | Sub-navigation bar with back button |

### Auth (`components/auth/`)

| Component | Description |
|-----------|-------------|
| `AuthGuard` | Wraps protected routes — redirects to `/login` if unauthenticated |

---

## 11. Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `BETTER_AUTH_URL` | Yes | — | App base URL (for auth cookies/redirects) |
| `DB_SSL_REJECT_UNAUTHORIZED` | No | `true` | Set to `"false"` for dev with self-signed certs |

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest |
| `pnpm test:watch` | Vitest in watch mode |
| `npx drizzle-kit push` | Push schema changes to DB |
| `npx tsx src/db/seed.ts` | Seed sample business data |
| `npx tsx src/db/seed-auth.ts` | Create admin user |

### Quality Gates

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | 0 errors |
| ESLint | `npx eslint src/` | 0 errors |
| Tests | `pnpm test` | 16 passed |
| Build | `pnpm build` | Success |

---

## 12. Troubleshooting

### Login fails (401)

1. Verify admin user exists: `npx tsx src/db/seed-auth.ts`
2. Check `BETTER_AUTH_URL` matches the app URL
3. Check session table has records after login

### API returns 409 on invoice creation

This is expected — the unique constraint `(roomId, month, year)` prevents duplicates. The API pre-checks and returns `400` with a message, but concurrent requests may hit the DB-level `409`.

### TypeScript build fails

```bash
npx tsc --noEmit
# Fix reported errors — usually a type mismatch after schema change
```

### Missing translation warning

```
MISSING_MESSAGE: Could not resolve `key` in messages for locale `en`
```

Add the missing key to **both** `messages/en.json` and `messages/th.json`.

### Better-Auth warning

```
WARN [Better Auth]: Base URL is not set
```

Set `BETTER_AUTH_URL` in `.env` (e.g., `http://localhost:3000`).

### Dashboard shows stale data

The dashboard calls `markOverdue()` on each load and auto-refreshes on page visibility change. Hard refresh to force update.

### Database connection fails

1. Verify `DATABASE_URL` is correct
2. For Neon: ensure connection string has `?sslmode=require`
3. For local dev with self-signed certs: set `DB_SSL_REJECT_UNAUTHORIZED=false`
4. Test connection: `npx tsx -e "import 'dotenv/config'; import { db } from '@/db'; db.execute('SELECT 1').then(() => console.log('OK'))"`

---

## License

© THXNXKXT. All rights reserved.
