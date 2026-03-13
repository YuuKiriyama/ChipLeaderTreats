@echo off
chcp 65001 >nul
setlocal

REM Get script directory
cd /d "%~dp0"

REM Clear screen
cls

echo ======================================
echo   ChipLeaderTreats - Backend Server
echo ======================================
echo.
echo Starting backend server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo ⚠️  First run - installing dependencies...
    call npm install
    echo.
)

REM Start backend server
call npm start

pause
