---
phase: 1
title: "Cấu hình Build Target và Tài nguyên Đóng gói"
status: pending
priority: P1
effort: "30m"
dependencies: []
---

# Phase 1: Cấu hình Build Target và Tài nguyên Đóng gói

## Overview
Cập nhật cấu hình `package.json` để `electron-builder` sinh ra cả bản Portable và bản Setup Installer, đồng thời cấu hình `extraResources` đưa toàn bộ thư mục Excel template `GLV MAU` vào gói ứng dụng đã đóng gói.

## Requirements
- Functional:
  - Bổ sung target `"portable"` song song với `"nsis"` trong cấu hình build Windows.
  - Cấu hình quy tắc đặt tên file đầu ra rõ ràng:
    - Portable: `AuditSoft-NKC-${version}-Portable.exe`
    - Setup: `AuditSoft-NKC-${version}-Setup.exe`
  - Khai báo `extraResources` để sao chép thư mục `GLV MAU` vào thư mục `resources` của gói build.
  - Bổ sung các npm scripts: `dist:portable`, `dist:setup`, `dist:all`.
- Non-functional:
  - Giữ nguyên cấu hình asar unpack cho `dist-electron/workers/**`.
  - Icon ứng dụng `build/icon.ico` được áp dụng chuẩn xác cho cả 2 target.

## Architecture
- `electron-builder` chịu trách nhiệm đóng gói ứng dụng:
  - NSIS Target: Nén ứng dụng thành file installer tự bung, ghi registry shortcut, tạo trình uninstaller.
  - Portable Target: Đóng gói thành single binary tự giải nén runtime vào `%TEMP%` khi chạy.
  - `extraResources`: Giúp các file tĩnh bên ngoài mã nguồn (`GLV MAU/*.xlsx`) nằm trực tiếp trong thư mục `resources/GLV MAU` của ứng dụng thay vì bị nhét vào bên trong file nén `app.asar`, cho phép ExcelJS đọc trực tiếp theo đường dẫn vật lý.

## Related Code Files
- Modify: `package.json`

## Implementation Steps
1. Mở `package.json`, tìm phần `"build"`.
2. Thêm `"extraResources"`:
   ```json
   "extraResources": [
     {
       "from": "GLV MAU",
       "to": "GLV MAU",
       "filter": ["**/*"]
     }
   ]
   ```
3. Cập nhật mục `"win"`:
   ```json
   "win": {
     "icon": "build/icon.ico",
     "target": ["nsis", "portable"]
   }
   ```
4. Bổ sung cấu hình `"portable"` và tùy chỉnh `"nsis"`:
   ```json
   "portable": {
     "artifactName": "AuditSoft-NKC-${version}-Portable.exe",
     "requestExecutionLevel": "user"
   },
   "nsis": {
     "oneClick": false,
     "allowToChangeInstallationDirectory": true,
     "createDesktopShortcut": true,
     "createStartMenuShortcut": true,
     "shortcutName": "AuditSoft NKC",
     "artifactName": "AuditSoft-NKC-${version}-Setup.exe"
   }
   ```
5. Thêm các scripts tiện ích vào `"scripts"` trong `package.json`:
   - `"dist:portable": "npm run build && electron-builder --win portable"`
   - `"dist:setup": "npm run build && electron-builder --win nsis"`
   - `"dist:all": "npm run build && electron-builder --win nsis portable"`

## Success Criteria
- [x] `package.json` có đầy đủ cấu hình `extraResources` cho `GLV MAU`.
- [x] Cấu hình target `win` chứa cả `nsis` và `portable`.
- [x] Lệnh `npm run build` không bị xung đột cú pháp cấu hình.

## Risk Assessment
- Rủi ro: Dung lượng bản build tăng do kèm theo các file Excel mẫu `GLV MAU`.
- Đánh giá: Thư mục `GLV MAU` hiện có 12 file Excel (~1MB tổng dung lượng), hoàn toàn không đáng kể so với runtime Electron (~80MB).
