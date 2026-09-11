# Plan: Tự Động Hoá Giấy Làm Việc Lương & Bảo Hiểm Xã Hội (E 490 & E 491)

## Tổng Quan

Hiện tại, phần hành Lương (`E400 - Luong - Mau 2025 - Thinh.xlsx`) gặp 2 vấn đề lớn được người dùng phản ánh qua hình ảnh thực tế:
1. **Sheet `E 490` (Hình 1):** Bảng `C.1.a Thống kê đối chiếu chi phí tiền lương trong năm` (Hàng 42-53) đang bị trắng số liệu (toàn số 0 ở các cột `622`, `627`, `641`, `642`), dẫn đến dòng Tỷ lệ tại Hàng 55 bị lỗi **`#DIV/0!`**.
2. **Sheet `E 491` (Hình 2):** Bảng `2. TRÍCH & KHẤU TRỪ KPCĐ, BHXH-YT-TN: Kiểm tra trích bảo hiểm` (Hàng 32-43) chưa được điền số liệu 12 tháng vào Cột B (`338 & CP`) và Cột C (`338 & 334`), khiến Cột G (Tỉ lệ 21,5/10,5 ~ 2,05) bị lỗi **`#DIV/0!`**. Các bảng đối ứng tài khoản 338 và bảng chi nộp BHXH qua ngân hàng cũng chưa được bóc tách.

Kế hoạch này tự động hoá 100% việc trích xuất Sổ Nhật ký chung để lấp đầy số liệu hợp lý cho cả `E 490` và `E 491`, xóa sạch mọi lỗi `#DIV/0!` và cung cấp bảng chọn mẫu kiểm tra thanh toán bảo hiểm theo chuẩn kiểm toán.

---

## Danh Sách Các Phase Thực Thi

- [ ] **Phase 01: Tự Động Bóc Tách Chi Phí Lương 12 Tháng Cho Sheet `E 490`**
  - File: `plans/260910-1800-automate-payroll-e490-e491/phase-01-e490-salary-variance.md`
  - Mục tiêu: Bóc tách 12 tháng chi phí lương theo 4 bộ phận (`622`, `627`, `641`, `642`) đối ứng Có `334`, điền vào Hàng 42-53, giải quyết dứt điểm lỗi `#DIV/0!` tại Hàng 55.

- [ ] **Phase 02: Tự Động Bóc Tách Trích & Chi Nộp Bảo Hiểm Cho Sheet `E 491`**
  - File: `plans/260910-1800-automate-payroll-e490-e491/phase-02-e491-insurance-reconciliation.md`
  - Mục tiêu:
    - Bóc tách Cột B (`338 & CP`): Nợ `622, 627, 641, 642, 154` / Có `3383, 3384, 3386` (loại trừ `3382`).
    - Bóc tách Cột C (`338 & 334`): Nợ `334` / Có `3383, 3384, 3386`.
    - Bóc tách Cột C Bảng 4.1: Chi nộp bảo hiểm qua ngân hàng (Nợ `338` / Có `112`).
    - Chọn mẫu thanh toán bảo hiểm theo mức trọng yếu vào Bảng 4.3.
    - Cột G tự nhảy tỷ lệ `~2.05`, giải quyết dứt điểm lỗi `#DIV/0!`.

- [ ] **Phase 03: Kiểm Thử Unit Test & Nghiệm Thu File Excel**
  - File: `plans/260910-1800-automate-payroll-e490-e491/phase-03-verification-and-testing.md`
  - Mục tiêu: Viết unit test `tests/e400-payroll-fill.test.ts`, kiểm tra 0 lỗi `#DIV/0!`, 100% cell có viền mỏng, build và typecheck pass.

---

## Bản Đồ Rủi Ro & Ranh Giới

- **Bảo toàn công thức:** Cột D (`=B+C`), Cột G (`=B/C`), Cột F (`=D-E`), Hàng 44 (`=SUM`), Hàng 54 (`=SUM`) là công thức của template, tuyệt đối không ghi đè giá trị tĩnh.
- **Xử lý tháng an toàn:** Tự động suy luận tháng từ `t.dateVal` hoặc `postingDate` nếu `t.month` rỗng để bảo đảm không bị sót tháng.
