# AquaVolt — Dormitory Management System

ระบบจัดการหอพักสำหรับการเก็บค่าน้ำ-ไฟ-ห้อง และการทำใบแจ้งหนี้ รองรับภาษาไทย/อังกฤษ

---

## Features

- **Dashboard** — ภาพรวมรายได้ 6 เดือน, อัตราการเก็บเงิน, สถานะห้อง, กิจกรรมล่าสุด
- **Building / Room / Tenant** — CRUD พร้อม sync สถานะห้องอัตโนมัติ
- **Meter Recording** — จดมิเตอร์รายเดือน คำนวณ usage อัตโนมัติ + เตือนเมื่อมิเตอร์ลดลง
- **Invoice Generation** — สร้างใบแจ้งหนี้อัตโนมัติ พร้อม PromptPay QR + กันการสร้างซ้ำ
- **Payment Tracking** — ติดตามการชำระ, แจ้งเตือน overdue, mark as paid
- **Reports & Export** — สรุปการเงิน, ค้างชำระ, สาธารณูปโภค, อัตราการเช่า — export Excel
- **Authentication** — Better-Auth session-based, rate limiting, เปลี่ยนรหัสผ่านได้
- **Bilingual** — ไทย / English (next-intl)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 + Framer Motion |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Auth | Better-Auth (email/password, session cookies) |
| Charts | Recharts |
| Excel Export | xlsx (SheetJS) |
| i18n | next-intl |
| Validation | Zod |
| Testing | Vitest |

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL and BETTER_AUTH_URL

# 3. Push database schema
npx drizzle-kit push

# 4. Seed initial data (buildings, rooms, rates)
npx tsx src/db/seed.ts

# 5. Create admin user
npx tsx src/db/seed-auth.ts

# 6. Start development server
pnpm dev
```

Visit http://localhost:3000 → login with the credentials from step 5.

---

## Environment Variables

```env
# Database (required)
DATABASE_URL=postgresql://user:***@host:5432/dbname?sslmode=require

# Auth (required)
BETTER_AUTH_URL=http://localhost:3000

# SSL (optional — set to "false" only for dev with self-signed certs)
# DB_SSL_REJECT_UNAUTHORIZED=false
```

---

## Project Structure

```
src/
├── app/
│   ├── api/              # REST API routes (9 modules + auth)
│   └── [locale]/         # Localized pages (12 routes)
├── components/
│   ├── dashboard/        # Dashboard widgets
│   ├── layout/           # Navigation, search
│   └── shared/           # Reusable UI (modal, pagination, QR, etc.)
├── db/
│   ├── schema/           # Drizzle table definitions (12 tables)
│   ├── queries.ts        # Shared queries + invoice numbering
│   └── seed.ts           # Seed data
├── hooks/                # use-settings
├── lib/                  # API client, auth, calculators, validation, formatters
└── types/                # TypeScript interfaces
messages/                 # Translation files (en.json, th.json)
drizzle/                  # Database migrations
```

---

## API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/*` | GET, POST | Better-Auth authentication |
| `/api/buildings` | GET, POST | List / create buildings |
| `/api/buildings/:id` | GET, PATCH, DELETE | Building CRUD |
| `/api/rooms` | GET, POST | List / create rooms |
| `/api/rooms/:id` | GET, PATCH, DELETE | Room CRUD |
| `/api/tenants` | GET, POST | List / create tenants |
| `/api/tenants/:id` | GET, PATCH, DELETE | Tenant CRUD |
| `/api/invoices` | GET, POST | List / create invoices |
| `/api/invoices/:id` | GET, PATCH | Invoice detail / mark paid |
| `/api/meters` | GET, POST | List / create meter readings |
| `/api/meters/:id` | PATCH, DELETE | Update / delete readings |
| `/api/rates` | GET, POST | Utility rates |
| `/api/settings` | GET, PATCH | Key-value settings |
| `/api/activities` | GET, POST | Activity log |
| `/api/dashboard` | GET | Dashboard summary |

All routes require authentication (session cookie).

---

## Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm test         # Run tests (vitest)
pnpm test:watch   # Watch mode tests
```

---

## License

THXNXKXT
