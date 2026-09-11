---
phase: 3
title: "UI & Verification"
status: pending
effort: "1h"
files:
  - src/renderer/pages/WorkingPaperPage.tsx
  - tests/ajeDerivationEngine.test.ts
---

# Phase 3: UI & Verification

## Mục tiêu
Cho phép người dùng chọn thêm file NKC Sau Điều Chỉnh ngay trên màn hình Giấy làm việc, hiển thị trạng thái và viết bộ kiểm thử tự động toàn diện.

## Chi tiết công việc
1. Cập nhật `src/renderer/pages/WorkingPaperPage.tsx`:
   - Thêm ô chọn file thứ 2: `File NKC Sau Điều Chỉnh (Tùy chọn - Dành cho doanh nghiệp đã điều chỉnh số liệu)`.
   - Hỗ trợ cả chọn file trực tiếp lẫn kéo thả (Drag & Drop).
   - Hiển thị badge: `✨ Tự động nhận diện & Lập bút toán điều chỉnh AJE vào Lead Schedules`.
2. Tạo file kiểm thử `tests/ajeDerivationEngine.test.ts`:
   - Test phân loại `ADDED_AFTER`, `REMOVED_AFTER`, `AMOUNT_CHANGED`.
   - Test chiều Nợ/Có không bị đảo lộn sai lệch.
   - Test gán đúng mã GLV Ref (`D141`, `D341`, `D541`, `E241`...).
   - Test tính toán bù trừ trên Leadsheet: `Số sau KT = Số trước KT + Điều chỉnh AJE`.
3. Chạy `npm test` và `npm run typecheck` xác nhận xanh 100%.
