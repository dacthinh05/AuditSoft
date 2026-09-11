# Phase 03: Kiểm Thử Unit Test & Nghiệm Thu File Excel

## Mục Tiêu
Viết test suite kiểm thử việc tự động điền sheet `E 490` và `E 491` và kiểm tra file Excel kết xuất.

## Chi Tiết Công Việc

1. **Viết test suite `tests/e400-payroll-fill.test.ts`**:
   - Khởi tạo mock context gồm các bút toán chi phí lương (`642/334`, `622/334`) và trích bảo hiểm (`642/3383`, `334/3383`, `3383/112`).
   - Gọi `fillPayrollWorkingPaper(wb, ctx)`.
   - Kiểm tra `E 490`:
     - Hàng 42-53 có giá trị số `> 0`.
     - Không có giá trị `NaN` hoặc chuỗi rỗng tại các tháng có phát sinh.
   - Kiểm tra `E 491`:
     - Bảng 2 hàng 32-43: Cột B và Cột C có giá trị `> 0`.
     - Tỷ lệ tại Cột G không bị `#DIV/0!`.
     - Bảng 4.1 hàng 69-80: Cột C có giá trị chi nộp bảo hiểm.
2. **Kiểm tra Typecheck & Full Test Suite**:
   - `npm run typecheck` pass.
   - `npm run lint` pass.
   - `npm test` pass 100%.
