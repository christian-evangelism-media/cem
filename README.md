# CEM (Christian Evangelism Media)

A monorepo containing all CEM applications with end-to-end type safety via Tuyau.

## Repository Structure

```
cem/
├── packages/
│   ├── api/            Backend API (AdonisJS)
│   │   └── .adonisjs/  Generated API types (Tuyau)
│   ├── web/            Public website (React)
│   ├── ops/            Staff operations panel (React)
│   └── scanner/        Mobile app for warehouse (Ionic/React)
└── package.json        Workspace configuration
```

## Quick Start

### Install Dependencies

```bash
npm install
```

This installs dependencies for all packages in the monorepo.

### Development

Run individual packages:

```bash
# Backend API
npm run dev:api

# Public website
npm run dev:web

# Operations panel
npm run dev:ops

# Scanner app
npm run dev:scanner
```

### Building

Build all packages:

```bash
npm run build:all
```

Or build individually:

```bash
npm run build:api
npm run build:web
npm run build:ops
npm run build:scanner
```

## Type Safety with Tuyau

This monorepo uses [Tuyau](https://tuyau.dev) to generate TypeScript types from the API routes, providing end-to-end type safety between the backend and all frontends.

### Workflow

**Important:** When you modify API routes, controllers, or request/response structures, you MUST regenerate types:

```bash
npm run generate:types
```

This command:
1. Analyzes all API routes in `packages/api`
2. Generates TypeScript definitions in `packages/api/.adonisjs/`
3. Makes types available to web, ops, and scanner packages

### When to Regenerate Types

Run `npm run generate:types` after:
- Adding/removing API endpoints
- Changing request parameters
- Modifying response structures
- Updating controller return types

### Type Generation in Development

For the best developer experience:

1. Make API changes
2. Run `npm run generate:types`
3. Frontend apps immediately see updated types
4. TypeScript compiler catches any mismatches

## Project Structure

### packages/api

AdonisJS 6 backend providing:
- RESTful API
- Authentication (session-based)
- PostgreSQL database (Lucid ORM)
- Email service (Resend)
- Health checks
- Maintenance mode
- Emergency lockdown

**Dev server:** `npm run dev:api` (port 3333)

### packages/web

React 19 public website where users:
- Browse Christian evangelism media
- Place orders
- Manage addresses and preferences
- View order history

**Dev server:** `npm run dev:web` (port 5173)

### packages/ops

React 19 operations panel for staff:
- Dashboard with statistics
- Orders queue management
- Messages queue
- User management
- Media management
- Health monitoring
- Maintenance mode control

**Dev server:** `npm run dev:ops` (port 5173)

### packages/scanner

Ionic/React mobile app for warehouse:
- Barcode scanning
- Order fulfillment (ship/unship)
- Batch operations

**Dev server:** `npm run dev:scanner` (port 5173)

## Database

### Setup

```bash
cd packages/api
cp .env.example .env
# Configure database credentials in .env
npm run migration:run
```

### Migrations

```bash
cd packages/api
node ace make:migration <name>
node ace migration:run
```

## Environment Variables

Each package requires its own `.env` file:

### packages/api/.env
- `DATABASE_URL` - PostgreSQL connection
- `RESEND_API_KEY` - Email service API key
- `RESEND_FROM_EMAIL` - Email sender address (e.g., noreply@yourdomain.com)
- `SESSION_DRIVER` - Session storage
- `APP_KEY` - Encryption key

### packages/web/.env
- `VITE_API_URL` - API endpoint

### packages/ops/.env
- `VITE_API_URL` - API endpoint

### packages/scanner/.env
- `VITE_API_URL` - API endpoint

## Deployment

### API (Production)

```bash
cd packages/api
npm run build
cd build
npm ci --omit=dev
node bin/server.js
```

### Frontends (Production)

```bash
# Web
cd packages/web
npm run build
# Deploy dist/ to static hosting

# Ops
cd packages/ops
npm run build
# Deploy dist/ to static hosting

# Scanner
cd packages/scanner
npm run build
npx cap sync android
npx cap open android
# Build APK in Android Studio
```

## Tech Stack

- **Backend:** AdonisJS 6, PostgreSQL, Lucid ORM
- **Frontends:** React 19, TypeScript, Vite
- **UI:** TailwindCSS v4, DaisyUI
- **State:** TanStack Query
- **i18n:** i18next (frontend), @adonisjs/i18n (backend)
- **Mobile:** Ionic, Capacitor
- **Type Safety:** Tuyau
- **Email:** Resend

## License

Dual-licensed under MIT OR The Unlicense.

## Important Notes

### Type Generation is Required

**The frontends will not have correct types until you run `npm run generate:types`** after API changes. This is the trade-off for having automatic type generation - you must remember to run the command.

### Monorepo Benefits

- ✅ Single source of truth for types
- ✅ Atomic commits across API + frontends
- ✅ Shared dependencies and tooling
- ✅ Easier refactoring
- ✅ Consistent versioning

### Git Workflow

Since all packages are in one repository:

```bash
# Make changes across multiple packages
git add .
git commit -m "Add feature to API, web, and ops"
git push
```

One commit can update the API and all consuming frontends together.
