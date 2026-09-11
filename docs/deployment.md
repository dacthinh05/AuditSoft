# Deployment & Distribution

## Platform: GitHub Releases & Auto-Update Engine
- **Target Repository:** `https://github.com/dacthinh05/AuditSoft`
- **Latest Release URL:** `https://github.com/dacthinh05/AuditSoft/releases/latest`
- **Current Version:** `v1.1.8`
- **Release Page:** `https://github.com/dacthinh05/AuditSoft/releases/tag/v1.1.8`

## Artifacts
1. **Windows Installer (Setup):** `AuditSoft-1.1.8-Setup.exe` (~91 MB)
   - NSIS installer, tự động tạo shortcut Desktop & Start Menu, hỗ trợ tự động nâng cấp 1-click.
2. **Windows Portable:** `AuditSoft-1.1.8-Portable.exe` (~91 MB)
   - Bản chạy ngay không cần cài đặt, thích hợp lưu trữ USB khi đi kiểm toán thực địa.
3. **Auto-Update Manifest:** `version.json`
   - Được đồng bộ tự động lên nhánh `main` của repo `dacthinh05/AuditSoft`.
   - Ứng dụng client đọc từ `https://raw.githubusercontent.com/dacthinh05/AuditSoft/main/version.json` để kiểm tra và tải bản mới.

## Build & Deploy Commands
```bash
# 1. Đóng gói bộ cài Windows (.exe)
npm run dist:all

# 2. Phát hành lên GitHub Releases & Đồng bộ Auto-Update
npm run release
# Hoặc chạy trực tiếp tệp script batch:
./Phat-Hanh-Ban-Moi.bat
```

## Rollback
Nếu bản phát hành mới gặp sự cố:
1. Chỉnh sửa `version.json` hạ số phiên bản về bản ổn định trước đó (ví dụ `1.1.5`) kèm URL tải của bản đó.
2. Chạy lệnh commit & push `version.json` trong thư mục `dist-release/`.
3. Khách hàng khi mở ứng dụng sẽ tự động được thông báo hạ/nâng cấp về phiên bản mong muốn.
