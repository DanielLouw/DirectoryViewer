# JobJack Directory Viewer

A full-stack application for browsing and navigating file systems, with support for both local and Docker environments.

## Features

- Browse file systems with an intuitive UI
- Automatic detection of Windows or Docker environment
- Path navigation with breadcrumbs
- File and directory listings with details (size, type, etc.)
- Sorting and filtering capabilities
- Pagination for handling large directories
- Responsive design

## Architecture

The application consists of two main components:

1. **API (Node.js/GraphQL)**: Backend service that handles file system operations
2. **UI (Angular)**: Frontend application that provides the user interface

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Docker and Docker Compose (for containerized deployment)

## Setup and Installation

### Local Development

#### API Setup

```bash
# Navigate to API directory
cd JobJackDirectoryViewerAPI

# Install dependencies
npm install

# Start development server
npm run dev
```

#### UI Setup

```bash
# Navigate to UI directory
cd JobJackDirectoryViewerUI

# Install dependencies
npm install

# Start development server
npm start
```

### Docker Deployment

```bash
# Build and start containers
docker-compose up -d

# Stop containers
docker-compose down
```

## Usage

- Access the application at http://localhost:4200 (development) or http://localhost:8080 (Docker)
- Navigate through directories by clicking on folder names
- Use the breadcrumb navigation to jump to parent directories
- Sort files by name, size, or type
- Filter files by name or type

## Environment Configuration

The application automatically detects whether it's running in a Windows or Docker environment and adjusts path handling accordingly:

- **Windows**: Uses Windows-style paths (e.g., `C:\Users\`)
- **Docker**: Uses Linux-style paths (e.g., `/etc/`, `/bin/`)

## License

MIT 
