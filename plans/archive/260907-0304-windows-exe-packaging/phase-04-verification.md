---
phase: 4
title: "Thực thi Build và Nghiệm thu Toàn diện"
status: pending
priority: P1
effort: "40m"
dependencies: [1, 2, 3]
---

# Phase 4: Thực thi Build và Nghiệm thu Toàn diện

## Overview
Thực thi lệnh đóng gói thực tế trên môi trường Windows, theo dõi log đóng gói của `electron-builder`, kiểm tra kích thước và tính toàn vẹn của các file thực thi `.exe`, sau đó thực hiện smoke test chạy thử nghiệm ứng dụng.

## Requirements
- Functional:
  - Chạy thành công lệnh build:
    - `npm run dist:all` (hoặc test riêng `npm run dist:portable` và `npm run dist:setup`).
  - Thư mục `installer/` chứa đầy đủ:
    - `AuditSoft-NKC-0.1.0-Portable.exe`
    - `AuditSoft-NKC-0.1.0-Setup.exe`
  - Đảm bảo trong `installer/win-unpacked/resources/` có thư mục `GLV MAU` với đầy đủ 12 file Excel.
  - Khởi chạy thử nghiệm file `.exe` (smoke test):
    - Màn hình chính mở lên bình thường, không trắng trang (white screen).
    - Modal bản quyền / Mã máy (Machine ID) hiển thị đúng định dạng `AS-XXXX-XXXX-XXXX`.
    - Thử kéo thả hoặc chọn file Excel để kiểm tra worker threads không bị crash.
- Non-functional:
  - Thời gian build ổn định, không có warning nghiêm trọng từ Vite hay electron-builder.
  - Dung lượng file `.exe` hợp lý (~80-120MB cho mỗi file).

## Implementation Steps
1. Thực hiện lệnh build đóng gói qua terminal:
   `npm run dist:all`
2. Kiểm tra danh sách file và dung lượng trong `installer/`:
   - Xác nhận có `AuditSoft-NKC-0.1.0-Portable.exe`.
   - Xác nhận có `AuditSoft-NKC-0.1.0-Setup.exe`.
3. Kiểm tra cấu trúc thư mục tài nguyên đã đóng gói:
   - Thư mục `installer/win-unpacked/resources/GLV MAU` phải chứa các file `.xlsx`.
   - Thư mục `installer/win-unpacked/resources/app.asar.unpacked/dist-electron/workers/` phải chứa `reconcile.worker.js` và `export.worker.js`.
4. Khởi chạy thử nghiệm bản Portable:
   - Xác nhận ứng dụng mở lên đúng tiêu đề "AuditSoft NKC", logo icon hiển thị chuẩn trên taskbar.
   - Kiểm tra DevTools hoặc log nếu có lỗi.
5. Ghi nhận kết quả nghiệm thu vào báo cáo bàn giao.

## Success Criteria
- [x] Cả 2 file `.exe` (Portable và Setup) được tạo ra thành công, không lỗi exit code.
- [x] Kiểm tra tài nguyên `GLV MAU` và `workers` nằm đúng vị trí trong gói giải nén.
- [x] Ứng dụng chạy được trên Windows mà không cần cài đặt Node.js hay chạy lệnh npm.

## Risk Assessment
- Rủi ro: Quá trình build lần đầu có thể mất thêm thời gian do `electron-builder` cần tải một số binary hỗ trợ (NSIS compiler, winCodeSign) nếu cache chưa có.
- Giảm thiểu: Máy tính cần có kết nối Internet để tải các công cụ đóng gói trong lần chạy đầu tiên.
