---
phase: 2
title: "Auto-Update Engine (Backend & IPC)"
status: pending
priority: P1
effort: "1.5h"
dependencies: ["phase-01-start.md"]
---

# Phase 2: Auto-Update Engine (Backend & IPC)

## Overview
Xây dựng module kiểm tra phiên bản mới từ Remote Manifest JSON trong Electron Main process, kèm cơ chế so sánh phiên bản (SemVer), IPC bridge và hàm mở liên kết tải an toàn.

## Requirements
- Functional:
  - Định nghĩa kiểu dữ liệu `AppUpdateInfo` trong `src/shared/types/update.ts`:
    - `currentVersion`: Phiên bản đang chạy của app (lấy từ app.getVersion()).
    - `latestVersion`: Phiên bản mới nhất trên remote server.
    - `hasUpdate`: Boolean cho biết có bản mới hơn không.
    - `releaseDate`: Ngày phát hành bản mới.
    - `title`: Tiêu đề thông báo cập nhật.
    - `changelog`: Mảng các gạch đầu dòng tính năng mới & sửa lỗi.
    - `downloadUrl`: Đường dẫn tải bản Setup Installer (.exe).
    - `portableUrl`: Đường dẫn tải bản Portable (.exe).
  - Viết module `src/main/updater.ts` với hàm `checkForUpdates()`:
    - Hỗ trợ lấy URL manifest từ cấu hình mặc định (GitHub raw hoặc endpoint tùy chọn).
    - Sử dụng `net.fetch` hoặc `fetch` có gắn timeout 5 giây để không làm treo ứng dụng khi mạng lag.
    - So sánh phiên bản dựa trên thuật toán Semantic Versioning (x.y.z).
    - Xử lý lỗi an toàn (Fail-safe): Nếu không có mạng hoặc server lỗi, trả về `hasUpdate: false` cùng thông điệp lỗi nhẹ nhàng, không quăng exception.
  - IPC Handlers trong Electron Main:
    - Channel `auditsoft/checkUpdate`: Cho phép Renderer yêu cầu kiểm tra cập nhật.
    - Channel `auditsoft/openExternalUrl`: Mở liên kết tải hoặc changelog trên trình duyệt web mặc định của người dùng qua `shell.openExternal`.
- Non-functional:
  - Tuyệt đối không chặn luồng khởi động (Non-blocking async).
  - Tương thích tốt với cả bản Setup NSIS và bản Portable.

## Architecture
```
Renderer Process                Preload Bridge               Main Process
      │                               │                           │
      ├─ window.audit.checkUpdate() ─►├─ IPC.invoke(checkUpdate)─►├─ fetch(version.json)
      │                               │                           ├─ SemVer compare
      │◄── AppUpdateInfo result ──────┼◄──────────────────────────┴─ Return update info
      │
      ├─ window.audit.openExternal() ─►├─ IPC.invoke(openExternal)─► shell.openExternal(url)
```

## Related Code Files
- Create: `src/shared/types/update.ts`
- Create: `src/main/updater.ts`
- Modify: `src/shared/ipc.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/main/index.ts`

## Implementation Steps
1. Tạo `src/shared/types/update.ts`:
   - Khai báo các interface `AppUpdateInfo`, `UpdateManifest`.
2. Tạo `src/main/updater.ts`:
   - Viết hàm so sánh version `compareVersions(v1: string, v2: string): number`.
   - Viết hàm `fetchUpdateManifest(manifestUrl: string, currentVersion: string): Promise<AppUpdateInfo>`.
3. Cập nhật `src/shared/ipc.ts`:
   - Bổ sung `IPC.checkUpdate = 'auditsoft/checkUpdate'`, `IPC.openExternalUrl = 'auditsoft/openExternalUrl'`.
   - Thêm vào interface `AuditBridgeApi`:
     - `checkUpdate(force?: boolean): Promise<AppUpdateInfo>`
     - `openExternalUrl(url: string): Promise<void>`
4. Cập nhật `src/preload/index.ts`:
   - Expose `checkUpdate` và `openExternalUrl` qua `contextBridge`.
5. Cập nhật `src/main/index.ts`:
   - Đăng ký `ipcMain.handle(IPC.checkUpdate, ...)` và `ipcMain.handle(IPC.openExternalUrl, ...)`.

## Success Criteria
- [x] Hàm so sánh phiên bản xử lý chính xác các trường hợp (`1.0.0` > `0.1.0`, `1.2.1` > `1.2.0`, `0.1.0` == `0.1.0`).
- [x] IPC channel `checkUpdate` trả về đúng đối tượng `AppUpdateInfo`.
- [x] Khi ngắt kết nối mạng, hàm xử lý lỗi êm dịu, không gây treo app.
- [x] Link tải mở chính xác trên trình duyệt web mặc định của Windows.

## Risk Assessment
- Rủi ro: Server manifest bị chặn bởi tường lửa công ty hoặc CORS.
- Giảm thiểu: Xử lý request từ Main process của Electron (Node runtime) nên hoàn toàn không bị hạn chế bởi chính sách CORS của trình duyệt.
