# Phase 3: Kiểm thử tự động & Typecheck

## Mục tiêu
Đảm bảo tất cả các bài kiểm thử liên quan đến đọc Excel và nhận diện sheet đều pass 100%:
1. Chạy `npx vitest run tests/excel.test.ts tests/smart-sheet-picker.test.ts`.
2. Chạy `npx tsc -p tsconfig.web.json --noEmit` & `npx tsc -p tsconfig.node.json --noEmit`.

## File tác động
- `tests/excel.test.ts`
