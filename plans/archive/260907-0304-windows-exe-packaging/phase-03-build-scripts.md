---
phase: 3
title: "Tự động hóa Quy trình Đóng gói (Script 1-Click)"
status: pending
priority: P2
effort: "20m"
dependencies: [1, 2]
---

# Phase 3: Tự động hóa Quy trình Đóng gói (Script 1-Click)

## Overview
Xây dựng tập lệnh Windows Batch (`Tao-Ban-Chay-EXE.bat`) và cập nhật `3-Tao-Installer-Windows.bat` cho phép lập trình viên hoặc người vận hành đóng gói ứng dụng bằng 1 click chuột, hỗ trợ menu chọn đóng gói cả 2 bản hoặc riêng lẻ từng bản, tự động mở thư mục kết quả.

## Requirements
- Functional:
  - Kiểm tra điều kiện tiên quyết (môi trường Node.js, `node_modules`).
  - Kiểm tra và cảnh báo nếu có tiến trình `AuditSoft NKC.exe` đang chạy ngầm làm khóa file trong `installer/`.
  - Cung cấp tùy chọn linh hoạt:
    - Phím 1: Đóng gói cả 2 bản (Setup Installer + Portable) - Khuyên dùng.
    - Phím 2: Chỉ đóng gói bản Portable (.exe chạy ngay).
    - Phím 3: Chỉ đóng gói bản Setup (.exe cài đặt NSIS).
  - Tự động hiển thị danh sách các file `.exe` được tạo cùng dung lượng.
  - Tự động mở thư mục `installer\` trong Windows Explorer sau khi build xong.
- Non-functional:
  - Thông báo tiếng Việt rõ ràng, dễ hiểu, xử lý bắt lỗi chi tiết nếu build thất bại.

## Architecture
- Tập lệnh `.bat` chạy trong môi trường Windows CMD/Powershell:
  - `tasklist` / `taskkill` (tùy chọn) kiểm tra file lock.
  - Gọi npm scripts: `npm run dist:all`, `npm run dist:portable`, hoặc `npm run dist:setup`.
  - Dùng `explorer "%~dp0installer"` để mở thư mục thành phẩm cho người dùng.

## Related Code Files
- Create: `Tao-Ban-Chay-EXE.bat`
- Modify: `3-Tao-Installer-Windows.bat`

## Implementation Steps
1. Soạn thảo file `Tao-Ban-Chay-EXE.bat`:
   - Kiểm tra Node.js.
   - Hiển thị Banner giới thiệu và menu 3 lựa chọn (1: Cả hai, 2: Portable, 3: Setup).
   - Kiểm tra tiến trình khóa file: `tasklist | findstr /i "AuditSoft"`.
   - Thực thi lệnh đóng gói tương ứng.
   - Liệt kê các file `.exe` vừa sinh ra trong thư mục `installer\`.
   - Gọi lệnh `explorer installer\` để người dùng xem file ngay.
2. Cập nhật `3-Tao-Installer-Windows.bat` để đồng bộ đường dẫn và thông điệp hướng dẫn tương tự.

## Success Criteria
- [x] Nhấp đúp vào file `.bat` chạy mượt mà không văng cửa sổ terminal.
- [x] Menu lựa chọn phản hồi đúng phím bấm (1, 2, 3).
- [x] Mở đúng thư mục `installer\` sau khi đóng gói.

## Risk Assessment
- Rủi ro: Người dùng đang mở một phiên bản `.exe` cũ trong thư mục `installer/win-unpacked/`, dẫn đến lỗi EPERM / EBUSY (file being used by another process).
- Giảm thiểu: Thêm bước kiểm tra và nhắc người dùng đóng app trước khi bắt đầu build.
