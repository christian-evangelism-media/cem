# CEM API Scripts

This directory contains utility scripts for database management and emergency lockdown control.

## Database Access

### db-console.sh
Opens a PostgreSQL console connected to the CEM database.

```bash
./scripts/db-console.sh
```

This script reads database credentials from the `.env` file and connects you to the database using `psql`.

## Emergency Lockdown Management

### deactivate-lockdown.sh
Deactivates the emergency lockdown mode.

```bash
./scripts/deactivate-lockdown.sh
```

**Security:**
- Only super_admin should run this script
- Requires confirmation before proceeding
- Updates the `system_settings` table to disable lockdown

**Usage:**
1. Run the script: `./scripts/deactivate-lockdown.sh`
2. Confirm by typing `yes` when prompted
3. Lockdown will be deactivated immediately

## Emergency Lockdown System

### How It Works

1. **Activation:**
   - Any staff member (help, support, admin, super_admin) can activate lockdown via the emergency button in cem-ops
   - Click once - no confirmation required (for true emergencies)
   - System immediately locks down and logs out all users

2. **During Lockdown:**
   - All authenticated requests return HTTP 423 (Locked)
   - cem-ops shows full lockdown screen
   - web shows lockdown banner on login/register pages
   - Public media browsing continues to work

3. **Deactivation:**
   - **Only super_admin can deactivate**
   - Must use database access (scripts or direct SQL)
   - Run: `./scripts/deactivate-lockdown.sh`
   - Or manually: `UPDATE system_settings SET is_locked_down = false WHERE id = 1;`

### Checking Lockdown Status

Use the cem-ops website to check if the system is locked down - staff will see the full lockdown screen if it's active.

Alternatively, use the database console to check manually:
```bash
./scripts/db-console.sh
```

Then run:
```sql
SELECT is_locked_down, updated_at FROM system_settings WHERE id = 1;
```

### Manual SQL Commands

If the deactivation script doesn't work, use this SQL command directly:

**Deactivate lockdown:**
```sql
UPDATE system_settings SET is_locked_down = false, updated_at = NOW() WHERE id = 1;
```

**Activate lockdown (for testing):**
```sql
UPDATE system_settings SET is_locked_down = true, updated_at = NOW() WHERE id = 1;
```

## Requirements

- Bash shell
- PostgreSQL client (`psql`) installed
- `.env` file with database credentials in the api directory
- Appropriate database user permissions

## Troubleshooting

**"Error: .env file not found"**
- Make sure you're running the script from the api directory
- Ensure `.env` file exists and is readable

**"psql: connection refused"**
- Check that PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database host/port are correct

**"Permission denied"**
- Make scripts executable: `chmod +x scripts/*.sh`
- Ensure database user has UPDATE permissions on system_settings table
