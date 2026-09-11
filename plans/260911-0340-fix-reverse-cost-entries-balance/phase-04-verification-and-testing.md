# Phase 4: Kiểm thử tự động với dữ liệu thực tế & Typecheck

## Mục tiêu
Đảm bảo 100% không còn trường hợp nào bị lệch số liệu:
1. Cập nhật unit test `tests/expense-by-nature-balance.test.ts`:
   - Kiểm tra các bút toán giảm giá vốn: `Nợ 155 / Có 632` (hàng bán bị trả lại).
   - Kiểm tra các bút toán giảm chi phí: `Nợ 152 / Có 154` (thu hồi phế liệu).
   - Kiểm tra các bút toán xuất thẳng giá vốn: `Nợ 632 / Có 154` (vượt định mức).
   - Xác nhận `recon.difference === 0` và `recon.isBalanced === true`.
2. Chạy `npx tsc -p tsconfig.web.json --noEmit` & `npx tsc -p tsconfig.node.json --noEmit`.
3. Chạy `npx vitest run`.

## File tác động
- `tests/expense-by-nature-balance.test.ts`
