# CEM API

Backend API for the Christian Evangelism Media (CEM) platform, providing authentication, media management, order processing, and role-based access control.

## Tech Stack

- **AdonisJS 6** - Node.js web framework
- **PostgreSQL** - Database with JSONB support for multi-language content
- **TypeScript** - Type-safe JavaScript
- **Lucid ORM** - Database abstraction layer
- **Vinejs** - Validation library
- **Resend** - Email delivery service
- **Edge** - Template engine for emails

## Features

- **Authentication & Authorization**
  - Session-based authentication with cookies
  - Email verification system
  - Role-based access control (super_admin, admin, support, user)
  - Rate limiting on auth endpoints

- **Media Management**
  - Multi-language support (30 languages)
  - i18n fields for name, description, and type
  - PDF file management (digital and press-ready versions)
  - Draft/published workflow with visibility control
  - Creator tracking for ownership-based permissions

- **Order Processing**
  - Cart management
  - Order creation and tracking
  - Status updates (pending, processing, shipped, delivered)

- **User Management**
  - Admin-created users with auto-generated passwords
  - Address management
  - Language preference system

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/christian-evangelism-media/cem.git
   cd cem/packages/api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure the following:
   ```env
   # Database
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=cem

   # Application
   APP_KEY=                    # Generate with: node ace generate:key
   PORT=3333
   HOST=localhost
   NODE_ENV=development

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173

   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key_here

   # Session
   SESSION_DRIVER=cookie

   # Rate limiting
   LIMITER_STORE=database
   ```

4. **Generate application key**
   ```bash
   node ace generate:key
   ```
   Copy the generated key to `APP_KEY` in your `.env` file.

5. **Run database migrations**
   ```bash
   node ace migration:run
   ```

6. **Seed the database (optional)**
   ```bash
   node ace db:seed
   ```

## Development

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3333`.

## Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Copy environment file to build directory:**
   ```bash
   cp .env build/.env
   ```

3. **Install production dependencies:**
   ```bash
   cd build
   npm ci --omit="dev"
   ```

4. **Run with PM2 (recommended for multi-core servers):**
   ```bash
   # Install PM2 globally (one time)
   npm install -g pm2

   # Start in cluster mode (uses all CPU cores)
   pm2 start bin/server.js -i max --name api --log ./logs

   # Configure auto-restart on server reboot
   pm2 startup
   pm2 save

   # Useful PM2 commands:
   pm2 status              # View all processes
   pm2 logs api        # View logs (all instances merged)
   pm2 restart api     # Restart all instances
   pm2 stop api        # Stop all instances
   pm2 delete api      # Remove from PM2
   ```

   **Note:** When rebuilding, remember to:
   ```bash
   npm run build
   cp .env build/.env
   pm2 restart api
   ```

5. **Or run directly (single process):**
   ```bash
   node bin/server.js
   ```

## Database

### Initial Database Setup

**For Development:**

Create the database using the postgres superuser:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cem;
```

Update your `.env`:
```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=cem
```

**For Production:**

Production uses a two-user approach for security:
- **postgres** (or superuser) - for running migrations
- **cem_user** (limited privileges) - for running the application

1. **Create the database and restricted user:**
   ```bash
   # Generate a secure password for cem_user
   openssl rand -base64 32

   # Edit database/init.sql and replace 'your_secure_password' with generated password
   # Then run the init script as postgres
   psql -U postgres < database/init.sql
   ```

2. **Run migrations with postgres user:**
   ```bash
   # Temporarily set postgres credentials in .env
   DB_USER=postgres
   DB_PASSWORD=postgres_admin_password

   # Run migrations
   node ace migration:run
   ```

3. **Run the application with restricted user:**
   ```bash
   # Update .env for runtime
   DB_USER=cem_user
   DB_PASSWORD=your_generated_password

   # Start the application
   npm start
   ```

This ensures migrations can modify the schema, but the running application has limited database privileges (cannot ALTER/DROP tables, create users, or access other databases).

### Docker Setup (Development)

The project can use a PostgreSQL container for local development.

**Start the database:**
```bash
docker start cem-postgres
```

**Stop the database:**
```bash
docker stop cem-postgres
```

**Restart the database:**
```bash
docker restart cem-postgres
```

**Check if running:**
```bash
docker ps | grep cem-postgres
```

The container is configured to auto-restart on system reboot and runs on port 5432 with the `cem` database.

### Running Migrations

```bash
# Run pending migrations
node ace migration:run

# Rollback last batch
node ace migration:rollback

# Refresh database (rollback all + run all)
node ace migration:refresh
```

### Creating a Super Admin

The first super_admin must be created directly in the database:

```bash
# Connect to PostgreSQL
PGPASSWORD=your_password psql -U postgres -d cem

# Promote an existing user to super_admin
UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

After this, the super_admin can create other admins through the admin panel.

## API Endpoints

### Public Endpoints

- `POST /register` - Register new user
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /me` - Get current user
- `POST /verify-email` - Verify email
- `GET /media` - List media (with filters)
- `GET /media/:id` - Get single media item

### Authenticated Endpoints

- `GET /cart` - Get cart items
- `POST /cart` - Add to cart
- `DELETE /cart/:id` - Remove from cart
- `GET /orders` - List user's orders
- `POST /orders` - Create order
- `GET /addresses` - List addresses
- `POST /addresses` - Create address
- `PUT /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address
- `PUT /users/preferences` - Update language preferences

### Admin Endpoints (require auth + admin middleware)

- `GET /admin/stats` - Dashboard statistics
- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `PUT /admin/users/:id` - Update user details
- `PUT /admin/users/:id/role` - Change user role
- `GET /admin/orders` - List all orders
- `PUT /admin/orders/:id` - Update order status
- `POST /admin/media` - Create media
- `PUT /admin/media/:id` - Update media
- `DELETE /admin/media/:id` - Delete media

## Role-Based Permissions

### Roles

1. **super_admin** - Full system access (database-created only)
2. **admin** - Full service administration (created by super_admin)
3. **support** - Order management & media creation (created by admin/super_admin)
4. **user** - Public website access only (default)

### Media Permissions

- Support can create drafts and edit their own unpublished media
- Only admin/super_admin can publish media (set `isVisible: true`)
- Once published, support cannot edit or delete
- Staff see draft media on public website with "Draft" badge

### User Management Permissions

- Super_admin can modify anyone's role including promoting to admin
- Admin can promote users to support, demote support to user
- Admin cannot modify other admins or super_admins
- Users cannot modify their own role

## Supported Languages

The platform supports 30 languages in ISO 639 format:

Arabic (ar), Bengali (bn), German (de), Greek (el), English (en), Spanish (es), Persian (fa), French (fr), Hausa (ha), Hebrew (he), Hindi (hi), Haitian Creole (ht), Indonesian (id), Ilocano (ilo), Italian (it), Japanese (ja), Korean (ko), Marathi (mr), Punjabi (pa), Portuguese (pt), Romanian (ro), Russian (ru), Swahili (sw), Tamil (ta), Telugu (te), Tagalog (tl), Turkish (tr), Urdu (ur), Vietnamese (vi), Chinese (zh)

## License

Dual-licensed under:
- MIT License
- The Unlicense

See LICENSE file for details.
