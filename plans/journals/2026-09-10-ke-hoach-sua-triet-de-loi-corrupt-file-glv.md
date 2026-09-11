# Journal: Lập Kế Hoạch Sửa Triệt Để Lỗi Corrupt File Giấy Làm Việc Khi Mở Bằng Excel

- **Date**: 2026-09-10
- **Author**: AuditSoft Engineering
- **Plan**: `plans/260910-1049-fix-glv-excel-corruption` (Validated OK, 3 phases)

## 1. Bối Cảnh & Vấn Đề Gốc
Người dùng gửi ảnh chụp màn hình thông báo lỗi từ Microsoft Excel khi mở file Giấy làm việc đã xuất (ví dụ file `D500 - HTK - Mau 2024 - Thinh.xlsx`):
1. *"We found a problem with some content in '...'. Do you want us to try to recover as much as we can? If you trust the source of this workbook, click Yes."*
2. *"The workbook cannot be opened or repaired by Microsoft Excel because it is corrupt."*

Qua điều tra chuyên sâu bằng giải nén Zip OpenXML và chạy script bisection:
- File mẫu gốc trong thư mục `GLV MAU/` mở bằng Microsoft Excel bản quyền hoàn toàn bình thường (20/20 sheets).
- Thư viện `ExcelJS` khi đọc file mẫu rồi gọi `wb.xlsx.writeFile()` tự động loại bỏ các thư mục OpenXML quan trọng (`xl/drawings/`, `xl/externalLinks/`) và làm sai lệch macro DefinedNames thành `$S$1` không có tên sheet. Khiến Microsoft Excel từ chối mở file do đứt gãy liên kết OpenXML. Toàn bộ 15/15 file mẫu khi qua ExcelJS đều bị corrupt.

## 2. Giải Pháp Đã Được Xác Minh (Thực Nghiệm 100% PASS)
Chuyển đổi sang cơ chế **Direct OpenXML Package Editor**:
- Sử dụng `adm-zip` mở gói zip của file mẫu gốc.
- Ánh xạ tên sheet $\rightarrow$ file XML tương ứng (`xl/worksheets/sheetN.xml`).
- Cập nhật trực tiếp giá trị vào XML ô tính mà không làm mất bất kỳ thành phần OpenXML nào của file gốc.
- Thực nghiệm trên file `D500` đã mở thành công trên Microsoft Excel thật qua PowerShell COM (`Sheets: 20, Value D12: 123456789`) không một lỗi nhỏ.

## 3. Lộ Trình 3 Giai Đoạn
1. **Phase 1**: Xây dựng engine `OpenXmlPackageEditor` hỗ trợ mở zip, dò sheet fuzzy, cập nhật ô số/text/ngày/lead-schedule, chèn dòng mẫu.
2. **Phase 2**: Chuyển đổi toàn bộ 12 fillers (D100 $\rightarrow$ G200) và `WorkingPaperGenerator` sang engine mới.
3. **Phase 3**: Kiểm thử tự động mở cả 12 file xuất ra bằng Microsoft Excel thật trên Windows qua COM, bảo đảm 12/12 file PASS.
