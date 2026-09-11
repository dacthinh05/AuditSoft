---
phase: 1
title: "Local HTKK Scanner Service (Node.js & IPC)"
status: pending
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Local HTKK Scanner Service (Node.js & IPC)

## Overview
Xây dựng Service `LocalHtkkScanner` chuyên trách dò tìm và phân tích thông tin cài đặt của phần mềm HTKK trên máy tính Windows của người dùng. Service này tự động phát hiện đường dẫn cài đặt của HTKK, trích xuất số hiệu phiên bản hiện hành (`AppVersion`) từ tệp cấu hình `AutoUpdate\AppSchedulerCf.xml`, đồng thời cho phép quét danh mục tệp tờ khai gần nhất trong thư mục `DataFiles` để hỗ trợ nạp nhanh khuôn mẫu.

## Requirements
- Functional:
  - Dò tìm tự động qua danh sách các đường dẫn cài đặt tiêu chuẩn của HTKK trên Windows:
    - `C:\Program Files (x86)\HTKK`
    - `C:\Program Files\HTKK`
    - `C:\HTKK`
    - `D:\HTKK`
  - Đọc và phân tích tệp `AutoUpdate\AppSchedulerCf.xml`:
    - Trích xuất thẻ `<AppVersion>` (ví dụ `5.7.1`, `5.7.6`, `5.8.0`).
  - Hàm `detectInstallation()` trả về cấu trúc:
    - `isInstalled: boolean`
    - `installPath?: string`
    - `appVersion?: string`
    - `dataFilesCount?: number`
  - Hàm `findRecentExportedFiles()`:
    - Quét các thư mục con trong `DataFiles\<MST>` để tìm các tệp `.xml` tờ khai quyết toán gần nhất.
  - Tích hợp IPC Channel trong Electron (`src/main/index.ts` & `src/preload/index.ts`):
    - `htkk:detect`: Lấy thông tin cài đặt HTKK cục bộ.
    - `htkk:read-file`: Đọc nội dung tệp XML từ thư mục HTKK.
- Non-functional:
  - Thời gian quét và đọc thông tin HTKK dưới 50ms, không làm đơ giao diện người dùng.

## Architecture
```text
[Electron Main / Node.js]
  └── [LocalHtkkScanner.ts]
        ├── 1. checkStandardPaths() ──> Tìm thư mục HTKK
        ├── 2. readAppVersion()    ──> Đọc AppSchedulerCf.xml
        └── 3. scanDataFiles()      ──> Quét tệp XML gần nhất
             │
      [IPC Handlers]
        ├── 'htkk:detect'
        └── 'htkk:read-file'
             │
[Electron Preload / Renderer]
  └── window.electronAPI.detectLocalHtkk()
```

## Related Code Files
- Create: `src/domain/etax/LocalHtkkScanner.ts` (Lớp scanner Node.js)
- Modify: `src/main/index.ts` (Đăng ký IPC handler cho HTKK scanner)
- Modify: `src/preload/index.ts` (Expose API an toàn vào contextBridge)
- Create: `tests/local-htkk-scanner.test.ts` (Unit test kiểm thử phát hiện HTKK)

## Implementation Steps
1. Khởi tạo `src/domain/etax/LocalHtkkScanner.ts`:
   - Hàm `detect()` kiểm tra `fs.existsSync` trên các đường dẫn ứng viên.
   - Trích xuất `<AppVersion>` bằng regex an toàn.
2. Đăng ký IPC trong `src/main/index.ts`:
   - `ipcMain.handle('htkk:detect', async () => LocalHtkkScanner.detect())`
3. Expose qua preload trong `src/preload/index.ts`.
4. Viết unit test trong `tests/local-htkk-scanner.test.ts`:
   - Test phát hiện đúng thư mục `C:\Program Files (x86)\HTKK` và đọc đúng version trên máy thực tế.

## Success Criteria
- [x] Scanner phát hiện chính xác thư mục HTKK `C:\Program Files (x86)\HTKK` trên máy người dùng.
- [x] Trích xuất được phiên bản `AppVersion` hiện tại của HTKK.
- [x] IPC giao tiếp mượt mà giữa Main và Renderer.

## Risk Assessment
- **Rủi ro:** Người dùng cài đặt HTKK ở ổ đĩa tùy biến khác (ví dụ `E:\PhanMem\HTKK`).
- **Biện pháp:** Cung cấp thêm tùy chọn "Chọn thư mục HTKK khác" cho phép người dùng chỉ định đường dẫn thủ công nếu không nằm trong các đường dẫn mặc định.
