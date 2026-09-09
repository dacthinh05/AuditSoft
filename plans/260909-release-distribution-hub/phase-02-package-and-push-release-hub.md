# Phase 2: Đóng gói EXE/Portable & Khởi tạo Release Hub

## Mục tiêu
1. Đóng gói đầy đủ 2 phiên bản thực thi cho Windows:
   - `AuditSoft-0.1.0-Setup.exe` (Bản cài đặt tiêu chuẩn)
   - `AuditSoft-0.1.0-Portable.exe` (Bản chạy ngay không cần cài đặt)
2. Đẩy commit đầu tiên của `dist-release` lên nhánh `main` của `https://github.com/dacthinh05/AuditSoft.git`.
3. Chuẩn bị tài nguyên và hướng dẫn tạo GitHub Release v0.1.0 kèm 2 file EXE.

## Các bước thực hiện
1. Kiểm tra build app và electron-builder:
   - Chạy `npm run build` để cập nhật dist và dist-electron.
   - Chạy `electron-builder --win nsis portable` để sinh file vào thư mục output.
2. Commit và push nhánh `main` từ `dist-release/`:
   - `git add version.json README.md`
   - `git commit -m "feat(release): initialize distribution hub v0.1.0"`
   - `git push -u origin main --force`
3. Kiểm tra GitHub Repository:
   - Truy cập URL `https://github.com/dacthinh05/AuditSoft` xác nhận chỉ có 2 file.
   - Xác nhận raw URL `https://raw.githubusercontent.com/dacthinh05/AuditSoft/main/version.json` trả về HTTP 200 JSON.
