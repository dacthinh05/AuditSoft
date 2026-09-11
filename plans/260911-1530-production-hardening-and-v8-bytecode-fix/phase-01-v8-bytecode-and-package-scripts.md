# Phase 1: Khắc Phục V8 Bytecode Build & Scripts Đóng Gói (CRIT-01)

## 1. Mục Tiêu
Khắc phục triệt để sự không tương thích V8 engine giữa Node.js hệ thống (Node 24) và Electron (v33, Node 20.18), đảm bảo lệnh `npm run build:protect` tạo ra file `index.jsc` tương thích 100% với Electron runtime và không bị crash khi khởi động ứng dụng.

## 2. Phân Tích Kỹ Thuật (Root Cause Analysis)
- Khi gọi `node scripts/compile-bytecode.mjs`, Node.js mặc định của hệ thống được sử dụng.
- Phiên bản Node.js hiện tại là `v24.14.1` (V8 ~13.4).
- Phiên bản Electron là `v33.4.11` (Chromium 130 / V8 13.0 / Node 20.18).
- Bytecode của V8 phụ thuộc chặt chẽ vào cấu trúc nội bộ (internal binary layout) của phiên bản V8 cụ thể. Chênh lệch phiên bản làm hỏng cachedData header.
- **Giải pháp:** Sử dụng biến môi trường chuẩn của Electron `ELECTRON_RUN_AS_NODE=1` kết hợp với binary của Electron (`npx electron`) để thực thi script biên dịch Bytenode.

## 3. Các Bước Thực Hiện
1. **Cập nhật `scripts/compile-bytecode.mjs`**:
   - Bổ sung kiểm tra môi trường: Cảnh báo hoặc ép buộc chạy dưới Electron nếu phát hiện phiên bản Node không khớp với Electron.
   - Biên dịch cả `index.js` và nạp bytenode loader an toàn.
2. **Cập nhật `package.json`**:
   - Sửa script `"build:protect"`:
     ```json
     "build:protect": "npm run build && cross-env ELECTRON_RUN_AS_NODE=1 electron scripts/compile-bytecode.mjs"
     ```
   - Đảm bảo các script dist (`dist`, `dist:portable`, `dist:setup`) sử dụng `build:protect` thay vì `build` thường khi cần phát hành thương mại.
3. **Kiểm tra thực nghiệm**:
   - Chạy lệnh biên dịch.
   - Nạp file `index.jsc` qua Electron với `ELECTRON_RUN_AS_NODE=1 electron -e "..."` và xác nhận không có lỗi `cachedDataRejected`.

## 4. Tiêu Chí Hoàn Thành (Acceptance Criteria)
- [ ] Lệnh `npm run build:protect` chạy hoàn tất mà không có lỗi exit code.
- [ ] File `dist-electron/main/index.jsc` được sinh ra bởi Electron V8.
- [ ] Khởi chạy thử nghiệm qua Electron thành công.
