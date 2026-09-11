---
phase: 3
title: "UI Control & Verification"
status: pending
effort: "1h"
files:
  - src/renderer/pages/WorkingPaperPage.tsx
  - tests/printLayoutNormalizer.test.ts
---

# Phase 3: UI Control & Verification

## Mục tiêu
Thêm chỉ báo giao diện trực quan cho người dùng, viết bài test tự động hóa toàn diện và kiểm tra thủ công bằng Print Preview trên Excel.

## Chi tiết công việc
1. Cập nhật `src/renderer/pages/WorkingPaperPage.tsx`:
   - Thêm badge đặc tính chuyên nghiệp: `🖨️ Chuẩn hóa trang in A4 Landscape • Khóa 1 trang ngang • Căn lề đóng còng 1.5cm`.
   - Giúp kiểm toán viên yên tâm rằng tài liệu xuất ra đã sẵn sàng cho việc in ấn hoặc lưu PDF.
2. Viết unit test `tests/printLayoutNormalizer.test.ts`:
   - Test inject `<pageSetUpPr fitToPage="1"/>` vào sheetPr có sẵn hoặc chưa có.
   - Test cập nhật `pageMargins` hẹp đúng chuẩn.
   - Test thứ tự schema OpenXML không bị xáo trộn.
   - Test chạy trên file GLV thực tế.
3. Chạy `npm run typecheck` và `npm test` để xác nhận hệ thống hoàn toàn xanh.
