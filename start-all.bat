@echo off
chcp 65001 >nul
setlocal

REM Get script directory
cd /d "%~dp0"

REM Clear screen
cls

echo ======================================
echo   ChipLeaderTreats - All Services
echo ======================================
echo.

REM Check dependencies
echo 📦 Checking dependencies...
if not exist "frontend\node_modules" (
    echo ⚠️  Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

if not exist "backend\node_modules" (
    echo ⚠️  Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

echo.
echo ✅ Dependency check complete
echo.

REM Start backend server (background)
echo 🚀 Starting backend server...
start /B cmd /c "cd backend && npm start > ..\backend.log 2>&1"

REM Wait for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend server (background)
echo 🚀 Starting frontend server...
start /B cmd /c "cd frontend && npm run dev > ..\frontend.log 2>&1"

REM Wait for frontend to start
timeout /t 3 /nobreak >nul

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP:~1%

echo.
echo ======================================
echo   ✅ All services started successfully!
echo ======================================
echo.
echo 📡 Backend API: http://localhost:3001
echo 🌐 Frontend UI: http://localhost:3000
echo.
echo 📱 Mobile access:
echo    http://%LOCAL_IP%:3000
echo.
echo 📝 Log files:
echo    Backend: backend.log
echo    Frontend: frontend.log
echo.
echo ⚠️  Press any key to stop all services
echo ======================================
echo.

pause

REM Stop all services
echo.
echo Stopping all services...
taskkill /F /IM node.exe 2>nul
echo ✅ All services stopped
