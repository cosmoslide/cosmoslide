#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: yarn migration:generate <MigrationName>"
  exit 1
fi

echo "Generating migration by comparing entities with migration database..."

# Generate migration by comparing entities with migration DB
# Docker: postgres-migration:5432 (internal port)
# Local: localhost:5433 (external port mapping)
MIGRATION_HOST="${MIGRATION_DB_HOST:-postgres-migration}"
MIGRATION_PORT="${MIGRATION_DB_PORT:-5432}"

DATABASE_HOST="$MIGRATION_HOST" \
DATABASE_PORT="$MIGRATION_PORT" \
DATABASE_NAME="${DB_NAME:-cosmosli}_migration" \
typeorm-ts-node-commonjs migration:generate "src/migrations/$1" -d src/data-source.ts

# Apply the generated migration to the migration DB to keep it in sync
if [ $? -eq 0 ]; then
  echo "Applying migration to migration database..."
  DATABASE_HOST="$MIGRATION_HOST" \
  DATABASE_PORT="$MIGRATION_PORT" \
  DATABASE_NAME="${DB_NAME:-cosmosli}_migration" \
  typeorm-ts-node-commonjs migration:run -d src/data-source.ts
  echo "✅ Migration generated and applied to migration database successfully!"
fi
