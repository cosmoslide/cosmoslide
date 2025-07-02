#!/bin/bash

echo "Starting test environment..."
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit test-app

# Get the exit code of the test container
EXIT_CODE=$?

# Clean up
docker-compose -f docker-compose.test.yml down -v

exit $EXIT_CODE