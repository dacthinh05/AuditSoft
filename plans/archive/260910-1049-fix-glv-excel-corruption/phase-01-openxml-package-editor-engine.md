# Phase 1: OpenXmlPackageEditor Engine (Lõi Đọc/Ghi Trực Tiếp Gói OpenXML Zip)

## 1. Mục Tiêu
Xây dựng engine thuần TypeScript `OpenXmlPackageEditor` tại `src/domain/workingpaper/openxml/OpenXmlPackageEditor.ts` sử dụng `adm-zip` để đọc file mẫu `.xlsx`, xác định chính xác các sheet cần điền qua `xl/workbook.xml` và cập nhật trực tiếp dữ liệu ô tính vào XML mà không làm mất bất kỳ thành phần OpenXML nào của file mẫu gốc.

## 2. Thiết Kế Chi Tiết Engine
1. **Quản Lý Gói Zip & Bản Đồ Sheet**:
   - Mở file mẫu bằng `AdmZip(templatePath)`.
   - Trích xuất `xl/workbook.xml` (danh sách thẻ `<sheet name="..." r:id="..."/>`) và `xl/_rels/workbook.xml.rels` (ánh xạ `rId` $\rightarrow$ `xl/worksheets/sheetN.xml`).
   - Xây dựng bảng tra cứu sheet hỗ trợ cả tìm kiếm chính xác và tìm kiếm mờ (fuzzy match: bỏ khoảng trắng, chữ hoa/thường, dấu gạch nối).

2. **Thuật Toán Cập Nhật Ô Tính Chuẩn OpenXML**:
   - Khi cập nhật ô (ví dụ `D12`):
     - Dò tìm thẻ `<row r="12">`. Nếu hàng chưa có thì chèn hàng mới theo đúng thứ tự số dòng.
     - Dò tìm thẻ `<c r="D12" ...>`.
     - Nếu ô đã tồn tại: giữ nguyên thuộc tính style hiện hữu `s="N"` (để bảo toàn font, viền, định dạng tiền tệ của template), chỉ cập nhật nội dung giá trị:
       - Số tiền: `<v>123456789</v>`
       - Chuỗi văn bản: `<c r="D12" t="inlineStr" s="..."><is><t>VĂN BẢN</t></is></c>` (dùng inline string cực kỳ an toàn, không phụ thuộc `sharedStrings.xml`).
     - Nếu ô chưa tồn tại trong hàng: chèn thẻ `<c r="D12">` vào đúng vị trí thứ tự cột (A $\rightarrow$ B $\rightarrow$ C $\rightarrow$ D...) theo quy chuẩn OpenXML ISO/IEC 29500.

3. **Bộ Hàm Thao Tác Nghiệp Vụ Cấp Cao (High-Level Helpers)**:
   - `setLeadRowValues(sheetName, rowNum, { ck, dk, tk, ten })`: Điền số trước kiểm toán (Cột 4) và số đầu kỳ (Cột 7) của bảng Lead Schedule, tuyệt đối không chạm vào cột công thức 5 (AJE) và cột 6 (Sau KT).
   - `fillAddSheet(engagement)`: Điền thông tin khách hàng, niên độ, tên kiểm toán viên, công ty kiểm toán vào sheet `ADD`.
   - `fillSampleRows(sheetName, startRow, samples)`: Điền danh sách các chứng từ mẫu chọn vào các sheet D191, D595, E191, G490...
   - `fillMonthlyGrid(sheetName, gridData)`: Điền bảng phân tích 12 tháng (G353/G453, E380, E490...).

4. **Lưu File Đầu Ra**:
   - Đóng gói các buffer sheet XML đã cập nhật vào zip package và ghi ra file đích bằng `zip.writeZip(outputPath)`.

## 3. Tiêu Chí Nghiệm Thu
- [x] Mở template `D500`, gọi `setLeadRowValues` và lưu file.
- [x] Kiểm thử qua script PowerShell COM với Microsoft Excel: Mở thành công 20/20 sheets, đọc đúng giá trị ô vừa điền, không có thông báo lỗi hay phục hồi.
