# Phase 02: Tinh Chỉnh Layout, Khắc Phục Ghi Đè & Căn Chỉnh Fillers

## Mục Tiêu
Rà soát và sửa đổi toàn bộ các filler chuyên biệt để:
1. Sử dụng `findWorksheetFuzzy` thay cho việc gọi tên sheet cứng (`wb.getWorksheet(...)`), giúp nạp đúng hơn 10 sheet đang bị bỏ sót.
2. Không ghi đè lên các dòng/cột công thức đã có sẵn trong template.
3. Điều chỉnh dữ liệu và ngữ nghĩa kiểm toán đúng chuẩn (bảng thuế E 380, bảng chọn mẫu D 191.1, bảng Cut-off D 195TM).

## Chi Tiết Công Việc

1. **`D600_PrepaidFiller.ts`**:
   - Khắc phục lỗi ghi đè tại sheet `D 690`:
   - Bảng tại hàng 14 là bảng so sánh cơ cấu PS Nợ/Có. Cột D và H là công thức tỷ lệ, hàng 19 là công thức `=SUM()`.
   - Chuyển việc ghi danh sách chi tiết sang bảng chi tiết bên dưới (sau hàng 25) hoặc điền đúng cấu trúc đối ứng vào bảng đối ứng 141/242.

2. **`G200_ExpenseFiller.ts`**:
   - Sửa `fillMonthlyExpenseSheet`:
   - Chỉ điền số liệu vào các cột tài khoản chi phí con (`64xx`).
   - Giữ nguyên công thức tại Cột Tổng (`=SUM(...)`), Cột Doanh thu (`=+ADD!...`) và Cột Tỷ lệ (`=Tổng/Doanh thu`), không ghi đè giá trị tĩnh.

3. **`E300_TaxFiller.ts`**:
   - Sửa sheet `E 380`:
   - Cột B & C là số thuế theo TỜ KHAI THUẾ GTGT.
   - Cột J là số thuế theo SỔ KẾ TOÁN (PS Nợ 1331).
   - Điền số NKC vào Cột J; điền số từ `ctx.vatDeclarations` vào Cột B/C/D/E/F/G.
   - Cập nhật tiêu đề năm niên độ tại hàng 15 và 34 (thay cho năm cũ 2017/2022).

4. **`G100_RevenueFiller.ts`**:
   - Sửa sheet `G 194`: Không ghi đè công thức tỷ trọng tại Cột E (`=D13/$D$34`). Tìm đúng Tên KH hoặc để `Mã KH - Tên KH`.
   - Sửa sheet `G191.chonmau`: Giữ nguyên công thức `=G22*G23` và `='G 110'!G14`.

5. **`D100_CashFiller.ts`**:
   - Sửa sheet `D 195TM`:
   - Lọc đúng các giao dịch sát ngày khóa sổ 31/12 (5 giao dịch trước 31/12 và 5 giao dịch sau 31/12).
   - Dọn sạch các ô thừa từ template cũ (xoá các ký tự tickmark `ü` mồ côi từ hàng 19 trở đi).
   - Sửa sheet `D 191.1`: Không để mẫu tràn đè lên các dòng nhận xét/kết luận phía dưới.

6. **Các Filler khác (`D300`, `D500`, `D700`, `E100`, `E200`, `E400`, `F100`)**:
   - Chuyển sang `findWorksheetFuzzy` để khớp đúng `D353`, `D550`, `D553`, `D556`, `E141`, `E241`, `E252`, `E253`...
   - Đảm bảo các cell ghi mới đều qua `helpers` đã có viền mỏng.

## Kiểm Thử Phase 02
- Chạy thử `generateAllWorkingPapers` vào thư mục tạm.
- Chạy script kiểm tra xem còn sheet nào bị bỏ qua hoặc bị đè công thức `=SUM` không.
