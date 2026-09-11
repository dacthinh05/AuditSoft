# Phase 2: Migrate 12 Fillers to OpenXML (Chuyển Đổi Toàn Diện 12 Module Filler)

## 1. Mục Tiêu
Chuyển đổi toàn bộ 12 module filler (từ `D100` đến `G200`) và hàm điều phối `generateAllWorkingPapers` trong `WorkingPaperGenerator.ts` sang sử dụng `OpenXmlPackageEditor`, loại bỏ hoàn toàn việc dùng `ExcelJS` để đọc/ghi lại các file mẫu template.

## 2. Danh Sách Các File Cần Chuyển Đổi
1. `src/domain/workingpaper/types.ts`:
   - Cập nhật kiểu tham số runner: thay `(wb: ExcelJS.Workbook, ctx: WorkingPaperFillContext)` thành `(editor: OpenXmlPackageEditor, ctx: WorkingPaperFillContext) => SectionFillResult`.
2. `src/domain/workingpaper/WorkingPaperGenerator.ts`:
   - Hàm `generateAllWorkingPapers`:
     ```ts
     const editor = OpenXmlPackageEditor.load(templatePath)
     const res = runner.fn(editor, ctx)
     editor.save(outputPath)
     ```
   - Xóa bỏ hoàn toàn việc tạo `new ExcelJS.Workbook()` và gọi `wb.xlsx.writeFile()` cho các mẫu GLV.
3. Chuyển đổi 12 Fillers trong `src/domain/workingpaper/fillers/`:
   - **`D100_CashFiller.ts`**: Sheet ADD, D 110 (Lead schedule tiền mặt/ngân hàng), D 110.1, D 191.1 (chọn mẫu chi tiền mặt), D 191.2 (tiền gửi), D 195TM, D 195TGNH.
   - **`D300_ReceivableFiller.ts`**: Sheet ADD, D 310 (Phải thu KH 131), D 351, D 391.
   - **`D500_InventoryFiller.ts`**: Sheet ADD, D 510 (Hàng tồn kho 151..158, 2294), D 595 (Cutoff nhập/xuất kho).
   - **`D600_PrepaidFiller.ts`**: Sheet ADD, D 610 (Tạm ứng 141, Chi phí trả trước 242, Ký quỹ 244), D 690.
   - **`D700_FixedAssetFiller.ts`**: Sheet ADD, D 710 (TSCĐ 211..217, Khấu hao 214, XDCB 241), D 790.
   - **`E100_BorrowingFiller.ts`**: Sheet ADD, E 110 (Vay ngắn hạn & dài hạn 341), E 191.
   - **`E200_PayableFiller.ts`**: Sheet ADD, E 210 (Phải trả người bán 331), E 291.
   - **`E300_TaxFiller.ts`**: Sheet ADD, E 310 (Thuế GTGT 1331, 33311, Thuế TNDN 3334, Thuế TNCN 3335), E 380 (Đối chiếu 12 tháng).
   - **`E400_PayrollFiller.ts`**: Sheet ADD, E 410 (Chi phí lương & phải trả NLĐ 334, BHXH 338), E 490.
   - **`F100_EquityFiller.ts`**: Sheet ADD, F110 (Vốn đầu tư CSH 411, Lợi nhuận chưa phân phối 421).
   - **`G100_RevenueFiller.ts`**: Sheet ADD, G 110 (Doanh thu 511, Giảm trừ 521, DTTC 515, TN khác 711), G 150, G 151, G 191, G 194, G 195.
   - **`G200_ExpenseFiller.ts`**: Sheet ADD, G210 (Giá vốn 632), G310 (CP bán hàng 641), G410 (CP QLDN 642), G291.2, G490, G353/G453 (Phân tích chi tiết 12 tháng theo TK 4 số).

## 3. Tiêu Chí Nghiệm Thu
- [x] Cả 12 filler hoàn tất chuyển đổi sạch sẽ, không còn phụ thuộc vào `ExcelJS` khi ghi ra đĩa.
- [x] Hàm `generateAllWorkingPapers` chạy trơn tru trên dữ liệu mẫu `MAU NKC.xlsx` và sinh đủ 12 file tại thư mục đích.
- [x] TypeScript Typecheck 0 lỗi.
