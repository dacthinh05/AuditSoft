# Plan: Khắc Phục Lỗi Format & Bảo Vệ Công Thức Giấy Làm Việc Kiểm Toán (12 Mẫu GLV)

## Tổng Quan

Sau khi rà soát trực tiếp 12 file mẫu trong `GLV MAU` và kết quả sinh file, hệ thống đã chỉ ra 4 nhóm nguyên nhân khiến Giấy làm việc bị lỗi format nghiêm trọng:
1. `normalizeWorkbookSharedFormulas` xoá trắng hơn 180 công thức có chứa liên kết sheet dạng `[N]ADD!`.
2. Fillers ghi đè thô bạo lên các dòng/cột công thức tự tính (`=SUM()`, tỷ lệ % doanh thu/chi phí) ở `D 690`, `G353`, `G453`, `G 194`, `E 191`.
3. Bảng đối chiếu thuế `E 380` ghi nhầm số Sổ cái vào cột Tờ khai thuế, gây lệch 100%. Bảng Cut-off `D 195TM` lấy sai ngày và để sót tickmark rác `ü`.
4. Hơn 1.000 ô số liệu không có viền kẻ bảng (`border: none`) và bị ép font `Cambria` vào các sheet `Times New Roman`/`Calibri`. Hơn 10 sheet bị bỏ qua do lệch khoảng trắng tên sheet (`D 353` vs `D353`).

Kế hoạch này triển khai **Phương án 2: Chuẩn hoá Engine & Fillers toàn diện** để 12 file GLV sinh ra đạt chuẩn chất lượng kiểm toán cao nhất.

---

## Danh Sách Các Phase Thực Thi

- [ ] **Phase 01: Core Helpers, Bảo Vệ Công Thức & Chuẩn Hoá Style Bảng Kẻ**
  - File: `plans/260910-1700-fix-workingpaper-formats/phase-01-helpers-and-formula-safeguard.md`
  - Mục tiêu: Sửa `helpers.ts`, viết `findWorksheetFuzzy`, hàm áp style kẻ viền mỏng (`thin border`), kế thừa font sheet, sửa hàm `normalizeWorkbookSharedFormulas` để bảo vệ công thức nội bộ.

- [ ] **Phase 02: Tinh Chỉnh Layout, Khắc Phục Ghi Đè & Căn Chỉnh Fillers**
  - File: `plans/260910-1700-fix-workingpaper-formats/phase-02-fillers-and-layout-correction.md`
  - Mục tiêu: Chỉnh sửa các fillers (`D600`, `G200`, `E300`, `G100`, `D100`...): dùng `findWorksheetFuzzy`, tránh ghi đè dòng tổng cộng `=SUM()`, sửa vị trí cột `E 380`, lọc ngày Cut-off chuẩn 31/12 và dọn rác mẫu cũ.

- [ ] **Phase 03: Kiểm Thử Toàn Diện 12 File & Đo Lường Chất Lượng**
  - File: `plans/260910-1700-fix-workingpaper-formats/phase-03-verification-and-quality-audit.md`
  - Mục tiêu: Chạy sinh lại toàn bộ 12 file, quét tự động kiểm tra 0 lỗi `#REF!`, 0 công thức bị đè nát, 100% border đầy đủ, chạy test suite và typecheck.

---

## Bản Đồ Rủi Ro & Ranh Giới

- **Bảo toàn công thức:** Tuyệt đối không ghi đè giá trị tĩnh vào các cột đã có công thức `=SUM(...)` hoặc liên kết giữa các sheet.
- **Tương thích ngược:** Không thay đổi chữ ký hàm `generateAllWorkingPapers`, giữ nguyên context `WorkingPaperFillContext`.
