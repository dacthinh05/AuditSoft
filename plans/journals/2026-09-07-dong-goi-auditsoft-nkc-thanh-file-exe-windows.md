---
title: "Đóng gói AuditSoft NKC thành file thực thi (.exe) Windows"
date: 2026-09-07
summary: "Cấu hình extraResources cho GLV MAU, hỗ trợ cả bản Setup Installer và Portable EXE, xử lý đường dẫn worker thread"
---

# Đóng gói AuditSoft NKC thành file thực thi (.exe) Windows

## Bối cảnh & Mục tiêu
Người dùng yêu cầu tạo bản chạy `.exe` cho AuditSoft NKC. Triển khai theo Phương án 3 (Bản Kép): sinh ra đồng thời cả bản Portable (.exe chạy ngay) và bản Setup Installer (.exe cài đặt).

## Thay đổi kỹ thuật
1. **`package.json`**:
   - Khai báo `extraResources` đưa toàn bộ thư mục `GLV MAU` vào thư mục `resources` của gói cài đặt.
   - Thêm target `"portable"` song song với `"nsis"`.
   - Cấu hình đặt tên file rõ ràng: `AuditSoft-NKC-${version}-Portable.exe` và `AuditSoft-NKC-${version}-Setup.exe`.
   - Bổ sung các lệnh npm: `dist:portable`, `dist:setup`, `dist:all`.
2. **`src/main/index.ts`**:
   - Bổ sung hàm `resolveWorkerPath` để tự động chuyển hướng đường dẫn worker thread sang `app.asar.unpacked` khi chạy trong ứng dụng đã đóng gói.
   - Cập nhật thứ tự ưu tiên trong `resolveTemplateDir`, ưu tiên tìm kiếm tại `process.resourcesPath/GLV MAU`.
3. **Kịch bản tự động hóa 1-click**:
   - Tạo `Tao-Ban-Chay-EXE.bat` với menu trực quan (Cả hai, Portable, Setup), tự phát hiện và xử lý app cũ đang chạy để tránh lỗi khóa file.
   - Đồng bộ `3-Tao-Installer-Windows.bat` gọi `Tao-Ban-Chay-EXE.bat`.

## Kết quả nghiệm thu
- `installer/AuditSoft-NKC-0.1.0-Portable.exe` (85MB): Đã tạo thành công, click đúp chạy ngay.
- `installer/AuditSoft-NKC-0.1.0-Setup.exe` (85MB): Đã tạo thành công, bộ cài đặt tiêu chuẩn.
- Thư mục `installer/win-unpacked/resources/GLV MAU` và `app.asar.unpacked/dist-electron/workers/` đầy đủ.
- Toàn bộ 24 test files / 153 unit tests pass 100%.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
