# AquaVolt - Dormitory Management System

> Dormitory Utility Management System  
> Version: 1.0.0  
> Stack: Next.js 16 + React 19 + TypeScript + PostgreSQL + Drizzle ORM

---

## 1. System Overview

**AquaVolt** is a comprehensive dormitory management system for utility billing, tenant management, and financial reporting.

### Core Features
- Building / Room / Tenant CRUD management
- Monthly water & electric meter recording
- Automated utility cost calculation
- Invoice generation with WiFi billing support
- Payment tracking & overdue alerts
- 6-month revenue chart with breakdown by category
- Export reports to Excel (financial, outstanding, utility, occupancy)
- Activity logging for all system actions
- Bilingual support (Thai / English)
- Toast notifications (react-hot-toast)
- Error boundary with graceful fallback
- Animated counters and progress bars
- Dashboard auto-refresh on visibility change

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| Auth | Better-Auth |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Excel Export | xlsx (SheetJS) |
| Toast | react-hot-toast |
| i18n | next-intl |
| Icons | lucide-react |

---

## 3. Installation

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or Neon)

### Setup

bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL and BETTER_AUTH_URL

# 3. Push database schema
npx drizzle-kit push

# 4. Seed initial data
npx tsx src/db/seed.ts

# 5. Start development server
npm run dev

### Environment Variables

env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
BETTER_AUTH_URL=http://localhost:3000

---

## 4. Project Structure
```
src/
  app/
    layout.tsx            # Root layout (metadata + ClientLayout for toast)
    globals.css           # Global styles + Tailwind
    api/                  # REST API routes
      buildings/          # CRUD buildings
      rooms/              # CRUD rooms
      tenants/            # CRUD tenants
      invoices/           # CRUD invoices
      meters/             # CRUD meter readings
      rates/              # CRUD utility rates
      settings/           # Key-value settings
      activities/         # Activity log
      dashboard/          # Dashboard summary
      auth/               # Better-auth authentication
    [locale]/             # Localized pages
      dashboard/          # Dashboard overview
      rooms/              # Room management
      tenants/            # Tenant management
      invoices/           # Invoice list & create
      invoices/[id]/      # Invoice detail & print
      meters/             # Meter recording
      buildings/          # Building management
      rates/              # Rate management
      settings/           # System settings
      activity/           # Activity log
      reports/            # Reports & export
      login/              # Login page
  components/
    dashboard/            # Dashboard widgets (12 components)
    layout/               # Navigation, search bar
    shared/               # Reusable UI (SelectApple, Pagination, etc.)
  db/
    schema/               # Drizzle table definitions (7 tables)
    index.ts              # Database connection
    seed.ts               # Seed data
  hooks/
    use-settings.ts       # Settings hook (localStorage + API sync)
  lib/
    api.ts                # API client functions
    calculators.ts        # Utility cost calculator
    formatters.ts         # Date/currency/string formatters
    export-utils.ts       # Excel export utility
    error-utils.ts        # Error handling helper with toast
  types/
    index.ts              # TypeScript interfaces
messages/
  en.json                 # English translations
  th.json                 # Thai translations
drizzle/                  # Database migrations
public/img/               # Images
```
---

## 5. Database Schema

### Entity Relationship

buildings ──1:N── rooms ──1:N── tenants
                          │
                          └──1:N── meter_readings
                          │
                          └──1:N── invoices

settings (key-value store)
activities (event log)

### buildings
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| name | text | Building name |
| address | text | Address |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### rooms
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| buildingId | text FK | References buildings.id |
| roomNumber | text | Room number |
| floor | integer | Floor |
| status | text | vacant / occupied / maintenance |
| rentalFee | numeric | Monthly rent |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### tenants
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| roomId | text FK | References rooms.id |
| name | text | Tenant name |
| phone | text | Phone number |
| lineId | text | LINE ID |
| moveInDate | timestamp | Move-in date |
| moveOutDate | timestamp nullable | Move-out date |
| contractDuration | integer | Contract length (months) |
| isActive | boolean | Active status |
| wifiEnabled | boolean | WiFi billing enabled |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### invoices
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| roomId | text FK | References rooms.id |
| tenantId | text | |
| meterReadingId | text nullable | |
| month | integer | Billing month |
| year | integer | Billing year |
| invoiceNumber | text | Invoice number |
| rentalCost | numeric | Room rent |
| waterCost | numeric | Water charge |
| electricCost | numeric | Electric charge |
| serviceCharge | numeric | Service fee |
| wifiCost | numeric | WiFi fee |
| totalAmount | numeric | Total |
| status | text | pending / paid / overdue / cancelled |
| issuedDate | timestamp | Issue date |
| dueDate | timestamp | Due date |
| paidDate | timestamp nullable | Payment date |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### meter_readings
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| roomId | text FK | References rooms.id |
| month | integer | Month |
| year | integer | Year |
| waterPrevious | text | Previous water reading |
| waterCurrent | text | Current water reading |
| waterUsage | text | Water usage |
| electricPrevious | text | Previous electric reading |
| electricCurrent | text | Current electric reading |
| electricUsage | text | Electric usage |
| notes | text nullable | Notes |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### settings (Key-Value)
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| key | text unique | Setting key |
| value | text | Setting value |

