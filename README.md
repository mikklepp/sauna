# Sauna Reservation System

A comprehensive sauna reservation system for island communities, featuring offline-capable Island Devices (PWA), web-based user access, automated shared reservations, and club-specific theming.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [PWA & Island Device](#pwa--island-device)
- [Scheduled Jobs](#scheduled-jobs)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

## Overview

This system provides three main interfaces:

1. **Admin Portal** - Configuration and management interface for club administrators
2. **User Web App** - Browser-based reservation system for club members
3. **Island Device (PWA)** - Offline-capable dedicated device for on-island reservations

### Key Capabilities

- Individual and shared sauna reservations
- Automatic "Club Sauna" shared reservations during peak season
- Offline-first Island Device with local scheduled jobs
- Club-specific theming (logo + colors)
- Multi-island, multi-club support
- Real-time availability checking
- Annual reporting for invoicing

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Deployment                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Admin Portal  │  │User Web App  │  │ Island PWA   │     │
│  │  /admin/*    │  │   /app/*     │  │/island/*     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │   API Routes    │                       │
│                   │  /api/*         │                       │
│                   └────────┬────────┘                       │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │ Vercel Postgres │                       │
│                   │    + Prisma     │                       │
│                   └─────────────────┘                       │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │           Vercel Cron Functions                   │     │
│  │  - Midnight: Generate Club Sauna                 │     │
│  │  - 20:00: Evaluate & Convert Club Sauna          │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Island Device (PWA - Offline)                   │
│  ┌──────────────────────────────────────────────────┐      │
│  │           Service Worker                          │      │
│  │  - Intercepts all requests                       │      │
│  │  - Cache-first for static assets                 │      │
│  │  - Network-first with offline fallback           │      │
│  │  - Background sync queue                         │      │
│  └────────────┬─────────────────────────────────────┘      │
│               │                                             │
│  ┌────────────▼─────────────────────────────────────┐      │
│  │         IndexedDB (Local Database)               │      │
│  │  - Clubs, Islands, Saunas, Boats                │      │
│  │  - Reservations (SOURCE OF TRUTH)                │      │
│  │  - Sync queue for pending operations             │      │
│  └────────────┬─────────────────────────────────────┘      │
│               │                                             │
│  ┌────────────▼─────────────────────────────────────┐      │
│  │    Web Workers (Background Tasks)                │      │
│  │  - Midnight: Create Club Sauna locally           │      │
│  │  - 20:00: Evaluate & convert locally             │      │
│  │  - Runs even when browser closed                 │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**User Web App (Online)**

```
User Action → API → Postgres → Backend Sync → Island Device (if online)
                                              └→ Queued if offline
```

**Island Device (Offline)**

```
User Action → IndexedDB (immediate) → Sync Queue
                                    └→ Backend when online
```

**Conflict Resolution**

- Island Device data is ALWAYS the source of truth
- Backend syncs TO Island Device, not from it
- User Web App changes are pending until Island Device confirms

## Features

### Core Functionality

#### Individual Reservations

- Book next available time slot only (no advance booking)
- 1-hour duration, starting at top of hour
- 15-minute cancellation cutoff
- One reservation per boat per island per day
- Heating time consideration (configurable per sauna)

#### Shared Sauna Reservations

- Multiple boats can participate
- Configurable gender schedule (e.g., Women 21:00-22:00, Men 22:00-23:00)
- Can be created for any future date
- Optional name/description
- Not counted toward daily individual reservation limit

#### Automatic "Club Sauna" Feature

- Auto-creates shared reservations during peak season:
  - **High Season**: Every day in June, July, August
  - **Shoulder Season**: Every Friday/Saturday in May, September
- Default schedule: Women 21:00-22:00, Men 22:00-23:00
- Automatic evaluation at 20:00:
  - **< 3 boats**: Cancel and convert participants to individual reservations
  - **≥ 3 boats**: Shared reservation proceeds as planned
- Runs locally on Island Device without internet
- Backend redundancy for web-only access

#### Boat Management

- Search by boat name (primary) or membership number (secondary)
- Daily reservation limit enforced
- Optional captain name and phone number
- Bulk CSV import/export

#### Club Theming

- Customizable logo upload
- Primary and secondary color configuration
- Applied dynamically based on club context
- Logo displayed in navigation and headers

#### Reporting

- Annual statistics per sauna and boat
- Separate tracking for individual vs shared reservations
- CSV and PDF export
- Individual reservations used for invoicing

### Island Device (PWA) Features

- **Full Offline Operation**: All reservation functionality works without internet
- **Local Database**: IndexedDB stores all data locally
- **Scheduled Jobs**: Web Workers run midnight and 20:00 tasks locally
- **Background Sync**: Queues changes and syncs when online
- **Installable**: Add to Home Screen for dedicated device experience
- **Source of Truth**: Island Device data has absolute priority
- **Auto-lock**: Device can be locked to specific island

## Technology Stack

### Frontend

- **Framework**: Next.js 14.2+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context + Zustand
- **Server State**: TanStack Query (React Query)

### Backend

- **API**: Next.js API Routes (REST)
- **Database**: Vercel Postgres
- **ORM**: Prisma
- **File Storage**: Vercel Blob (for logos)
- **Scheduled Jobs**: Vercel Cron Functions

### PWA & Offline

- **PWA Framework**: next-pwa
- **Service Worker**: Workbox
- **Local Database**: IndexedDB + Dexie.js
- **Background Tasks**: Web Workers + Periodic Background Sync API

### Development

- **Testing**: Vitest, React Testing Library, Playwright
- **Linting**: ESLint (strict)
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions

### Deployment

- **Platform**: Vercel
- **Environment**: Node.js 20+
- **Build Tool**: Turbo (optional for monorepo)

## Project Structure

```
sauna-reservation-system/
├── README.md                          # This file
├── package.json                       # Root dependencies
├── next.config.mjs                    # Next.js configuration
├── tsconfig.json                      # TypeScript configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── .env.example                       # Environment variables template
├── .eslintrc.json                     # ESLint configuration
├── .prettierrc                        # Prettier configuration
├── vercel.json                        # Vercel deployment configuration
│
├── prisma/
│   ├── schema.prisma                  # Database schema
│   ├── migrations/                    # Database migrations
│   └── seed.ts                        # Seed data for development
│
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── icons/                         # PWA icons
│   ├── sw.js                          # Service worker (generated)
│   └── workbox-*.js                   # Workbox runtime (generated)
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   │
│   │   ├── admin/                     # Admin Portal
│   │   │   ├── layout.tsx             # Admin layout
│   │   │   ├── page.tsx               # Admin dashboard
│   │   │   ├── clubs/                 # Club management
│   │   │   ├── islands/               # Island management
│   │   │   ├── saunas/                # Sauna management
│   │   │   ├── boats/                 # Boat management
│   │   │   ├── shared-reservations/   # Shared reservation creation
│   │   │   ├── reports/               # Reporting interface
│   │   │   └── theme/                 # Theme editor
│   │   │
│   │   ├── app/                       # User Web App
│   │   │   ├── layout.tsx             # User app layout
│   │   │   ├── auth/                  # Authentication (club secret)
│   │   │   ├── islands/               # Island selection
│   │   │   └── [islandId]/            # Island-specific routes
│   │   │       ├── page.tsx           # Sauna list
│   │   │       ├── reserve/           # Individual reservation flow
│   │   │       ├── shared/            # Shared reservation joining
│   │   │       └── reservations/      # Reservation list
│   │   │
│   │   ├── island-device/             # Island Device PWA
│   │   │   ├── layout.tsx             # Island Device layout
│   │   │   ├── setup/                 # Device configuration
│   │   │   ├── sync/                  # Sync status and controls
│   │   │   └── [islandId]/            # Same as user app but offline-first
│   │   │
│   │   └── api/                       # API Routes
│   │       ├── auth/                  # Authentication endpoints
│   │       ├── clubs/                 # Club CRUD
│   │       ├── islands/               # Island CRUD
│   │       ├── saunas/                # Sauna CRUD + availability
│   │       ├── boats/                 # Boat CRUD + search
│   │       ├── reservations/          # Individual reservations
│   │       ├── shared-reservations/   # Shared reservations
│   │       ├── sync/                  # Island Device sync
│   │       ├── cron/                  # Scheduled jobs
│   │       │   ├── generate-club-sauna.ts
│   │       │   └── evaluate-club-sauna.ts
│   │       └── reports/               # Reporting endpoints
│   │
│   ├── components/                    # React components
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── admin/                     # Admin-specific components
│   │   ├── user/                      # User-facing components
│   │   ├── island-device/             # Island Device components
│   │   └── shared/                    # Shared components
│   │
│   ├── lib/                           # Utilities and helpers
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── auth.ts                    # Authentication utilities
│   │   ├── availability.ts            # Availability calculation logic
│   │   ├── validation.ts              # Validation utilities
│   │   ├── theme.ts                   # Theming utilities
│   │   └── utils.ts                   # General utilities
│   │
│   ├── workers/                       # Web Workers
│   │   ├── club-sauna-generator.ts    # Midnight job
│   │   ├── club-sauna-evaluator.ts    # 20:00 job
│   │   └── sync-worker.ts             # Background sync
│   │
│   ├── db/                            # IndexedDB (Island Device)
│   │   ├── schema.ts                  # IndexedDB schema
│   │   ├── queries.ts                 # IndexedDB queries
│   │   └── sync.ts                    # Sync logic
│   │
│   ├── types/                         # TypeScript types
│   │   ├── index.ts                   # Main types export
│   │   ├── database.ts                # Database types
│   │   └── api.ts                     # API types
│   │
│   └── hooks/                         # Custom React hooks
│       ├── use-club-theme.ts          # Theme hook
│       ├── use-offline-status.ts      # Offline detection
│       └── use-sync-status.ts         # Sync status hook
│
├── tests/                             # Test files
│   ├── unit/                          # Unit tests
│   ├── integration/                   # Integration tests
│   └── e2e/                           # End-to-end tests
│
└── docs/                              # Additional documentation
    ├── API.md                         # API documentation
    ├── DEPLOYMENT.md                  # Deployment guide
    ├── ARCHITECTURE.md                # Architecture details
    ├── ISLAND_DEVICE.md               # Island Device setup guide
    └── PWA.md                         # PWA implementation details
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm/pnpm/yarn
- PostgreSQL database (or Vercel Postgres account)
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/sauna-reservation-system.git
cd sauna-reservation-system
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables))

4. Set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed with sample data (optional)
npx prisma db seed
```

5. Start the development server:

```bash
npm run dev
```

6. Open your browser:

- Admin Portal: http://localhost:3000/admin
- User App: http://localhost:3000/app
- Island Device: http://localhost:3000/island-device

### Development Workflow

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## Database Schema

### Entity Relationship Diagram

```
Club
├── id (UUID)
├── name (String)
├── secret (String, indexed)
├── secretValidFrom (DateTime)
├── secretValidUntil (DateTime)
├── logoUrl (String, nullable)
├── primaryColor (String, nullable)
├── secondaryColor (String, nullable)
├── timezone (String)
└── createdAt (DateTime)

Island
├── id (UUID)
├── clubId (UUID) → Club
├── name (String)
├── numberOfSaunas (Int)
└── createdAt (DateTime)

Sauna
├── id (UUID)
├── islandId (UUID) → Island
├── name (String)
├── heatingTimeHours (Int, default: 2)
├── autoClubSaunaEnabled (Boolean, default: false)
└── createdAt (DateTime)

Boat
├── id (UUID)
├── clubId (UUID) → Club
├── name (String)
├── membershipNumber (String, unique within club)
├── captainName (String, nullable)
├── phoneNumber (String, nullable)
└── createdAt (DateTime)

Reservation (Individual)
├── id (UUID)
├── saunaId (UUID) → Sauna
├── boatId (UUID) → Boat
├── startTime (DateTime)
├── endTime (DateTime)
├── adults (Int)
├── kids (Int, default: 0)
├── status (Enum: ACTIVE, COMPLETED, CANCELLED)
├── createdAt (DateTime)
└── cancelledAt (DateTime, nullable)

SharedReservation
├── id (UUID)
├── saunaId (UUID) → Sauna
├── date (Date)
├── startTime (Time)
├── malesDurationHours (Int)
├── femalesDurationHours (Int)
├── genderOrder (Enum: MALES_FIRST, FEMALES_FIRST)
├── name (String, nullable)
├── isAutoGenerated (Boolean, default: false)
├── autoCancelledAt (DateTime, nullable)
├── convertedToIndividual (Boolean, default: false)
├── createdBy (String, nullable)
└── createdAt (DateTime)

SharedReservationParticipant
├── id (UUID)
├── sharedReservationId (UUID) → SharedReservation
├── boatId (UUID) → Boat
├── adults (Int)
├── kids (Int, default: 0)
└── joinedAt (DateTime)
```

### Key Indexes

- `Club.secret` - Fast club secret lookup
- `Boat.membershipNumber` - Unique boat identification
- `Reservation.startTime` - Availability queries
- `Reservation.saunaId, date` - Daily reservation checks
- `SharedReservation.date, saunaId` - Club Sauna lookups

### Prisma Schema Location

See `prisma/schema.prisma` for the complete schema definition.

## API Documentation

### Authentication

All user-facing endpoints require club secret authentication via cookie or header.

**Validate Club Secret**

```
POST /api/auth/validate-club-secret
Body: { secret: string }
Response: { valid: boolean, clubId: string, expiresAt: string }
```

### Clubs

```
GET    /api/clubs                      # List all clubs (admin)
POST   /api/clubs                      # Create club (admin)
GET    /api/clubs/:id                  # Get club details
PUT    /api/clubs/:id                  # Update club (admin)
DELETE /api/clubs/:id                  # Delete club (admin)
GET    /api/clubs/:id/config           # Get club configuration (includes islands, saunas, boats)
POST   /api/clubs/:id/theme            # Update club theme (logo, colors)
GET    /api/clubs/:id/qr-code          # Generate QR code for club access
```

### Islands

```
GET    /api/clubs/:clubId/islands      # List islands for club
POST   /api/islands                    # Create island (admin)
GET    /api/islands/:id                # Get island details
PUT    /api/islands/:id                # Update island (admin)
DELETE /api/islands/:id                # Delete island (admin)
```

### Saunas

```
GET    /api/islands/:islandId/saunas   # List saunas for island
POST   /api/saunas                     # Create sauna (admin)
GET    /api/saunas/:id                 # Get sauna details
PUT    /api/saunas/:id                 # Update sauna (admin)
DELETE /api/saunas/:id                 # Delete sauna (admin)
GET    /api/saunas/:id/next-available  # Get next available time slot
GET    /api/saunas/:id/reservations    # Get reservations for sauna (date filter)
```

### Boats

```
GET    /api/clubs/:clubId/boats        # List boats for club
POST   /api/boats                      # Create boat (admin)
GET    /api/boats/:id                  # Get boat details
PUT    /api/boats/:id                  # Update boat (admin)
DELETE /api/boats/:id                  # Delete boat (admin)
GET    /api/boats/search               # Search boats (query param: q)
POST   /api/boats/bulk-import          # Bulk import from CSV (admin)
GET    /api/boats/:id/daily-limit      # Check if boat can reserve (islandId, date params)
```

### Individual Reservations

```
POST   /api/reservations               # Create reservation
      Body: { saunaId, boatId, startTime, adults, kids }
DELETE /api/reservations/:id           # Cancel reservation (15-min cutoff)
GET    /api/reservations/:id           # Get reservation details
```

### Shared Reservations

```
GET    /api/shared-reservations        # List shared reservations (filters: saunaId, date)
POST   /api/shared-reservations        # Create shared reservation (admin)
GET    /api/shared-reservations/:id    # Get shared reservation with participants
DELETE /api/shared-reservations/:id    # Cancel shared reservation (admin)
POST   /api/shared-reservations/:id/join  # Join shared reservation
      Body: { boatId, adults, kids }
```

### Island Device Sync

```
POST   /api/sync/push                  # Push changes from Island Device
      Body: { islandId, changes: [...] }
GET    /api/sync/pull/:islandId        # Pull changes for Island Device
POST   /api/sync/resolve-conflict      # Resolve sync conflict (Island Device wins)
GET    /api/sync/status/:islandId      # Get sync status
```

### Scheduled Jobs (Cron)

```
POST   /api/cron/generate-club-sauna   # Generate Club Sauna reservations (daily at midnight)
POST   /api/cron/evaluate-club-sauna   # Evaluate and convert Club Sauna (daily at 20:00)
```

### Reports

```
GET    /api/reports/sauna/:saunaId     # Annual report for sauna
      Query: year (default: current year)
GET    /api/reports/boat/:boatId       # Annual report for boat
      Query: year (default: current year)
GET    /api/reports/club/:clubId       # Annual report for club
      Query: year (default: current year)
POST   /api/reports/export             # Export report to CSV/PDF
      Body: { type, filters, format }
```

## PWA & Island Device

### PWA Features

The Island Device mode is a Progressive Web App with full offline capabilities:

- **Installable**: Can be added to device home screen
- **Offline-first**: All functionality works without internet
- **Background Sync**: Queues operations and syncs when online
- **Scheduled Tasks**: Runs Club Sauna jobs locally using Web Workers
- **Local Database**: IndexedDB stores all data with Dexie.js wrapper

### Service Worker Strategy

**Static Assets**: Cache-first with cache invalidation

```javascript
// CSS, JS, images, fonts
precacheAndRoute([...])
```

**API Calls**: Network-first with offline fallback

```javascript
// Reservations, availability checks
registerRoute(
  /^\/api\/.*/,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [...]
  })
)
```

**Background Sync**: Queue operations when offline

```javascript
// Reservations made offline
const bgSyncPlugin = new BackgroundSyncPlugin('reservations-queue', {
  maxRetentionTime: 24 * 60, // 24 hours
});
```

### IndexedDB Schema

```javascript
// Dexie.js schema
const db = new Dexie('SaunaReservations');

