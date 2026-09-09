# Phase 1: Cô lập Mã nguồn & Chuẩn bị Staging Phân phối

## Mục tiêu
Đảm bảo mã nguồn local không bao giờ bị đẩy nhầm lên GitHub public repository `https://github.com/dacthinh05/AuditSoft.git`.
Tạo một thư mục staging phân phối tách biệt `dist-release` độc lập để quản lý riêng các file công khai.

## Các bước thực hiện
1. **Xử lý Git Remote ở thư mục gốc mã nguồn:**
   - Xóa `remote origin` trỏ tới `dacthinh05/AuditSoft` khỏi thư mục gốc (hoặc trỏ tới git private nội bộ nếu muốn).
   - Đảm bảo git status ở root không thể push lên repo public.
2. **Khởi tạo thư mục Staging `dist-release`:**
   - Thêm `dist-release/` vào `.gitignore` của thư mục mã nguồn để không bị lồng chéo.
   - Tạo thư mục `dist-release/`.
   - Copy `version.json` sang `dist-release/version.json`.
   - Soạn thảo `README.md` chuyên nghiệp tại `dist-release/README.md` giới thiệu phần mềm AuditSoft, tính năng đối chiếu NKC, bốc mẫu VSA 530, lập 12 GLV, link tải Setup.exe và Portable.exe.
3. **Khởi tạo Git trong `dist-release/`:**
   - `git init -b main`
   - `git remote add origin https://github.com/dacthinh05/AuditSoft.git`
   - Verify danh sách file: chỉ có 2 file duy nhất là `version.json` và `README.md`.
