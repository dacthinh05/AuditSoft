# Phase 4: Kiểm thử, Typecheck & Nghiệm thu

## Mục tiêu
Đảm bảo 100% logic phát hiện rủi ro, phân loại và xuất file Excel hoạt động chuẩn xác:
1. Viết unit test cho engine quét toàn diện rủi ro thuế `tests/comprehensive-tax-risk.test.ts`:
   - Kiểm tra phát hiện đúng bút toán phạt 811.
   - Kiểm tra phát hiện đúng chi phí không hóa đơn.
   - Kiểm tra tính toán chính xác tổng Chỉ tiêu B4.
2. Kiểm tra `tests/export-tax-risk-excel.test.ts`.
3. Chạy `npx tsc -p tsconfig.web.json --noEmit` & `npx tsc -p tsconfig.node.json --noEmit`.
4. Chạy `npx vitest run`.

## File tác động
- `tests/comprehensive-tax-risk.test.ts` (mới)
- `tests/export-tax-risk-excel.test.ts`
