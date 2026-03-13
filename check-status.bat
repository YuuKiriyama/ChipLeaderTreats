@echo off
chcp 65001 >nul
setlocal

REM Get script directory
cd /d "%~dp0"

REM Clear screen
cls

echo ======================================
echo   ChipLeaderTreats - Process Check
echo ======================================
echo.

echo 🔍 Checking running services...
echo.

REM Check backend service
echo 📡 Backend service status:
tasklist /FI "IMAGENAME eq node.exe" /V 2>nul | findstr "server.js" >nul
if %errorlevel% equ 0 (
    echo ✅ Backend service is running
    tasklist /FI "IMAGENAME eq node.exe" /V | findstr "server.js"
) else (
    echo ❌ Backend service is not running
)

echo.

REM Check frontend service
echo 🌐 Frontend service status:
tasklist /FI "IMAGENAME eq node.exe" /V 2>nul | findstr "vite" >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend service is running
    tasklist /FI "IMAGENAME eq node.exe" /V | findstr "vite"
) else (
    echo ❌ Frontend service is not running
)

echo.

REM Check port usage
echo 🔌 Port usage:
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo    3001 ^(backend^): In use
) else (
    echo    3001 ^(backend^): Not in use
)

netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo    3000 ^(frontend^): In use
) else (
    echo    3000 ^(frontend^): Not in use
)

netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo    5173 ^(Vite^): In use
) else (
    echo    5173 ^(Vite^): Not in use
)

echo.

REM Check log files
echo 📝 Log file status:
if exist "backend.log" (
    for %%A in ("backend.log") do echo    Backend log: backend.log ^(%%~zA bytes^)
) else (
    echo    Backend log: Does not exist
)

if exist "frontend.log" (
    for %%A in ("frontend.log") do echo    Frontend log: frontend.log ^(%%~zA bytes^)
) else (
    echo    Frontend log: Does not exist
)

echo.
echo ======================================
echo   Process check complete
echo ======================================
echo.
echo 💡 Quick actions:
echo   - Start services: start-all.bat
echo   - Stop services: stop-all.bat
echo   - View logs: type backend.log or type frontend.log
echo.

pause
