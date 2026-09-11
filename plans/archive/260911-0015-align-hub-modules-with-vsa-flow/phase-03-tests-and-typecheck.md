# Phase 3: Cập nhật Unit Tests & Typecheck

## Mục tiêu
Đảm bảo 100% test cases kiểm thử điều hướng và cấu trúc module pass, không có hồi quy nào.

## Chi tiết các bước:
1. Chạy `npm test` để kiểm tra các file `tests/hub-navigation.test.ts` và `tests/audit-workflow-stepper.test.ts`.
2. Sửa các assertion nếu có kiểm tra thứ tự mã `code`.
3. Chạy `npx tsc -p tsconfig.web.json --noEmit` để đảm bảo sạch lỗi TypeScript.
