#!/bin/bash

echo "Building and starting Directory Viewer application..."

# Stop any running containers
echo "Stopping any existing containers..."
docker-compose down

# Remove any existing images to ensure a clean build
echo "Removing existing images..."
docker rmi directory-viewer-api directory-viewer-ui 2>/dev/null || true

# Build and start the containers
echo "Building and starting containers..."
docker-compose up --build -d

echo "Containers are starting in the background."
echo "The application will be available at:"
echo "  - Frontend: http://localhost:8080"
echo "  - GraphQL API: http://localhost:4000"
echo ""
echo "To view logs, run: docker-compose logs -f"
echo "To stop the application, run: docker-compose down" 