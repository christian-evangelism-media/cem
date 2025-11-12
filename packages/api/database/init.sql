-- CEM API Database Initialization
-- This script sets up the database and user for the CEM API project
--
-- Usage:
--   Run this as the postgres superuser:
--   psql -U postgres < database/init.sql
--
-- Or run each command manually:
--   psql -U postgres

-- Create the database
CREATE DATABASE cem;

-- Create the application user
-- NOTE: Replace 'your_secure_password' with a strong password
-- Generate one with: openssl rand -base64 32
CREATE USER cem_user WITH PASSWORD 'your_secure_password';

-- Grant connection to the database
GRANT CONNECT ON DATABASE cem TO cem_user;

-- Connect to the cem database to set schema permissions
\c cem

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO cem_user;

-- Grant table permissions (for existing tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cem_user;

-- Grant sequence permissions (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cem_user;

-- Grant default privileges for future tables
-- This ensures new tables created by migrations get the right permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cem_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO cem_user;

-- Display success message
\echo 'Database setup complete!'
\echo 'Next steps:'
\echo '1. Update your .env file with DB_USER=cem_user and DB_PASSWORD=your_secure_password'
\echo '2. Run migrations: node ace migration:run'
\echo '3. Seed database (optional): node ace db:seed'
