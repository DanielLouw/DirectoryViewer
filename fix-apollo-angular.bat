@echo off
echo Fixing apollo-angular version issue...

rem Navigate to UI directory
cd JobJackDirectoryViewerUI

rem Create a temporary file with the updated package.json
powershell -Command "(Get-Content package.json) -replace '\"apollo-angular\": \"\^[0-9]*\.[0-9]*\.[0-9]*\"', '\"apollo-angular\": \"5.0.2\"' | Set-Content package.json.tmp"
powershell -Command "Move-Item -Force package.json.tmp package.json"

rem Remove node_modules and package-lock.json
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

rem Install dependencies with legacy peer deps
call npm install --legacy-peer-deps

echo apollo-angular version fixed. You can now build the Docker containers.
cd ..
pause 