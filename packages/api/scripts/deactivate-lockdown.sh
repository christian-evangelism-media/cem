#!/bin/bash

# Deactivate Emergency Lockdown Script
# This script deactivates the emergency lockdown mode
# ONLY super_admin should run this script

echo "========================================="
echo "  CEM Emergency Lockdown Deactivation"
echo "========================================="
echo ""
echo "WARNING: This will deactivate the emergency lockdown."
echo "Only proceed if you are certain the security threat has been resolved."
echo ""
read -p "Are you sure you want to deactivate lockdown? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Lockdown deactivation cancelled."
    exit 0
fi

# Load environment variables from .env file
if [ -f .env ]; then
    # Export only the database-related variables we need
    export DB_HOST=$(grep '^DB_HOST=' .env | cut -d '=' -f2)
    export DB_PORT=$(grep '^DB_PORT=' .env | cut -d '=' -f2)
    export DB_USER=$(grep '^DB_USER=' .env | cut -d '=' -f2)
    export DB_PASSWORD=$(grep '^DB_PASSWORD=' .env | cut -d '=' -f2)
    export DB_DATABASE=$(grep '^DB_DATABASE=' .env | cut -d '=' -f2)
else
    echo "Error: .env file not found"
    exit 1
fi

# Deactivate lockdown
echo ""
echo "Deactivating lockdown..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DATABASE -c "UPDATE system_settings SET is_locked_down = false, updated_at = NOW() WHERE id = 1;"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Lockdown deactivated successfully!"
    echo ""
    echo "Users can now access the system normally."
else
    echo ""
    echo "✗ Failed to deactivate lockdown."
    echo "Please check your database connection and try again."
    exit 1
fi
