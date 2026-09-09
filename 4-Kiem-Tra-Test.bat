@echo off
setlocal
title AuditSoft NKC - Kiem tra & Test
cd /d "%~dp0"

echo ============================================
echo   KIEM TRA: TYPECHECK + LINT + 69 TESTS
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [LOI] Chua cai Node.js.
    pause
    exit /b 1
)

if not exist "node_modules" (
    call npm install --no-audit --no-fund
    if errorlevel 1 goto :fail
)

echo [1/3] Typecheck...
call npm run typecheck
if errorlevel 1 goto :fail

echo [2/3] Lint...
call npx eslint .
if errorlevel 1 goto :fail

echo [3/3] Unit + Acceptance + Volume tests...
call npm run test
if errorlevel 1 goto :fail

echo.
echo ===== TAT CA DA PASS =====
pause
goto :eof

:fail
echo [LOI] Co buoc that bai - xem thong ben tren.
pause
