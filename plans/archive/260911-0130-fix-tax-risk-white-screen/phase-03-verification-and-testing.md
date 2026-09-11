# Phase 3: Kiểm thử, Typecheck & Xác nhận không hồi quy

## Mục tiêu
Đảm bảo toàn bộ hệ thống điều hướng, kiểm tra yêu cầu nạp sổ và render module thuế hoạt động trơn tru:
1. Viết test hoặc cập nhật `tests/nkc-requirements.test.ts` kiểm tra `taxrisk` yêu cầu `BEFORE`.
2. Chạy `npx vitest run tests/hub-navigation.test.ts tests/nkc-requirements.test.ts`.
3. Chạy `npx tsc -p tsconfig.web.json --noEmit` đạt 0 lỗi.

## File tác động
- `tests/nkc-requirements.test.ts`
