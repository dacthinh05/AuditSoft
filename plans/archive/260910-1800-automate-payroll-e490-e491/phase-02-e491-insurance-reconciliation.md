# Phase 02: Tự Động Bóc Tách Trích & Chi Nộp Bảo Hiểm Cho Sheet `E 491`

## Mục Tiêu
Cập nhật `src/domain/workingpaper/fillers/E400_PayrollFiller.ts` để tự động hóa trích xuất dữ liệu bảo hiểm xã hội (TK 338) vào sheet `E 491`.

## Chi Tiết Công Việc

1. **Bảng 1 (Hàng 18-22): Thống kê phát sinh đối ứng TK 338**:
   - Đối ứng Nợ 338 / Có: `111`, `112` (Chi nộp BHXH qua quỹ/ngân hàng).
   - Đối ứng Có 338 / Nợ: `334` (Khấu trừ lương), `622`, `641`, `642` (Trích tính vào chi phí).
   - Điền Cột C (PS Nợ) và Cột G (PS Có), bảo toàn công thức tỷ lệ và hàng SUM 23.

2. **Bảng 2 (Hàng 32-43): Trích & Khấu trừ BHXH 12 tháng**:
   - Duyệt qua `ctx.nkcTransactions`:
     - **Cột B (`338 & CP`):** Lọc các dòng:
       `debit` bắt đầu bằng `622, 627, 641, 642, 154` VÀ `credit` bắt đầu bằng `3383, 3384, 3386` (loại trừ `3382` KPCĐ).
     - **Cột C (`338 & 334`):** Lọc các dòng:
       `debit` bắt đầu bằng `334` VÀ `credit` bắt đầu bằng `3383, 3384, 3386`.
     - Nhóm theo tháng (Tháng 1 đến 12).
   - Điền Cột B và C tại hàng 32-43.
   - Cột D (`=B+C`), Cột G (`=B/C` ~ 2.05), Hàng 44 (`=SUM`): Giữ nguyên công thức tự tính.

3. **Bảng 4.1 (Hàng 69-80): Kiểm tra chi nộp bảo hiểm qua ngân hàng**:
   - Lọc các dòng `debit` bắt đầu bằng `338` VÀ `credit` bắt đầu bằng `112, 111` theo tháng 1-12.
   - Điền Cột C (`CỘNG CHI NỘP BH`).
   - Cột E (`=B+C`) và Cột F tự động tính chênh lệch.

4. **Bảng 4.3 (Hàng 88+): Chọn mẫu chứng từ chi nộp bảo hiểm**:
   - Lấy danh sách các chứng từ chi nộp bảo hiểm lớn nhất trong năm điền vào bảng kiểm tra thanh toán.

## Tiêu Chí Nghiệm Thu
- Cột G Bảng 2 tự động tính ra tỷ lệ xấp xỉ ~2.05, không còn bất kỳ ô `#DIV/0!` nào.
- Toàn bộ số liệu trích chi phí và trích khấu trừ lương hiển thị đầy đủ cả 12 tháng.
