# Phase 4: Kiểm thử, Typecheck & Xác nhận không hồi quy

## Mục tiêu
Đảm bảo 100% việc chọn sheet hoạt động chuẩn xác từ backend tới frontend:
1. Viết unit test trong `tests/excel.test.ts` hoặc test riêng kiểm tra `importWorkbook` tuân thủ đúng `overrides` sheetName.
2. Chạy `npx tsc -p tsconfig.web.json --noEmit` & `npx tsc -p tsconfig.node.json --noEmit`.
3. Chạy toàn bộ test suite `npx vitest run`.

## File tác động
- `tests/sheet-override.test.ts` (mới)
