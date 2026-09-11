---
phase: 2
title: "Working Paper Templates Integration"
status: pending
effort: "1.5h"
files:
  - src/domain/workingpaper/WorkingPaperGenerator.ts
  - src/domain/workingpaper/fillers/*.ts
---

# Phase 2: Working Paper Templates Integration

## Mục tiêu
Tích hợp `PrintLayoutNormalizer` vào toàn bộ quy trình điền Giấy làm việc kiểm toán tự động, đảm bảo mọi file xuất ra từ `WorkingPaperGenerator` đều được cấu hình trang in hoàn hảo.

## Chi tiết công việc
1. Cập nhật `WorkingPaperGenerator.ts`:
   - Trước khi lưu `editor.save(outputPath)`, gọi hàm `editor.normalizeAllSheetsPrintLayout()`.
   - Phân loại hướng trang in thông minh dựa trên mã GLV:
     * Nhóm Bảng tính & Số liệu (Leadsheet, D100, D200, D300, D500, D600, D700, E100, E200, E300, E400, F100, G100, G200): Mặc định A4 Landscape, `fitToWidth: 1`, `fitToHeight: 0`.
     * Nhóm Bìa & Chương trình (Sheet Mục lục, Sheet Biên bản tổng hợp): A4 Portrait, `fitToWidth: 1`.
2. Hỗ trợ lặp tiêu đề cột (Print Titles):
   - Đăng ký `_xlnm.Print_Titles` trong `xl/workbook.xml` cho các sheet có bảng dữ liệu lớn (như D300, D500, E200).
3. Đảm bảo toàn bộ 15 bộ filler hoạt động trơn tru không bị phá vỡ cấu trúc.
