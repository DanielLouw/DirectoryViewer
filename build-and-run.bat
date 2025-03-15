@echo off
echo Building and starting Directory Viewer application...

echo Stopping any existing containers...
docker-compose down

echo Removing existing images...
docker rmi directory-viewer-api directory-viewer-ui 2>nul

echo Building and starting containers...
docker-compose up --build -d

echo.
echo Containers are starting in the background.
echo The application will be available at:
echo   - Frontend: http://localhost:8080
echo   - GraphQL API: http://localhost:4000
echo.
echo To view logs, run: docker-compose logs -f
echo To stop the application, run: docker-compose down
pause