### activities
| Column | Type | Description |
|--------|------|-------------|
| id | text PK | UUID |
| type | text | meter / invoice / tenant / room |
| action | text | Action description |
| detail | text | Detail text |
| createdAt | timestamp | |

---

## 6. API Routes

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| GET | /api/buildings | yes | List buildings |
| POST | /api/buildings | yes | Create building |
| GET | /api/buildings/:id | yes | Get building |
| PATCH | /api/buildings/:id | yes | Update building |
| DELETE | /api/buildings/:id | yes | Delete building |
| GET | /api/rooms | yes | List rooms (with building name) |
| POST | /api/rooms | yes | Create room |
| GET | /api/rooms/:id | yes | Get room |
| PATCH | /api/rooms/:id | yes | Update room |
| DELETE | /api/rooms/:id | yes | Delete room |
| GET | /api/tenants | yes | List tenants (with room/building) |
| POST | /api/tenants | yes | Create tenant |
| GET | /api/tenants/:id | yes | Get tenant |
| PATCH | /api/tenants/:id | yes | Update tenant |
| DELETE | /api/tenants/:id | yes | Delete tenant |
| GET | /api/invoices | yes | List invoices (with details) |
| POST | /api/invoices | yes | Create invoice |
| GET | /api/invoices/:id | yes | Get invoice |
| PATCH | /api/invoices/:id | yes | Update invoice |
| GET | /api/meters | yes | List meter readings |
| POST | /api/meters | yes | Create reading (calculates usage) |
| PATCH | /api/meters/:id | yes | Update reading |
| GET | /api/rates | yes | List utility rates |
| POST | /api/rates | yes | Create rate |
| PATCH | /api/rates/:id | yes | Update rate |
| DELETE | /api/rates/:id | yes | Delete rate |
| GET | /api/settings | yes | Get all settings |
| PATCH | /api/settings | yes | Upsert settings (key-value) |
| GET | /api/activities | yes | List activities |
| POST | /api/activities | yes | Create activity log |
| GET | /api/dashboard | yes | Dashboard summary data |
| POST | /api/auth/* | no | Better-auth authentication |

---

## 7. Pages

| Path | Page | Description |
|------|------|-------------|
| /dashboard | Dashboard | Summary: rooms, revenue, occupancy, recent activity |
| /rooms | Rooms | CRUD room management with building/status filters |
| /tenants | Tenants | CRUD tenant management with WiFi toggle |
| /invoices | Invoices | List invoices, create new, filter by month/status |
| /invoices/:id | Invoice Detail | View invoice, print, mark as paid |
| /meters | Meters | Record meter readings with month/room filters |
| /buildings | Buildings | CRUD building management |
| /rates | Rates | CRUD utility rate management |
| /settings | Settings | Configure rates, payment info, WiFi fee |
| /activity | Activity | Activity log with type/month/search filters |
| /reports | Reports | Financial/Outstanding/Utility/Occupancy reports + Excel export |
| /login | Login | Authentication page |

---

## 8. Features

### Dashboard
- 4 metric cards: rooms, buildings, tenants, monthly revenue
- Collection rate with progress bar and animated number
- Meter reading status with progress bar
- Room grid (12 rooms) with status indicators
- Average water/electric usage with progress bars
- Top 3 water/electric usage ranking
- Revenue donut chart (rent, water, electric, service, WiFi)
- 6-month revenue bar chart
- Contract status (active/expiring/expired)
- Recent invoices (5 latest)
- Recent activities (5 latest)
- Overdue invoice alert
- Auto-refresh on page visibility change

### Invoice Features
- Create invoice from meter readings
- Auto-calculate utility costs
- Preview with breakdown before creating
- Support WiFi fee (if tenant has WiFi enabled)
- Print invoice view with CSS @media print
- Mark as paid with date recording
- Duplicate detection warning
- Filter by month and status
- Sorting by issue date (newest first)

### Meter Recording
- Auto-compute water/electric usage (current - previous)
- Smart room selection: shows meter status
- Pre-fill previous readings from last entry
- Month filter
- Room status indicators (occupied/vacant/maintenance)

### Tenant Management
- Redesigned form with sections (Personal Info, Room & Contract, Additional Services)
- WiFi fee checkbox
- Auto-update room status (occupied/vacant)
- Contract duration tracking (6/12/24 months)

### Reports
- Financial Summary: per-invoice breakdown with all cost categories
- Outstanding: filtered unpaid invoices with overdue days
- Utility Usage: water/electric sorted by usage (highest first)
- Occupancy: by building with rates
- All reports exportable to Excel (.xlsx)

---

## 9. Components

### Dashboard Components (12)
| Component | Props | Description |
|-----------|-------|-------------|
| MetricCards | totals, counts | 4 summary cards |
| RevenueCard | invoices, chart data | Donut + bar chart + breakdown |
| QuickActions | - | 4 shortcut buttons (memoized) |
| CollectionRate | rate, paid/total | Progress bar + animated number (memoized) |
| MeterStatus | read/unread counts | Progress bar + button (memoized) |
| RoomGridUsage | rooms, averages | Room grid + utility progress bars |
| ContractStatusCard | stats (active/expiring/expired) | Contract summary |
| OverdueAlert | invoices, max days | Red alert with amount |
| RecentActivity | activities, timeAgo fn | Activity timeline |
| RecentInvoices | invoices | 5 latest invoices |

### Shared Components (10)
| Component | Description |
|-----------|-------------|
| AnimatedNumber | Count up animation (0 to target) |
| AnimatedProgressBar | Width animation with CSS transition |
| SelectApple | Custom select dropdown |
| StatusBadge | Color-coded status pill |
| Pagination | Page controls |
| EmptyState | "No data" placeholder |
| FieldError | Validation error message |
| ConfirmDialog | Delete confirmation modal |
| ErrorBoundary | React error boundary with reload |
| LocaleSwitcher | Language switcher |

---

## 10. i18n

System uses 
ext-intl with two language files:
- messages/en.json — English
- messages/th.json - Thai

### Translation Sections
- nav, auth, dashboard, buildings, rooms, tenants, invoices, meters, rates, settings, common, reports, toast

### Usage
tsx
// In any client component:
const t = useTranslations();
t("dashboard.totalRooms")       // -> "Total Rooms"
t("toast.roomCreated")          // -> "Room created successfully"
t("reports.daysOverdue", { days: 3 })  // -> "3 day(s)"

### Total Keys
| Language | Keys |
|----------|:----:|
| English | ~360 |
| Thai | ~360 |

---

## 11. Error Handling

### Toast Notifications (react-hot-toast)
| Context | Type | Message Key |
|---------|------|-------------|
| Room created | success | toast.roomCreated |
| Room updated | success | toast.roomUpdated |
| Room deleted | success | toast.roomDeleted |
| Tenant created | success | toast.tenantCreated |
| Tenant updated | success | toast.tenantUpdated |
| Tenant deleted | success | toast.tenantDeleted |
| Invoice created | success | toast.invoiceCreated |
| Invoice paid | success | toast.invoicePaid |
| Building created | success | toast.buildingCreated |
| Building updated | success | toast.buildingUpdated |
| Building deleted | success | toast.buildingDeleted |
| Meter saved | success | toast.meterSaved |
| Settings saved | success | toast.settingsSaved |
| Dashboard load error | error | toast.dashboardError |

### Error Boundary
- Wraps dashboard to catch render errors
- Shows fallback UI with reload button

### safeApi Utility
- Wraps API calls with auto-toast on error
- Returns [data, error] tuple

---

## 12. Troubleshooting

### Build fails with TypeScript error
Run 
px tsc --noEmit to check. Ensure all imported types match.

### API returns 500
Check DATABASE_URL. Run 
px drizzle-kit push to sync schema.

### Missing translation errors
Add missing key to both messages/en.json and messages/th.json.

### Toast not appearing
Ensure <ClientLayout> wraps children in root layout.

### Better Auth warning
Set BETTER_AUTH_URL in .env.

### Dashboard data stale
Dashboard auto-refreshes on focus and visibility change. Navigate away and back.

---

## License

THXNXKXT - AquaVolt Dormitory Management System
