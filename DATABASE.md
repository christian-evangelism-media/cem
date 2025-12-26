# Database Setup

The CEM project uses PostgreSQL in a Docker container for isolation and easy management.

## Quick Start

### 1. Configure Database Password

```bash
# Copy the example file
cp .env.docker .env

# Edit .env and set a secure password
# DB_PASSWORD=your_secure_password_here
```

### 2. Start the Database

```bash
# Start PostgreSQL container
docker compose up -d

# Verify it's running
docker compose ps
docker compose logs postgres
```

### 3. Configure API

Update `packages/api/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=cem_user
DB_PASSWORD=your_secure_password_here  # Same as in .env
DB_DATABASE=cem
```

### 4. Run Migrations

```bash
cd packages/api
node ace migration:run
```

## VPS Deployment with Multiple Apps

If you have multiple apps on the same VPS, change the port to avoid conflicts:

**App 1 (CEM):**
```env
# .env (project root)
DB_PORT=5432
```

**App 2 (Another project):**
```env
# .env (other project root)
DB_PORT=5433
```

Then each app's API `.env` uses its respective port:
```env
DB_HOST=127.0.0.1
DB_PORT=5432  # or 5433, 5434, etc.
```

## Common Commands

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# Stop and remove data (⚠️ destructive)
docker compose down -v

# View logs
docker compose logs -f postgres

# Restart database
docker compose restart postgres

# Check status
docker compose ps
```

## Backup and Restore

### Backup

```bash
# Backup to file
docker compose exec postgres pg_dump -U cem_user cem > backup.sql

# Or with timestamp
docker compose exec postgres pg_dump -U cem_user cem > "backup-$(date +%Y%m%d-%H%M%S).sql"
```

### Restore

```bash
# Restore from backup
docker compose exec -T postgres psql -U cem_user cem < backup.sql
```

## Connecting to Database

### From Host Machine

```bash
# Using psql
psql -h localhost -p 5432 -U cem_user -d cem

# Using Docker
docker compose exec postgres psql -U cem_user -d cem
```

### From Another Container

If you later dockerize the API, it can connect using the service name:

```env
DB_HOST=postgres  # Docker service name
DB_PORT=5432
```

## Troubleshooting

### Port Already in Use

If port 5432 is taken:

1. Change `DB_PORT` in `.env` to another port (e.g., 5433)
2. Restart: `docker compose down && docker compose up -d`
3. Update `packages/api/.env` with the new port

### Permission Errors

If migrations fail with permission errors:

```bash
# Connect to database
docker compose exec postgres psql -U postgres -d cem

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE cem TO cem_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cem_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cem_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cem_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cem_user;
```

### Reset Database

```bash
# ⚠️ This deletes all data
docker compose down -v
docker compose up -d
cd packages/api
node ace migration:run
node ace db:seed  # Optional
```

## Production Notes

- The PostgreSQL container uses a persistent volume (`cem_postgres_data`)
- Data persists even if the container is stopped/removed
- Only `docker compose down -v` will delete data
- The container auto-restarts unless explicitly stopped
- Regular backups are recommended (use cron for automated backups)
