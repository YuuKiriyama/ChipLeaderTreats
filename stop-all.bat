@echo off
chcp 65001 >nul
setlocal

REM Get script directory
cd /d "%~dp0"

REM Clear screen
cls

echo ======================================
echo   ChipLeaderTreats - Stop Services
echo ======================================
echo.

echo 🔍 Checking running services...

REM Stop backend service
echo 🛑 Stopping backend service...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *server.js*" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend service stopped
) else (
    echo ℹ️  Backend service is not running
)

REM Stop frontend service
echo 🛑 Stopping frontend service...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *vite*" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Frontend service stopped
) else (
    echo ℹ️  Frontend service is not running
)

REM Stop all Node processes (use with caution)
echo 🛑 Stopping all related npm processes...
taskkill /F /IM node.exe 2>nul

echo.
echo ✅ All services stopped!
echo.
echo ======================================
echo   Service stop complete
echo ======================================
echo.
echo 💡 Tips:
echo   - If ports are still in use, please restart your computer
echo   - Or manually end node.exe processes in Task Manager
echo.

pause
