@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js 20 or later.
  pause
  exit /b 1
)

if not exist ".env" (
  echo .env was not found. Copy .env.example to .env and set OPENAI_API_KEY.
  pause
  exit /b 1
)

echo Starting Juno Co-Host...
echo.
echo App URL: http://localhost:8787
echo Press Ctrl+C in this window to stop the server.
echo.

start "" "http://localhost:8787"
npm.cmd start

pause