db.version(1).stores({
  clubs: 'id, secret',
  islands: 'id, clubId',
  saunas: 'id, islandId',
  boats: 'id, clubId, membershipNumber',
  reservations: 'id, saunaId, startTime, boatId',
  sharedReservations: 'id, saunaId, date',
  sharedParticipants: 'id, sharedReservationId, boatId',
  syncQueue: '++id, timestamp, type',
});
```

### Web Workers for Scheduled Jobs

**Midnight Job** - Generate Club Sauna

```javascript
// workers/club-sauna-generator.ts
// Runs at 00:00 local time
// Checks current date against season rules
// Creates SharedReservation in IndexedDB
// Marks for sync when online
```

**20:00 Job** - Evaluate Club Sauna

```javascript
// workers/club-sauna-evaluator.ts
// Runs at 20:00 local time
// Counts participants for today's Club Sauna
// If < 3: Cancels and creates individual reservations
// If >= 3: No action needed
// Updates in IndexedDB
```

### Island Device Setup

See [docs/ISLAND_DEVICE.md](docs/ISLAND_DEVICE.md) for complete setup guide.

**Quick Setup**:

1. Admin assigns device to island in portal
2. Navigate to `/island-device/setup?token=[setup-token]`
3. Download configuration package
4. Install PWA (Add to Home Screen)
5. Device enters locked island mode
6. Ready for offline operation

### Browser Support

| Feature         | Chrome/Edge | Safari     | Firefox    |
| --------------- | ----------- | ---------- | ---------- |
| Service Worker  | ✅          | ✅         | ✅         |
| IndexedDB       | ✅          | ✅         | ✅         |
| Background Sync | ✅          | ⚠️ Limited | ⚠️ Limited |
| Periodic Sync   | ✅          | ❌         | ❌         |
| Web Workers     | ✅          | ✅         | ✅         |

**Fallback Strategy**: For browsers without Periodic Background Sync, Web Workers run scheduled tasks when the app is open.

## Scheduled Jobs

### Backend Jobs (Vercel Cron)

**Generate Club Sauna** - Daily at 00:00 UTC

```
0 0 * * * → /api/cron/generate-club-sauna
```

- Creates shared reservations for eligible saunas
- Checks date against season rules (June-Aug, May/Sept Fri-Sat)
- Default schedule: Women 21:00-22:00, Men 22:00-23:00

**Evaluate Club Sauna** - Daily at 20:00 UTC

```
0 20 * * * → /api/cron/evaluate-club-sauna
```

- Counts participants for today's Club Sauna
- Cancels and converts if < 3 boats
- Creates individual reservations automatically

### Island Device Jobs (Web Workers)

Same logic runs locally on Island Device:

- Uses device's local time (not UTC)
- Works completely offline
- No internet connectivity required
- Syncs results to backend when online

### Timezone Handling

- Each club has a timezone (e.g., "Europe/Helsinki")
- Backend cron jobs convert UTC to club timezone
- Island Device uses device's local time (set to club timezone)
- All scheduled tasks respect club timezone

## Testing

### Unit Tests

Run with Vitest:

```bash
npm test
```

Test files located in `tests/unit/`:

- Business logic (availability, validation)
- Utility functions
- React hooks
- Database queries

### Integration Tests

Test API endpoints:

```bash
npm run test:integration
```

Test files located in `tests/integration/`:

- API route handlers
- Database interactions
- Authentication flows
- Sync protocol

### E2E Tests

Run with Playwright:

```bash
npm run test:e2e
```

Test files located in `tests/e2e/`:

- User reservation flows
- Admin configuration
- Island Device offline mode
- Club Sauna automation

### PWA Tests

Test offline functionality:

```bash
npm run test:pwa
```

Includes:

- Service worker caching
- IndexedDB operations
- Background sync
- Scheduled tasks

### Coverage

Generate coverage report:

```bash
npm run test:coverage
```

Target: 80%+ coverage for critical paths

## Deployment

### Vercel Deployment

The application is designed for Vercel with automatic deployments:

**Environments**:

- **Production**: `main` branch → production.vercel.app
- **Staging**: `develop` branch → staging.vercel.app
- **Preview**: Pull requests → unique preview URLs

**Setup**:

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up Vercel Postgres database
4. Configure Vercel Cron for scheduled jobs
5. Deploy!

### Environment Configuration

See [Environment Variables](#environment-variables) section.

### Database Migrations

Production migrations:

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

Vercel runs these automatically via build script.

### Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-club-sauna",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/evaluate-club-sauna",
      "schedule": "0 20 * * *"
    }
  ]
}
```

