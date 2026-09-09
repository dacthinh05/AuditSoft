@echo off
setlocal
title AuditSoft NKC
cd /d "%~dp0"

echo ============================================
echo   AUDITSOFT NKC - CHAY UNG DUNG
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [LOI] Chua cai Node.js. Tai tai: https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Lan dau chay - dang cai dat thu vien...
    call npm install --no-audit --no-fund
    if errorlevel 1 goto :fail
)

echo Dang chuan bi va khoi chay phien ban moi nhat...
call npm run build
if errorlevel 1 goto :fail
:run
echo Mo ung dung... (dong cua so ung dung de thoat)
call npx electron .
goto :eof

:fail
echo [LOI] Build that bai. Chay 4-Kiem-Tra-Test.bat de xem chi tiet.
pause
