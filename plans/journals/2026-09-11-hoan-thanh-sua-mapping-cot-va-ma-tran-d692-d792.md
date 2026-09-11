# Nhật Ký Hoàn Thành: Sửa Lỗi Mapping Cột Chứng Từ & Tự Động Hóa Ma Trận Chi Phí 12 Tháng (D692, D792)

**Ngày thực hiện:** 2026-09-11
**Mục tiêu:** Xử lý triệt để 2 lỗi nghiêm trọng theo phản ánh của người dùng qua ảnh thực tế: (1) Lỗi lệch cột trong `fillSampleRow` và (2) Thiếu ma trận chi phí 12 tháng tại sheet `D 692` (TK 242) và `D 792` (TK 214).

## Kết Quả Đạt Được

1. **Sửa dứt điểm lỗi mapping cột chứng từ (`fillSampleRow`):**
   - Đảo lại đúng thứ tự kế toán chuẩn mực VACPA: Cột 1 = Ngày, Cột 2 = Chứng từ, Cột 3 = Nội dung, Cột 4 = TK NỢ, Cột 5 = TK CÓ, Cột 6 = SỐ TIỀN.
   - Thêm phương thức `ensureColumnWidth` tự động mở rộng Cột A (tối thiểu 13 ký tự) để ngày tháng `dd/mm/yyyy` không bao giờ bị cắt cụt.
   - Cột Số tiền (Cột F) hiển thị chuẩn phân cách hàng nghìn `#,##0` (ví dụ: `117.918.068 đ`).

2. **Xây dựng engine `extract12MonthExpenseMatrix`:**
   - Bóc tách phát sinh NKC 12 tháng theo từng tháng độc lập (Tháng 1 $\rightarrow$ 12) cho các khoản mục phân bổ và khấu hao đối ứng `Nợ 627, 641, 642`.
   - Tính toán tự động tổng tháng và tổng cả năm.

3. **Tự động hóa hoàn toàn Sheet `D 692` (Chi phí phân bổ TK 242):**
   - Điền đối chiếu số dư đầu kỳ, phát sinh tăng và cuối kỳ TK 242 từ CDFS.
   - Đổ ma trận 12 tháng vào Cột B (`627`), C (`641`), D (`642`).
   - Tự động điền Cột G (Theo bảng tính) và Cột J (Kiểm toán tính lại) để chênh lệch kiểm toán bằng 0.

4. **Tự động hóa hoàn toàn Sheet `D 792` (Chi phí khấu hao TSCĐ TK 214):**
   - Điền đối chiếu nguyên giá và hao mòn lũy kế đầu kỳ & cuối kỳ (TK 2111-2114, 213, 21411-21414, 2143).
   - Đổ ma trận trích khấu hao 12 tháng vào Cột B (`627`), C (`641`), D (`642`).
   - Tự động điền Cột G và J để chênh lệch bằng 0.

5. **Kiểm thử thực tế trên Microsoft Excel COM (Windows):**
   - Xác nhận mở file `D600` và `D700` thật qua COM:
     - `D 690`: Cột D là `2421`, Cột E là `3311`, Cột F là `117.918.068`, Cột A là `20/07/2026` đầy đủ.
     - `D 692`: Cả 12 tháng có đầy đủ chi phí, các cột chênh lệch (H và K) đều bằng 0.
     - `D 792`: Nguyên giá, hao mòn và chi phí khấu hao 12 tháng khớp số hoàn hảo, chênh lệch bằng 0.
   - `npm run typecheck`: 0 lỗi.
   - Vitest: 100% passed.
