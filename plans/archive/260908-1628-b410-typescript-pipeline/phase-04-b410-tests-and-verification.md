---
phase: 4
title: "Unit Tests & End-to-End Verification"
status: pending
priority: P1
effort: "1h"
dependencies: ["phase-03-b410-renderer-and-template-builder.md"]
---

# Phase 4: Unit Tests & End-to-End Verification

## Overview
Xây dựng bộ kiểm thử tự động toàn diện với `vitest` bao quát tất cả các ca biên được nêu trong đặc tả: lọc shape ẩn/rác, ảnh cao 200pt, sheet đa dạng tên, merge bất thường, và chạy end-to-end kiểm tra file xuất ra.

## Requirements
- Functional:
  - Viết unit test cho `B410ShapeFilter`:
    - Case: shape có `visible === false` -> bị loại bỏ.
    - Case: shape có `width <= 2 || height <= 2` -> bị loại bỏ.
    - Case: shape nằm ngoài toạ độ dòng dữ liệu -> bị loại bỏ.
    - Case: shape hợp lệ dạng PNG/JPEG trong cột D:E -> được giữ lại.
  - Viết unit test cho `B410Normalizer`:
    - Case: `E 440.1` -> chuẩn hóa thành `E440.1`.
    - Case: Hàng có ảnh cao 200pt -> `calculatedHeight >= 206pt`.
    - Case: Hàng chỉ có text 5 dòng -> tính đúng chiều cao.
  - Viết unit test cho `B410Parser`:
    - Case: Tên sheet `Sai sot & luu y`, `Sai sót & lưu ý`, `B410`, `b 410` -> nhận diện chính xác.
  - Viết integration test cho `B410Pipeline`:
    - Chạy tổng hợp thực tế file `Cuori` và file mẫu.
    - Đảm bảo thời gian chạy < 2 giây.
    - Đảm bảo các sheet phụ được bảo toàn đầy đủ.
- Non-functional:
  - Chạy toàn bộ test suite `npm run test` và `npm run typecheck` đạt 100% xanh.

## Related Code Files
- Create: `tests/b410-pipeline.test.ts`

## Implementation Steps
1. Tạo file `tests/b410-pipeline.test.ts`.
2. Viết các test suite theo từng module: Parser, ShapeFilter, Normalizer, Renderer.
3. Chạy `npx vitest run tests/b410-pipeline.test.ts`.
4. Chạy `npm run typecheck` và `npm run build`.

## Success Criteria
- [x] Tất cả các bài test trong `tests/b410-pipeline.test.ts` đều passed.
- [x] Toàn bộ dự án `npm run typecheck` 0 lỗi.
- [x] Build dự án thành công 100%.
