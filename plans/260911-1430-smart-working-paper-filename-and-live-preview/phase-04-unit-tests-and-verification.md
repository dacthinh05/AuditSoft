# Phase 4: Viết Unit Test & Kiểm Thử Nghiệm Thu

## 1. Mục Tiêu
- Bổ sung Unit Test cho hàm sinh tên file `generateOutputFileName` với các kịch bản:
  - Chọn `D1` (Đợt 1): `D100 - Tien - LONG RICH D1 2026 - Thinh.xlsx`.
  - Chọn `D2` (Đợt 2): `D100 - Tien - LONG RICH D2 2026 - Thinh.xlsx`.
  - Chọn Cả năm (hoặc không chia đợt): `D100 - Tien - LONG RICH 2026 - Thinh.xlsx`.
  - Bỏ trống `companyShortName`: Fallback về `clientName`.
- Kiểm tra tính toàn vẹn:
  - Ruột bên trong các sheet Excel vẫn in đúng `clientName` đầy đủ.
- Chạy `npm run typecheck` và toàn bộ test suite.

## 2. File Chỉnh Sửa
- `tests/workingpaper.test.ts`

## 3. Các Bước Thực Hiện
1. Thêm `describe('Quy chuẩn đặt tên file 15 Giấy làm việc (D1/D2 & Tên công ty lưu file)')`.
2. Kiểm thử các trường hợp D1, D2, Cả năm và Fallback.
3. Chạy `npx vitest run tests/workingpaper.test.ts`.
4. Chạy `npm run typecheck` và toàn bộ test suite.

## 4. Tiêu Chí Kiểm Tra
- 100% test cases mới và cũ đều PASS.
- Không có lỗi typecheck hay regression.
