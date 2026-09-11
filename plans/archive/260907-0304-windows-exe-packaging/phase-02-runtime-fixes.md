---
phase: 2
title: "Chuẩn hóa Worker Threads & Đường dẫn Template"
status: pending
priority: P1
effort: "30m"
dependencies: [1]
---

# Phase 2: Chuẩn hóa Worker Threads & Đường dẫn Template

## Overview
Xử lý triệt để hai nguy cơ tiềm ẩn có thể gây lỗi khi chạy app từ file `.exe` đã đóng gói: đường dẫn gọi `node:worker_threads` khi file worker bị unpack khỏi asar, và thứ tự ưu tiên dò tìm thư mục template `GLV MAU` trong `process.resourcesPath`.

## Requirements
- Functional:
  - Hàm `spawnWorker` trong `src/main/index.ts` phải tự động phân giải đường dẫn từ `app.asar` sang `app.asar.unpacked` nếu file vật lý tồn tại.
  - Hàm `resolveTemplateDir` trong `src/main/index.ts` phải ưu tiên tìm trong `process.resourcesPath/GLV MAU` (vị trí do `extraResources` tạo ra khi chạy `.exe`).
- Non-functional:
  - Đảm bảo tương thích 100% khi chạy ở môi trường phát triển (dev mode) lẫn môi trường đóng gói (packaged app).

## Architecture
- Node.js `worker_threads` là API cấp hệ điều hành, không hỗ trợ đọc file từ virtual filesystem `.asar` của Electron.
- Khi `electron-builder` áp dụng `asarUnpack: ["dist-electron/workers/**"]`, các file script worker sẽ nằm tại:
  `.../resources/app.asar.unpacked/dist-electron/workers/*.worker.js`
- Ta cung cấp hàm tiện ích `resolveWorkerPath`:
  ```ts
  function resolveWorkerPath(relPath: string): string {
    const fullPath = path.join(__dirname, relPath)
    const unpacked = fullPath.replace('app.asar', 'app.asar.unpacked')
    if (fs.existsSync(unpacked)) {
      return unpacked
    }
    return fullPath
  }
  ```
- Đối với `resolveTemplateDir`:
  Khi app được đóng gói, `process.resourcesPath` luôn trỏ tới thư mục `resources/` chứa các file tĩnh từ `extraResources`. Cần đặt `path.join(process.resourcesPath, 'GLV MAU')` lên đầu danh sách dò tìm (ngay sau `customDir`).

## Related Code Files
- Modify: `src/main/index.ts`

## Implementation Steps
1. Mở `src/main/index.ts`.
2. Định nghĩa hàm `resolveWorkerPath`:
   ```ts
   function resolveWorkerPath(workerRelativePath: string): string {
     const defaultPath = path.join(__dirname, workerRelativePath)
     const unpackedPath = defaultPath.replace('app.asar', 'app.asar.unpacked')
     if (fs.existsSync(unpackedPath)) return unpackedPath
     return defaultPath
   }
   ```
3. Cập nhật các vị trí khởi tạo worker:
   - Dòng 100: `const worker = spawnWorker(resolveWorkerPath('../workers/reconcile.worker.js'), { req })`
   - Dòng 162: `const worker = spawnWorker(resolveWorkerPath('../workers/export.worker.js'), req)`
4. Cập nhật hàm `resolveTemplateDir`:
   ```ts
   function resolveTemplateDir(customDir?: string): string {
     if (customDir && fs.existsSync(customDir)) return customDir
     const candidates = [
       path.join(process.resourcesPath, 'GLV MAU'),
       path.resolve(process.cwd(), 'GLV MAU'),
       path.join(app.getAppPath(), 'GLV MAU'),
       path.join(__dirname, '../../GLV MAU'),
     ]
     for (const c of candidates) {
       if (fs.existsSync(c)) return c
     }
     return path.resolve(process.cwd(), 'GLV MAU')
   }
   ```
5. Chạy kiểm tra biên dịch bằng `npm run build` để đảm bảo không có lỗi type check.

## Success Criteria
- [x] Không có lỗi runtime liên quan đến `Cannot find module` khi worker threads kích hoạt.
- [x] `resolveTemplateDir` nhận dạng đúng thư mục `GLV MAU` trong cả dev mode lẫn build artifact.

## Risk Assessment
- Rủi ro: Đường dẫn thay thế chuỗi `'app.asar'` có thể bị ảnh hưởng nếu thư mục cha của dự án chứa chuỗi `app.asar`.
- Giảm thiểu: Dùng `replace(/\bapp\.asar\b/, 'app.asar.unpacked')` hoặc kiểm tra sự tồn tại của file trước khi trỏ tới.
