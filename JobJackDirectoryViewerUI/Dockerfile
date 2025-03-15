# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package.json, package-lock.json, and .npmrc
COPY package*.json .npmrc ./

# Clean npm cache and install dependencies with exact versions
RUN npm cache clean --force && \
    npm install --no-package-lock

# Copy the rest of the application code
COPY . .

# Build the Angular app with Docker-specific configuration
RUN NODE_ENV=production npm run build -- --configuration=docker

# Production stage
FROM nginx:alpine

# Copy the build output from the build stage
COPY --from=build /app/dist/job-jack-directory-viewer-ui/browser /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"] 