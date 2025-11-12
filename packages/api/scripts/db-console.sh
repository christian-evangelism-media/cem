#!/bin/bash

# Database Console Script
# Provides easy access to the PostgreSQL database

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

# Connect to the database
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DATABASE
