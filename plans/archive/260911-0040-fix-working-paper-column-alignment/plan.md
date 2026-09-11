# Plan: Chuẩn Hóa Khớp Cột & Sửa Triệt Để Lỗi Lệch Vùng Dữ Liệu 12 Giấy Làm Việc (GLV VACPA)

## 1. Bối Cảnh & Vấn Đề Cốt Lõi (Problem Statement)
Kết quả audit thực tế trên 12 file mẫu Giấy làm việc (`GLV MAU`) phát hiện các lỗi nghiêm trọng:
1. **Lệch cột Số đầu kỳ (Column Misalignment):**
   - Hàm `setLeadRowValues` trong `helpers.ts` mặc định ghi số đầu kỳ vào cột 7 (Cột G).
   - Tuy nhiên, nhiều template như **`E100 (Vay)`**, **`E200 (Phải trả 331)`**, **`E300 (Thuế)`** lại thiết kế cột **H (Cột 8)** mới là Số năm trước (PY) để công thức biến động `F - H` ở cột I hoạt động. Ghi vào cột G khiến cột H = 0 và công thức biến động bị sai lệch hoàn toàn.
2. **Đè vùng công thức & dòng tổng cộng (Range Overwrite):**
   - Tại sheet `D 110` (Tiền), khối kết luận kiểm toán bị chèn cứng vào hàng 24-25, ghi đè mất các dòng tính tổng tiền và tương đương tiền (`Cộng "Tiền"`, `Cộng "Tiền & TĐT"`).
3. **Lấy số dư tài khoản con bị thiếu (Sub-account rollup gap):**
   - Tại `D500 (Kho)` và các lead schedule khác, bot tìm chính xác mã `152`, `153`, `155`, `156`. Khi đơn vị chỉ mở tài khoản chi tiết `1521`, `1522`, `1551`, các dòng chính trên lead schedule bị điền giá trị `0`.
4. **Vùng bảng chọn mẫu / Cutoff bị lệch dòng header:**
   - Cần đảm bảo dữ liệu chứng từ chọn mẫu được điền chính xác từ dòng bắt đầu của bảng, không đè lên header hay các hàng ghi chú / tickmark.

## 2. Mục Tiêu (Outcome)
- **100% đúng cột, đúng dòng:** Lead schedule của toàn bộ 12 file GLV hiển thị đúng cột Trước kiểm toán (D) và Đúng cột Năm trước (G hoặc H tùy template).
- **Bảo toàn nguyên vẹn 100% công thức Excel:** Tuyệt đối không có bất kỳ dòng công thức `SUM`, tỷ lệ `%` hay dòng kết chuyển nào bị đè bởi dữ liệu bot điền.
- **Tự động Rollup số dư:** Tự động cộng dồn tất cả tài khoản con cấp 2, cấp 3 lên dòng tài khoản tổng hợp trên Lead schedule.

## 3. Các Giai Đoạn Triển Khai (Phases)

- [x] **Phase 1: Nâng cấp `setLeadRowValues` & Rollup Helper (`helpers.ts`)**
  - Bổ sung helper `getAccountBalanceRollup(cdfsMap, prefix)`: tự động lấy số dư tài khoản hoặc cộng dồn các tài khoản con nếu tài khoản mẹ không có số dư trực tiếp.
  - Cho phép `setLeadRowValues` hỗ trợ linh hoạt tham số `colDk: 7 | 8` hoặc tự động nhận diện vị trí cột `PY` trên template.

- [x] **Phase 2: Sửa dứt điểm lỗi đè ô & lệch cột trên nhóm Lead Schedule (D100, D300, D500, E100, E200, E300)**
  - `D100_CashFiller.ts`: Dời khối kết luận kiểm toán trên `D 110` từ hàng 24 xuống hàng 33 (dưới toàn bộ bảng tổng hợp và ghi chú).
  - `E100_BorrowingFiller.ts`: Sửa cột đầu kỳ sang cột 8 (H) cho các tài khoản vay 3411, 3412.
  - `E200_PayableFiller.ts`: Khớp đúng cột và link tham chiếu với `E 250.2`.
  - `D500_InventoryFiller.ts`: Áp dụng rollup cho toàn bộ tài khoản kho `151..158` để không còn bị số 0.

- [x] **Phase 3: Sửa lỗi vùng dữ liệu cho nhóm Chi phí & Doanh thu (G100, G200, E400)**
  - Kiểm tra và đảm bảo các sheet chi tiết `G150`, `G353`, `G453`, `E490`, `E491` khớp đúng hàng tháng T1..T12 và không đè lên hàng `SUM` tổng năm.

- [x] **Phase 4: Kiểm thử toàn diện với Microsoft Excel Inspection Script**
  - Chạy `generateAllWorkingPapers` trên dữ liệu `MAU NKC.xlsx`.
  - Dùng script kiểm tra tự động duyệt qua tất cả các ô trên các file xuất ra:
    - Xác nhận không có ô công thức nào bị biến thành giá trị tĩnh hoặc bị đè text.
    - Xác nhận các cột biến động tính ra kết quả đúng (không bị `#VALUE!`, `#REF!`, `#DIV/0!`).
