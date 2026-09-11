---
title: "Sửa Triệt Để Lỗi Corrupt File Giấy Làm Việc (GLV) Khi Mở Bằng Microsoft Excel"
description: "Chuyển đổi toàn diện cơ chế điền 12 mẫu Giấy làm việc từ thư viện ExcelJS sang OpenXmlPackageEditor (cập nhật trực tiếp XML trong gói Zip), bảo toàn 100% drawings, externalLinks, styles, công thức và macro của file mẫu gốc, giải quyết dứt điểm lỗi Excel 'workbook cannot be opened or repaired because it is corrupt'."
status: completed
priority: P1
effort: "1d"
branch: main
tags: [bugfix, workingpaper, excel, openxml]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Kế Hoạch Sửa Triệt Để Lỗi Corrupt File Giấy Làm Việc (GLV) Khi Mở Bằng Microsoft Excel

## 1. Bản Chất Vấn Đề & Bằng Chứng Thực Nghiệm
- **Hiện tượng người dùng gặp phải**: Khi mở các file Giấy làm việc đã xuất (ví dụ `D500 - HTK - Mau 2024 - Thinh.xlsx`, `G200`...), Microsoft Excel hiển thị thông báo:
  1. *"We found a problem with some content in '...'. Do you want us to try to recover as much as we can? If you trust the source of this workbook, click Yes."*
  2. Khi bấm Yes $\rightarrow$ *"The workbook cannot be opened or repaired by Microsoft Excel because it is corrupt."*
- **Nguyên nhân gốc rễ (Root Cause)**:
  - Thư viện `ExcelJS` khi gọi `wb.xlsx.readFile(template)` rồi `wb.xlsx.writeFile(output)` **tự động xóa bỏ hoàn toàn** các thư mục OpenXML quan trọng của file mẫu:
    - `xl/drawings/` (hình vẽ, lưu đồ, shape).
    - `xl/externalLinks/` (các liên kết ngoài kế thừa từ file mẫu kiểm toán mẫu VACPA).
  - Đồng thời `ExcelJS` ghi đè sai các tên định danh macro (`definedNames`) thành các tọa độ thiếu tên sheet như `$S$1`.
  - Hậu quả: Microsoft Excel phát hiện liên kết trong OpenXML bị đứt gãy và từ chối mở file.
  - **Thực nghiệm đã chứng minh**: Kể cả khi file mẫu gốc không chỉnh sửa gì, chỉ cho `ExcelJS` đọc rồi ghi lại thì **15/15 file mẫu** đều bị Excel báo lỗi Corrupt. Ngược lại, file mẫu gốc mở bằng Excel COM hoàn toàn bình thường (20/20 sheets).

## 2. Giải Pháp: Cơ Chế Direct OpenXML Package Editor
Thay vì để `ExcelJS` ghi lại toàn bộ workbook làm hỏng cấu trúc:
1. Sử dụng gói `adm-zip` (đã có sẵn trong dự án) mở file mẫu `.xlsx`.
2. Đọc cấu trúc `xl/workbook.xml` và `xl/_rels/workbook.xml.rels` để ánh xạ chính xác tên sheet $\rightarrow$ file XML tương ứng (`xl/worksheets/sheetN.xml`).
3. Cập nhật trực tiếp giá trị vào XML của sheet cần điền (`ADD`, `D 510`, `D 595`...):
   - Thay thế hoặc chèn thẻ `<c r="CELL"><v>GIÁ_TRỊ</v></c>`.
   - Với chuỗi văn bản: ghi dạng inline string `<c r="CELL" t="inlineStr"><is><t>VĂN BẢN</t></is></c>` mà không làm xáo trộn bảng `sharedStrings.xml`.
4. Ghi đè file XML đã cập nhật vào zip package và lưu file `.xlsx`.
5. **Kết quả**: Bảo toàn 100% nguyên vẹn toàn bộ Drawings, ExternalLinks, Styles, Themes, Macro Names gốc. Excel mở ngay lập tức không có bất kỳ thông báo lỗi nào (Đã test thành công trên `D500` với Excel thật: `Sheets: 20, Value: 123456789`).

## 3. Lộ Trình Triển Khai (Phases Roadmap)

| # | Phase | Mô tả | Trạng thái | Ước lượng |
|---|-------|--------------------|------------|-----------|
| 1 | [Phase 1: OpenXmlPackageEditor Engine](./phase-01-openxml-package-editor-engine.md) | Xây dựng engine `OpenXmlPackageEditor` hỗ trợ mở template zip, map sheet bằng tên, cập nhật ô số/text/ngày/lead schedule, chèn các dòng mẫu chọn. | Completed | 3h |
| 2 | [Phase 2: Migrate 12 Fillers to OpenXML](./phase-02-migrate-12-fillers-to-openxml.md) | Chuyển đổi toàn bộ 12 modules filler (D100 $\rightarrow$ G200) và `WorkingPaperGenerator` sang sử dụng `OpenXmlPackageEditor`, loại bỏ `wb.xlsx.writeFile()`. | Completed | 3h |
| 3 | [Phase 3: E2E Excel COM Verification](./phase-03-e2e-excel-com-verification.md) | Viết script kiểm thử mở cả 12 file xuất ra bằng tiến trình Microsoft Excel thật trên Windows qua COM, bảo đảm 12/12 file PASS không có lỗi corrupt. | Completed | 2h |
---

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Mở toàn bộ 12 file GLV sinh ra bằng Microsoft Excel thật trên Windows: 12/12 file mở thành công không có hộp thoại báo Corrupt hoặc Repair.
- [ ] Số liệu đã điền (Tên khách hàng, Niên độ, Số dư Dòng 11..25 của Lead schedule, các dòng mẫu chọn) hiển thị đầy đủ và chính xác trên từng sheet.
- [ ] Các công thức SUM, tính toán tự động trong template được bảo toàn nguyên vẹn.
- [ ] TypeScript Typecheck, ESLint và Vitest test suite pass 100%.
