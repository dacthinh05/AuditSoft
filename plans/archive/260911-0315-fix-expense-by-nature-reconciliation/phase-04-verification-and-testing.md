# Phase 4: Kiểm thử, Typecheck & Xác thực toán học

## Mục tiêu
Đảm bảo độ lệch kiểm tra luôn triệt tiêu về 0 đ:
1. Viết unit test `tests/expense-by-nature-balance.test.ts`:
   - Test case 1: Dữ liệu có CDFS $\rightarrow$ phương trình Thuyết minh cân đối `difference === 0`.
   - Test case 2: Dữ liệu NKC độc lập không có CDFS $\rightarrow$ tự động suy biến động kho và cân đối `difference === 0`.
2. Chạy `npx tsc -p tsconfig.web.json --noEmit` & `npx tsc -p tsconfig.node.json --noEmit`.
3. Chạy `npx vitest run`.

## File tác động
- `tests/expense-by-nature-balance.test.ts` (mới)
