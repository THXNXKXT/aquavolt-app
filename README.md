<div align="center">

# ⚡ AquaVolt

### Dormitory Utility Management System

ระบบจัดการหอพัก — คำนวณค่าน้ำ-ไฟ-ห้อง ออกใบแจ้งหนี้ ติดตามการชำระเงิน

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Better-Auth](https://img.shields.io/badge/Better--Auth-18181B?style=flat-square&logo=authelia&logoColor=white)](https://www.better-auth.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev)

</div>

---

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 🏠 | **Building & Room Management** | จัดการอาคาร/ห้อง สถานะอัตโนมัติ (ว่าง / มีผู้เช่า / ซ่อมบำรุง) |
| 👥 | **Tenant Management** | ผู้เช่า + สัญญา + WiFi toggle ซิงค์สถานะห้องอัตโนมัติ |
| 📊 | **Dashboard** | รายได้ 6 เดือน, อัตราเก็บเงิน, สถานะห้อง, กิจกรรมล่าสุด |
| ⚡ | **Meter Recording** | จดมิเตอร์รายเดือน คำนวณ usage อัตโนมัติ + เตือนเมื่อมิเตอร์ลดลง |
| 🧾 | **Invoice Generation** | สร้างใบแจ้งหนี้ + PromptPay QR กันซ้ำด้วย unique constraint |
| 💰 | **Payment Tracking** | mark as paid, แจ้งเตือน overdue, คำนวณวันเกินกำหนด |
| 📈 | **Reports & Export** | สรุปการเงิน / ค้างชำระ / สาธารณูปโภค / อัตราเช่า — Export Excel |
| 🔐 | **Authentication** | Better-Auth session-based, rate limiting, เปลี่ยนรหัสผ่าน |
| 🌐 | **Bilingual** | ไทย / English (next-intl) — ทุกหน้าทุกข้อความ |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19 + Tailwind CSS v4 + Framer Motion |
| **Language** | TypeScript 5 (strict mode) |
| **Database** | PostgreSQL (Neon) + Drizzle ORM |
| **Auth** | Better-Auth (email/password, session cookies, rate limiting) |
| **Validation** | Zod |
| **Charts** | Recharts |
| **Export** | xlsx (SheetJS) |
| **i18n** | next-intl |
| **Testing** | Vitest |
| **Icons** | lucide-react |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** — `npm install -g pnpm`
- **PostgreSQL** database (local or [Neon](https://neon.tech))

### Installation

```bash
# 1. Clone & install
git clone <repo-url> && cd aquavolt-app
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env → set DATABASE_URL and BETTER_AUTH_URL

# 3. Create database tables
npx drizzle-kit push

# 4. Seed sample data (buildings, rooms, rates)
npx tsx src/db/seed.ts

# 5. Create admin user
npx tsx src/db/seed-auth.ts

# 6. Run!
pnpm dev
```

→ Open **http://localhost:3000** → Login with credentials from step 5

---

## ⚙️ Environment Variables

```env
# ─── Database (required) ───
DATABASE_URL=postgresql://user:***@host:5432/dbname?sslmode=require

# ─── Auth (required) ───
BETTER_AUTH_URL=http://localhost:3000

# ─── SSL (optional) ───
# Set to "false" ONLY for dev with self-signed certs
# DB_SSL_REJECT_UNAUTHORIZED=false
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                  # REST API (9 modules + auth)
│   │   ├── auth/[...all]/    # Better-Auth handler
│   │   ├── buildings/        # CRUD
│   │   ├── rooms/            # CRUD
│   │   ├── tenants/          # CRUD + room sync
│   │   ├── invoices/         # CRUD + duplicate check
│   │   ├── meters/           # CRUD + validation
│   │   ├── rates/            # CRUD
│   │   ├── settings/         # Key-value store
│   │   ├── activities/       # Log
│   │   └── dashboard/        # Aggregated stats
│   └── [locale]/             # Pages (th/en)
│       ├── dashboard/        # Overview
│       ├── rooms/            # Room management
│       ├── tenants/          # Tenant management
│       ├── invoices/         # Invoice list + detail + print
│       ├── meters/           # Meter recording
│       ├── buildings/        # Building management
│       ├── rates/            # Utility rates
│       ├── settings/         # Settings + security
│       ├── activity/         # Activity log
│       └── reports/          # Reports + Excel export
├── components/
│   ├── dashboard/            # 12 dashboard widgets
│   ├── layout/               # Nav, search, page header
│   ├── auth/                 # AuthGuard
│   └── shared/               # Modal, pagination, QR, badges...
├── db/
│   ├── schema/               # 12 Drizzle tables
│   ├── queries.ts            # Shared queries + invoice numbering
│   └── seed.ts               # Sample data
├── lib/
│   ├── auth.ts               # Better-Auth server config
│   ├── auth-client.ts        # Better-Auth React client
│   ├── api.ts                # Typed API client
│   ├── calculators.ts        # Utility cost calculator
│   ├── validation.ts         # Zod schemas
│   ├── formatters.ts         # Date/currency helpers
│   ├── route-handler.ts      # Error wrapper + auto-auth
│   └── export-utils.ts       # Excel export
├── hooks/                    # use-settings
└── types/                    # TypeScript interfaces

messages/                      # en.json, th.json
drizzle/                       # Migrations
```

---

## 📡 API Reference

All endpoints require authentication (session cookie).

| Endpoint | Methods | Description |
|----------|:-------:|-------------|
| `/api/auth/*` | `GET` `POST` | Better-Auth (login, signup, session, password change) |
| `/api/dashboard` | `GET` | Aggregated dashboard stats |
| `/api/buildings` | `GET` `POST` | List / create buildings |
| `/api/buildings/:id` | `GET` `PATCH` `DELETE` | Building CRUD |
| `/api/rooms` | `GET` `POST` | List / create rooms |
| `/api/rooms/:id` | `GET` `PATCH` `DELETE` | Room CRUD (cascade delete) |
| `/api/tenants` | `GET` `POST` | List / create tenants |
| `/api/tenants/:id` | `GET` `PATCH` `DELETE` | Tenant CRUD (auto room sync) |
| `/api/invoices` | `GET` `POST` | List / create (duplicate-protected) |
| `/api/invoices/:id` | `GET` `PATCH` | Invoice detail / mark paid |
| `/api/meters` | `GET` `POST` | List / create (with validation warnings) |
| `/api/meters/:id` | `PATCH` `DELETE` | Update / delete readings |
| `/api/rates` | `GET` `POST` | Utility rates |
| `/api/rates/:id` | `PATCH` `DELETE` | Rate management |
| `/api/settings` | `GET` `PATCH` | Key-value settings (atomic) |
| `/api/activities` | `GET` `POST` | Activity log |

---

## 🧪 Development

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm test         # Run tests (Vitest)
pnpm test:watch   # Watch mode tests
```

---

## 🏗 Architecture Highlights

- **Money safety** — DB stores `numeric(10,2)` as strings, single `toMoney()` parser, `sumInvoice()` as the only total calculator
- **Transaction safety** — all multi-step writes (DELETE cascade, invoice creation, tenant room-sync) run inside `db.transaction()`
- **Auto-auth** — `route()` wrapper enforces `requireAuth()` on all 32 API handlers
- **Invoice uniqueness** — DB-level `uniqueIndex(roomId, month, year)` + API-level pre-check
- **Meter validation** — warns when current reading < previous (likely recording error)
- **ErrorBoundary** — wraps all pages via locale layout

---

## 📄 License

© THXNXKXT. All rights reserved.
