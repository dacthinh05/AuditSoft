# Phase 3: Tạo Công cụ Phát hành 1-Click & Kiểm thử Updater

## Mục tiêu
1. Tạo script tự động hóa `Phat-Hanh-Ban-Moi.bat` và `scripts/publish-distribution.mjs` để quy trình phát hành các bản tương lai (v0.1.1, v0.2.0, ...) hoàn toàn tự động chỉ với 1 click.
2. Kiểm tra toàn diện cơ chế Auto-Update của ứng dụng AuditSoft (đảm bảo gọi đúng URL và hiển thị changelog).

## Các bước thực hiện
1. Viết `scripts/publish-distribution.mjs`:
   - Đọc `version.json` từ thư mục gốc.
   - Sao chép sang `dist-release/version.json`.
   - Cập nhật phiên bản và link tải trong `dist-release/README.md`.
   - Tự động thực hiện git commit & push trong `dist-release/`.
   - Hướng dẫn hoặc tự động mở trình duyệt trang Release: `https://github.com/dacthinh05/AuditSoft/releases/new?tag=v<version>&title=AuditSoft+v<version>`.
2. Tạo file `Phat-Hanh-Ban-Moi.bat` tại thư mục gốc với giao diện menu trực quan.
3. Kiểm thử tích hợp:
   - Chạy test unit cho updater: so sánh version, đọc manifest.
   - Thử nghiệm IPC `app:check-for-updates` trong ứng dụng.
