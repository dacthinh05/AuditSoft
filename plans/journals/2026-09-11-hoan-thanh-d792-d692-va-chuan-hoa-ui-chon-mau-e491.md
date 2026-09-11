# Nhật Ký Kỹ Thuật: Hoàn Thành Bổ Sung D792, D692 & Khắc Phục Triệt Để Lỗi UI Chọn Mẫu E491

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Working Paper Auto-Fill Generator (Fixed Assets, Prepaids, Payroll Sampling)
- **Vấn đề giải quyết:**
  1. Sheet `D 792` (Chi phí khấu hao 12 tháng) và `D 692` (Chi phí phân bổ 12 tháng) trước đây bị để trống gạch ngang `[-]`.
  2. Bảng 4.3 `E 491` bị tràn viền bảng (5 dòng nhưng nhồi 10 dòng làm đè chữ xuống ghi chú), chữ và số tiền dính liền `169461189 P`, và lấy nhầm tài khoản 3383 thay vì 3382 KPCĐ.
  3. Xóa bỏ hoàn toàn việc cưỡng ép số liệu `= tổng cộng` khi chưa có tài liệu độc lập (Bảng lương E490, C12-TS E491).

## 1. Chi Tiết Thực Hiện
1. **Sheet `D 792` (Khấu hao TSCĐ 12 tháng):**
   - Quét từng tháng từ Sổ NKC: bóc tách số trích khấu hao `Có 214` đối ứng Nợ `627` (SXC ~700tr/tháng), Nợ `641` (Bán hàng = 0), Nợ `642` (QLDN ~21.5tr/tháng).
   - Đổ vào hàng 49–60 của Sheet `D 792`, Cột `Theo bảng tính` và `Kiểm toán tính lại` tự động khớp đúng với số tổng hàng tháng để Cột `Chênh lệch` = 0.
   - Dòng Cả năm tự động nhảy tổng chính xác.
2. **Sheet `D 692` (Phân bổ chi phí trả trước 12 tháng):**
   - Quét từng tháng từ Sổ NKC: bóc tách số phân bổ `Có 242` đối ứng Nợ `627` (~88-118tr/tháng), Nợ `641` (= 0), Nợ `642` (~6.5-12.3tr/tháng).
   - Đổ vào hàng 34–45 của Sheet `D 692`.
3. **Chuẩn hóa Bảng 4.3 Sheet `E 491` (Kiểm tra nộp KPCĐ):**
   - Xóa sạch toàn bộ dữ liệu mẫu cũ từ dòng 88 đến 92.
   - Lọc chính xác các nghiệp vụ nộp Kinh phí công đoàn (`Nợ 3382 / Có 111, 112`) theo mức trọng yếu.
   - Khóa chặt số dòng trong khung viền 5 dòng (Hàng 88–92), tuyệt đối không tràn xuống dòng 93 trở đi.
   - Tách riêng Cột Số tiền (`number`) và Cột tickmark (`✓` in Col H), triệt tiêu vĩnh viễn lỗi dính chữ `169461189 P`.
4. **Quy tắc để trống khi chưa có dữ liệu độc lập:**
   - Tại `E 490`: Cột G (Bảng lương) và K, L, M được để trống tự nhiên, không tự động gán bằng tổng chi phí.
   - Tại `E 491`: Cột E (Thông báo BHXH) chỉ điền khi có số chi nộp ngân hàng thực tế, nếu không có chứng từ C12-TS thì để trống sạch sẽ.

## 2. Kiểm Thử & Nghiệm Thu
- `npm run typecheck`: 0 lỗi trên cả 3 tsconfig (`web`, `node`, `tests`).
- `tests/workingpaper.test.ts`: Pass 100%, 15/15 files được tạo và đọc lại sạch sẽ qua ExcelJS.