### Custom Domains

Configure per-club custom domains in Vercel:

- club1.saunareservations.com → Admin sets club1 as identifier
- club2.saunareservations.com → Admin sets club2 as identifier

## Environment Variables

Create `.env` file with:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Admin Authentication (simple password for MVP)
ADMIN_PASSWORD="your-secure-password"

# Vercel Blob (for logo uploads)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# PWA
NEXT_PUBLIC_PWA_ENABLED="true"

# Timezone (default for new clubs)
DEFAULT_TIMEZONE="Europe/Helsinki"

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your-analytics-id"

# Optional: Error Tracking
SENTRY_DSN="your-sentry-dsn"

# Cron Secret (to secure cron endpoints)
CRON_SECRET="your-random-secret"
```

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_PASSWORD` - Admin portal password
- `BLOB_READ_WRITE_TOKEN` - For logo uploads (get from Vercel)

### Optional Variables

- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` - Vercel Analytics
- `SENTRY_DSN` - Error tracking
- `CRON_SECRET` - Secure cron endpoints

## Contributing

### Development Guidelines

1. **Code Style**
   - Follow TypeScript strict mode
   - Use ESLint and Prettier (auto-format on save)
   - Write descriptive commit messages (Conventional Commits)

2. **Testing Requirements**
   - Write tests for new features
   - Maintain 80%+ coverage for critical paths
   - All tests must pass before merging

3. **Pull Request Process**
   - Create feature branch from `develop`
   - Write clear PR description
   - Request code review
   - Ensure CI passes
   - Squash and merge

4. **Branching Strategy**
   - `main` - Production-ready code
   - `develop` - Integration branch
   - `feature/*` - New features
   - `fix/*` - Bug fixes
   - `hotfix/*` - Urgent production fixes

### Code Review Checklist

- [ ] TypeScript types are correct and comprehensive
- [ ] Error handling is implemented
- [ ] Loading states are shown to users
- [ ] Accessibility standards are met (WCAG 2.1)
- [ ] Mobile responsive design works
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Performance is acceptable

## Troubleshooting

### Common Issues

**Database Connection Errors**

```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Reset database (development only!)
npx prisma migrate reset
```

**PWA Not Installing**

```bash
# Check manifest is accessible
curl http://localhost:3000/manifest.json

# Check service worker is registered
# Open DevTools → Application → Service Workers

# Clear service worker cache
# DevTools → Application → Clear Storage
```

**Scheduled Jobs Not Running (Island Device)**

```bash
# Check Web Worker is running
# DevTools → Sources → Web Workers

# Check IndexedDB for job state
# DevTools → Application → IndexedDB

# Manually trigger job for testing
# Call worker.postMessage({ type: 'run-midnight-job' })
```

**Sync Issues**

```bash
# Check sync queue in IndexedDB
# DevTools → Application → IndexedDB → syncQueue

# Check network requests
# DevTools → Network → Filter by 'sync'

# Force sync from Island Device UI
# Click "Sync Now" button
```

### Debug Mode

Enable debug logging:

```bash
# In .env.local
DEBUG=true
NEXT_PUBLIC_DEBUG=true
```

View logs:

- Browser console for frontend logs
- Vercel logs for backend/API logs
- Service worker logs in DevTools

### Performance Issues

**Slow API Responses**

- Check database indexes
- Review Prisma query performance
- Enable query logging: `prisma.log = ['query']`

**Large Bundle Size**

- Run bundle analyzer: `npm run analyze`
- Check for duplicate dependencies
- Lazy load heavy components

**Slow PWA**

- Reduce IndexedDB data size
- Optimize service worker cache strategy
- Profile with Lighthouse

## License

[Your License Here - e.g., MIT]

## Support

For issues and questions:

- GitHub Issues: [repository-url]/issues
- Documentation: [repository-url]/docs
- Email: support@saunareservations.com

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

**Built with Next.js, TypeScript, and PWA technology for offline-first island device operation.**
