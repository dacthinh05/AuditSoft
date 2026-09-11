# Phase 4: Triển khai logic bốc mẫu VSA 530 trên D 391 & Kiểm thử toàn diện

## Mục tiêu
1. **Sheet `D 391` (Chọn mẫu kiểm tra cơ bản phát sinh Nợ/Có 131)**:
   - Quét NKC lấy các giao dịch phát sinh Nợ 131 (bán hàng) và Có 131 (thu tiền).
   - Lọc các món trọng yếu (Key items) + chọn mẫu đại diện (Sampling).
   - Điền bắt đầu từ hàng 17:
     - Cột 1 (A): Ngày CT
     - Cột 2 (B): Số CT
     - Cột 3 (C): Diễn giải nội dung
     - Cột 4 (D): TK Nợ
     - Cột 5 (E): TK Có
     - Cột 6 (F): Số tiền phát sinh
     - Cột 8 (H): Tickmark `✓` / `P`
2. **Kiểm thử tự động (Unit Test)**:
   - Viết test `tests/d300-receivable-fill.test.ts`:
     - Xác nhận cả 6 sheets (`D 341`, `D 351.1`, `D 351.2`, `D 352`, `D 390`, `D 391`) đều được cập nhật dữ liệu.
     - Xác nhận không có ô công thức nào bị đè hỏng.
     - Kiểm tra file D300 mở bằng Excel COM không bị cảnh báo Repair.
3. Chạy `npx tsc -p tsconfig.web.json --noEmit` & `vitest run`.

## File tác động
- `src/domain/workingpaper/fillers/D300_ReceivableFiller.ts`
- `tests/d300-receivable-fill.test.ts` (mới)
