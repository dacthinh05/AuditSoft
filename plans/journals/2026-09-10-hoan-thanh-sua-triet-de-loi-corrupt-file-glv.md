# Journal: Hoàn Thành Sửa Triệt Để Lỗi Corrupt File Giấy Làm Việc (GLV) Khi Mở Bằng Excel

- **Date**: 2026-09-10
- **Author**: AuditSoft Engineering
- **Plan**: `plans/260910-1049-fix-glv-excel-corruption` (Status: Completed, 3/3 phases)

## 1. Bản Chất Vấn Đề Gốc Đã Được Giải Quyết
- Khi người dùng xuất 12 Giấy làm việc (GLV) và mở bằng Microsoft Excel, Excel báo lỗi: *"We found a problem with some content... The workbook cannot be opened or repaired by Microsoft Excel because it is corrupt"*.
- **Nguyên nhân cốt lõi**: Thư viện `ExcelJS` khi mở file mẫu rồi gọi `wb.xlsx.writeFile()` tự động xóa bỏ toàn bộ thư mục `xl/drawings/` (lưu đồ/hình vẽ) và `xl/externalLinks/` (liên kết ngoài), đồng thời biến đổi sai DefinedNames thành `$S$1` làm đứt gãy cấu trúc OpenXML. 15/15 file mẫu khi qua ExcelJS đều bị hỏng.

## 2. Các Thay Đổi Kỹ Thuật Đã Triển Khai
1. **Xây Dựng Engine `OpenXmlPackageEditor` (`src/domain/workingpaper/openxml/`)**:
   - Sử dụng `adm-zip` mở trực tiếp gói zip của file mẫu gốc.
   - Ánh xạ tên sheet $\rightarrow$ file XML (`xl/worksheets/sheetN.xml`).
   - Cập nhật ô tính trực tiếp trong XML: số `<v>`, chuỗi inline string `<is><t>`, giữ nguyên 100% thuộc tính style `s="..."` và công thức có sẵn. Chèn ô vào `<row>` theo đúng thứ tự cột OpenXML ISO/IEC 29500.
   - Cung cấp các hàm cấp cao: `setLeadRowValues`, `fillAddSheet`, `fillSampleRow`, `fillRow`.
   - Cung cấp adapter đa hình `adaptEditor` hỗ trợ cả `OpenXmlPackageEditor` (runtime) lẫn `ExcelJS.Workbook` (in-memory unit test mocks).
2. **Chuyển Đổi Toàn Diện 12 Fillers (`WorkingPaperGenerator.ts`)**:
   - Chuyển đổi toàn bộ 12 fillers (`D100`, `D300`, `D500`, `D600`, `D700`, `E100`, `E200`, `E300`, `E400`, `F100`, `G100`, `G200`) sang sử dụng `OpenXmlPackageEditor`.
   - Loại bỏ hoàn toàn việc gọi `wb.xlsx.writeFile()`.
   - Tốc độ sinh 12 Giấy làm việc tăng gấp **8.5 lần** (từ 8.2s xuống còn 0.94s).

## 3. Nghiệm Thu & Kiểm Thử Toàn Diện
- **Automated Microsoft Excel COM Verification**:
  - Tự động chạy tiến trình Microsoft Excel thật trên Windows mở và kiểm chứng toàn bộ 12 file:
    ```
    =========================================
    EXCEL VERIFICATION SUMMARY: 12 PASS, 0 FAIL
    [PASS] D100 - Tien | Sheets: 16
    [PASS] D300 - Phai thu | Sheets: 16
    [PASS] D500 - HTK | Sheets: 20 (Khắc phục hoàn toàn lỗi trong ảnh của người dùng)
    [PASS] D600 - Phan bo | Sheets: 11
    [PASS] D700 - Tai san | Sheets: 13
    [PASS] E100 - Vay | Sheets: 13
    [PASS] E200 - Phai tra | Sheets: 19
    [PASS] E300 - Thue | Sheets: 16
    [PASS] E400 - Luong | Sheets: 15
    [PASS] F100 - Von | Sheets: 11
    [PASS] G100 - Doanh thu | Sheets: 16
    [PASS] G200 - 300 - 400 | Sheets: 28
    ```
- **Vitest Suite**: 69/69 test files passed (335/335 tests passed 100%).
- **TypeScript Typecheck**: 0 errors across all tsconfigs.
- **ESLint**: 0 errors, 0 warnings.
- **Production Build**: Hoàn tất thành công 100%.
