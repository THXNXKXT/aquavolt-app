# AquaVolt - Dormitory Management System

> A comprehensive dormitory/boarding house management system for utility billing, tenant management, and financial reporting.

---

## Features

- **Dashboard** - Overview with room stats, revenue chart, collection rate, occupancy, recent activity
- **Building Management** - CRUD buildings with room counts
- **Room Management** - CRUD rooms with status (occupied/vacant/maintenance)
- **Tenant Management** - CRUD tenants with contract tracking, WiFi toggle, auto room status sync
- **Meter Recording** - Monthly water & electric meter readings with auto usage calculation
- **Invoice Generation** - Auto-calculate utility costs, create invoices with preview, support WiFi fee
- **Payment Tracking** - Mark as paid, overdue alerts, outstanding report
- **Activity Log** - Track all system actions with filters
- **Reports & Export** - Financial summary, outstanding, utility usage, occupancy - export to Excel
- **Bilingual** - Thai and English language support
- **Toast Notifications** - Success/error feedback via react-hot-toast

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 (App Router) | Framework |
| React 19 | UI Library |
| TypeScript 5 | Language |
| PostgreSQL (Neon) | Database |
| Drizzle ORM | Database ORM |
| Tailwind CSS v4 | Styling |
| Better-Auth | Authentication |
| Recharts | Charts |
| react-hot-toast | Notifications |
| next-intl | i18n |
| xlsx (SheetJS) | Excel export |
| lucide-react | Icons |

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Push database schema
npx drizzle-kit push

# 4. Seed initial data
npx tsx src/db/seed.ts

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
┌── app/
    ├── api/              # REST API routes (9 modules)
    └── [locale]/         # Pages (12 routes)
│ components/
    ├── dashboard/        # Dashboard widgets (12 components)
    ├── layout/           # Navigation, search
    └── shared/           # Reusable UI (10 components)
├── db/
    ├── schema/           # 7 database tables
    ├── index.ts          # DB connection
    └── seed.ts           # Seed data
├── hooks/                # use-settings
├── lib/                  # API client, calculators, formatters, export utils
└── types/                # TypeScript interfaces
messages/                 # Translation files (en.json, th.json)
```

---

## API Overview

| Entity | Endpoints | Operations |
|--------|-----------|------------|
| Buildings | /api/buildings | CRUD |
| Rooms | /api/rooms | CRUD |
| Tenants | /api/tenants | CRUD |
| Invoices | /api/invoices | CRUD + payment |
| Meters | /api/meters | Create, Read, Update |
| Rates | /api/rates | CRUD |
| Settings | /api/settings | Read, Upsert |
| Activities | /api/activities | List, Create |
| Dashboard | /api/dashboard | Summary |

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
BETTER_AUTH_URL=http://localhost:3000
```

---

## Screenshots

> (Add screenshots of dashboard, invoices, reports here)

---

## Documentation

See [SYSTEM.md](SYSTEM.md) for full system documentation including database schema, component reference, i18n details, and troubleshooting.

---

## License

THXNXKXT
