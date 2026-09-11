---
phase: 1
title: "Core Engine Print Optimization"
status: in_progress
effort: "1.5h"
files:
  - src/domain/workingpaper/openxml/PrintLayoutNormalizer.ts
  - src/domain/workingpaper/openxml/OpenXmlPackageEditor.ts
  - src/domain/workingpaper/b410/B410Renderer.ts
---

# Phase 1: Core Engine Print Optimization

## Mục tiêu
Xây dựng module `PrintLayoutNormalizer` có khả năng can thiệp trực tiếp vào OpenXML Worksheet XML và Workbook XML để thiết lập cấu hình trang in hoàn hảo theo chuẩn ECMA-376 Part 4.

## Chi tiết công việc
1. Tạo file `src/domain/workingpaper/openxml/PrintLayoutNormalizer.ts`:
   - Hàm `normalizeWorksheetPrintXml(xml: string, options: PrintOptions): string`:
     * Chèn hoặc cập nhật `<pageSetUpPr fitToPage="1"/>` bên trong `<sheetPr>`.
     * Chèn hoặc cập nhật `<pageMargins left="0.59" right="0.39" top="0.47" bottom="0.47" header="0.3" footer="0.3"/>` (đơn vị inch).
     * Chèn hoặc cập nhật `<pageSetup paperSize="9" fitToWidth="1" fitToHeight="0" orientation="landscape" r:id="..."/>`.
     * Chèn hoặc cập nhật `<printOptions horizontalCentered="1" gridLines="1"/>`.
     * Giữ đúng thứ tự các thẻ con theo quy định nghiêm ngặt của OpenXML Schema: `<sheetPr>` -> `<dimension>` -> `<sheetViews>` -> `<sheetFormatPr>` -> `<cols>` -> `<sheetData>` -> `<mergeCells>` -> `<conditionalFormatting>` -> `<printOptions>` -> `<pageMargins>` -> `<pageSetup>` -> `<headerFooter>` -> `<drawing>` -> `<legacyDrawing>`.
2. Mở rộng `OpenXmlPackageEditor.ts`:
   - Bổ sung phương thức `normalizeAllSheetsPrintLayout(defaultOrientation?: 'landscape' | 'portrait'): void`.
   - Tự động quét toàn bộ các sheet có trong file hoặc các sheet đã sửa đổi để áp dụng chuẩn trang in.
3. Tối ưu `B410Renderer.ts`:
   - Bổ sung cấu hình `pageMargins` hẹp (Narrow) và `printOptions: { horizontalCentered: true, gridLines: true }` cho cả sheet Master và tất cả các sheet phụ copy từ file thành viên.
