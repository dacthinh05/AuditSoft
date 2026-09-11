# Phase 4: Kiểm Thử Toàn Diện & Đóng Gói Sản Phẩm (Verification & Build)

## 1. Mục Tiêu
Chạy toàn bộ quy trình kiểm thử chất lượng phần mềm, đảm bảo không phát sinh bất kỳ regression bug nào, biên dịch V8 bytecode an toàn và tạo gói cài đặt Windows (`AuditSoft-Setup.exe` & `AuditSoft-Portable.exe`) sẵn sàng bàn giao cho người dùng.

## 2. Các Bước Kiểm Thử (Verification Strategy)

### Bước 1: Kiểm thử Tĩnh & Kiểm tra Kiểu dữ liệu (Static Analysis)
- Chạy `npm run typecheck`:
  - `tsc -p tsconfig.web.json --noEmit`
  - `tsc -p tsconfig.node.json --noEmit`
  - `tsc -p tsconfig.tests.json --noEmit`
  - Yêu cầu: 0 errors.

### Bước 2: Kiểm thử Hồi quy Toàn diện (Regression Test Suite)
- Chạy `npm run test` (Vitest):
  - Kiểm tra toàn bộ 86 test files / 396 unit tests hiện tại.
  - Đảm bảo các test về license (`tests/license.test.ts`), gemini prompt (`tests/gemini-prompt.test.ts`), working paper fillers (`tests/workingpaper.test.ts`) đạt 100% PASS.

### Bước 3: Kiểm thử Thực nghiệm V8 Bytecode (Bytenode Smoke Test)
- Chạy lệnh build bảo vệ mã nguồn:
  ```bash
  npm run build:protect
  ```
- Kiểm tra file nhị phân `dist-electron/main/index.jsc` đã được tạo ra.
- Thực thi kiểm tra nạp module bytecode qua Electron runtime:
  ```bash
  cross-env ELECTRON_RUN_AS_NODE=1 npx electron -e "require('bytenode'); require('./dist-electron/main/index.jsc')"
  ```
  - Xác nhận: Không còn lỗi `Invalid or incompatible cached data (cachedDataRejected)`.

### Bước 4: Đóng Gói Thử Nghiệm (Packaging Test)
- Chạy lệnh đóng gói không nén thư mục để kiểm tra tài nguyên:
  ```bash
  npm run dist:dir
  ```
- Kiểm tra cấu trúc `dist-v117-build/win-unpacked/`:
  - Đảm bảo có thư mục `resources/GLV MAU` chứa đầy đủ các file template Excel.
  - Đảm bảo có thư mục `resources/B410`.
  - Đảm bảo `resources/app.asar.unpacked/dist-electron/workers/` có 2 worker: `reconcile.worker.js` và `export.worker.js`.
  - Đảm bảo `resources/app.asar` chứa bytecode loader và `index.jsc`.

## 3. Tiêu Chí Nghiệm Thu Hoàn Thành (Final Acceptance Criteria)
- [ ] 100% Typecheck vượt qua (0 errors).
- [ ] 100% Vitest unit tests vượt qua (396/396 tests).
- [ ] Bytenode loader khởi chạy ổn định dưới Electron V8 runtime.
- [ ] Tạo thành công bản build thử nghiệm mà không có cảnh báo thiếu file tài nguyên.
