@echo off
setlocal enabledelayedexpansion
title AuditSoft - Phat Hanh Phien Ban Moi Len GitHub
cd /d "%~dp0"

echo ================================================================
echo        AUDITSOFT — PHAT HANH BAN CAP NHAT VA AUTO-UPDATE
echo ================================================================
echo.
echo Cong cu nay se:
echo   1. Dong bo version.json len GitHub (nhanh main).
echo   2. Kiem tra file Setup.exe va Portable.exe trong installer/.
echo   3. Mo trang GitHub Release va thu muc installer/ de ban up file.
echo   * Tuyet doi KHONG day ma nguon len GitHub!
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay Node.js. Vui long cai dat Node.js tai https://nodejs.org
    pause
    exit /b 1
)

node scripts/publish-distribution.mjs

echo.
pause
