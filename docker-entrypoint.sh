#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done

# Run migrations
echo "Running database migrations..."
ls packages/app
cd packages/app
pnpm drizzle-kit migrate --config=drizzle.config.ts

# Start the application
echo "Starting the application..."
exec pnpm --filter app run start
