@echo off
chcp 65001 >nul
title AuditSoft Keygen Studio - Tao Key Ban Quyen Nhanh

echo ================================================================
echo    AUDITSOFT KEYGEN STUDIO — CONG CU TAO BAN QUYEN VIP
echo    Tac gia: Thinh Lynx (0817.567.008 - MB Bank)
echo ================================================================
echo.

if not exist "%~dp0scripts\keygen-gui-server.mjs" (
    echo [LOI] Khong tim thay file scripts\keygen-gui-server.mjs!
    pause
    exit /b 1
)

echo [1/2] Dang khoi dong Web Server cuc bo tai http://127.0.0.1:7890 ...
start "" node "%~dp0scripts\keygen-gui-server.mjs"

echo [2/2] Dang mo giao dien tren trinh duyet...
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:7890"

echo.
echo ================================================================
echo  Da mo trinh duyet thanh cong!
echo  (Neu trinh duyet chua tu mo, hay truy cap: http://127.0.0.1:7890)
echo ================================================================
echo.
echo  HOAC BAN CO THE TAO KEY TRUC TIEP TAI DAY:
echo.
:LOOP
set /p MID="Nhap Ma May (Machine ID, vi du AS-9F2A-88B1-C410): "
if "%MID%"=="" goto LOOP

set /p CNAME="Nhap Ten Khach Hang (Enter de mac dinh KTV VIP): "
if "%CNAME%"=="" set CNAME=Kiem toan vien VIP

node "%~dp0scripts\keygen.ts" %MID% "%CNAME%" --lifetime
echo.
echo ----------------------------------------------------------------
echo Nhap them key khac hoac dong cua so nay.
goto LOOP
