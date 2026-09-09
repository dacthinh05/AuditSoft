@echo off
setlocal enabledelayedexpansion
title AuditSoft NKC - Dong Goi File EXE
cd /d "%~dp0"

echo ================================================================
echo           AUDITSOFT NKC - DONG GOI FILE CHAY EXE
echo ================================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay Node.js tren may.
    echo Vui long tai va cai dat Node.js tai: https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Lan dau chay - dang cai dat thu vien phu thuoc...
    call npm install --no-audit --no-fund
    if errorlevel 1 goto :fail
)

:: Kiem tra va tat tien trinh dang chay de tranh khoa file (EPERM / EBUSY)
taskkill /f /im "AuditSoft.exe" >nul 2>nul
taskkill /f /im "AuditSoft NKC.exe" >nul 2>nul
taskkill /f /im "electron.exe" >nul 2>nul

echo Chon loai ban build ban muon tao:
echo.
echo   [1] Tao CA 2 BAN: Setup (.exe cai dat) + Portable (.exe chay ngay) [Khuyen dung]
echo   [2] Chi tao ban PORTABLE (.exe chay ngay, khong can cai dat, tien mang di)
echo   [3] Chi tao ban SETUP (.exe cai dat chuan NSIS, co shortcut Desktop)
echo   [4] Thoat
echo.
set /p opt="Nhap lua chon [1-4] (Mac dinh la 1): "

if "%opt%"=="" set opt=1
if "%opt%"=="1" goto :build_all
if "%opt%"=="2" goto :build_portable
if "%opt%"=="3" goto :build_setup
if "%opt%"=="4" goto :eof

echo Lua chon khong hop le. Mac dinh chon [1].
goto :build_all

:build_all
echo.
echo ================================================================
echo Dang dong goi CA 2 BAN (Setup + Portable)...
echo Co the mat 1 - 3 phut tuy vao toc do may...
echo ================================================================
call npm run dist:all
if errorlevel 1 goto :fail
goto :success

:build_portable
echo.
echo ================================================================
echo Dang dong goi ban PORTABLE (.exe chay ngay)...
echo ================================================================
call npm run dist:portable
if errorlevel 1 goto :fail
goto :success

:build_setup
echo.
echo ================================================================
echo Dang dong goi ban SETUP INSTALLER (.exe cai dat)...
echo ================================================================
call npm run dist:setup
if errorlevel 1 goto :fail
goto :success

:success
echo.
echo ================================================================
echo                 DONG GOI HOAN TAT THANH CONG!
echo ================================================================
echo.
echo Cac file thuc thi nam trong thu muc: installer\
echo.
dir /b /s installer\*.exe 2>nul
echo.
echo Dang mo thu muc chua file .exe...
start explorer "%~dp0installer"
echo.
echo Nhan phim bat ky de ket thuc.
pause >nul
goto :eof

:fail
echo.
echo [LOI] Qua trinh build hoac dong goi that bai.
echo Goi y:
echo   - Dong tat ca cua so AuditSoft hoac file Excel dang mo.
echo   - Kiem tra ket noi mang neu electron-builder can tai file binary lan dau.
echo.
pause
