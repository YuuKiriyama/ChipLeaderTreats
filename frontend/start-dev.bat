@echo off
chcp 65001 >nul
setlocal

REM Get script directory
cd /d "%~dp0"

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP:~1%

REM Clear screen
cls

echo ======================================
echo   ChipLeaderTreats - Dev Server
echo ======================================
echo.
echo Starting Vite dev server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo ⚠️  First run - installing dependencies...
    call npm install
    echo.
)

echo ✅ Server started successfully!
echo.
echo 📱 Mobile access URL:
echo    http://%LOCAL_IP%:3000
echo.
echo 💻 Local access URL:
echo    http://localhost:3000
echo.
echo Tips:
echo   - Mobile device must be on the same WiFi network as your computer
echo   - Code changes will hot-reload automatically
echo   - Press Ctrl+C to stop the server
echo.
echo ======================================
echo.

REM Start dev server
call npm run dev

pause
