@echo off
setlocal
title AuditSoft NKC - Che do Dev
cd /d "%~dp0"

echo ============================================
echo   AUDITSOFT NKC - CHE DO PHAT TRIEN (DEV)
echo   UI: http://localhost:5173  |  Dong cua so = thoat
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

echo Dang khoi dong Vite + Electron...
call npm run dev
goto :eof

:fail
echo [LOI] Cai dat that bai. Kiem tra ket noi mang roi thu lai.
pause
