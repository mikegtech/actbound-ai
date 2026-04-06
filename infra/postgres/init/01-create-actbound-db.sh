#!/bin/bash
set -e

# Create the actbound database if it doesn't exist.
# The openfga database is created by POSTGRES_DB env var automatically.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE actbound'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'actbound')\gexec
EOSQL
