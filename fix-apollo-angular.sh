#!/bin/bash

echo "Fixing apollo-angular version issue..."

# Navigate to UI directory
cd JobJackDirectoryViewerUI

# Update package.json to use a specific version of apollo-angular
sed -i 's/"apollo-angular": "\^[0-9]*\.[0-9]*\.[0-9]*"/"apollo-angular": "5.0.2"/g' package.json

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps

echo "apollo-angular version fixed. You can now build the Docker containers." 