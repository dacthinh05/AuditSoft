# Nhật Ký: Lập Kế Hoạch Sửa Lỗi Mapping Cột & Ma Trận Chi Phí 12 Tháng (D692, D792)

**Ngày thực hiện:** 2026-09-11
**Mục tiêu:** Lập kế hoạch 5 pha để giải quyết triệt để 2 vấn đề phát hiện từ ảnh thực tế người dùng cung cấp: lỗi mapping cột trong `fillSampleRow` và thiếu ma trận chi phí 12 tháng tại `D 692` & `D 792`.

## Kế Hoạch Đã Lập

1. **Thư mục kế hoạch:** `plans/260911-1120-fix-sample-column-mapping-and-d692-d792-matrix/`
2. **Các pha chi tiết:**
   - `phase-01-fix-fillsamplerow.md`: Đảo đúng thứ tự cột (D: TK Nợ, E: TK Có, F: Số tiền) và chống cắt cụt ngày tháng.
   - `phase-02-extract-12m-expense-matrix.md`: Xây dựng engine `extract12MonthExpenseMatrix` cho TK 242 và TK 214.
   - `phase-03-fill-d692-matrix.md`: Tự động hóa sheet `D 692` (Chi phí phân bổ 242 theo 12 tháng).
   - `phase-04-fill-d792-matrix.md`: Tự động hóa sheet `D 792` (Chi phí khấu hao TSCĐ 214 theo 12 tháng).
   - `phase-05-verification-and-testing.md`: Kiểm thử tự động Vitest và Microsoft Excel COM.
3. `plan.md`: Tổng hợp toàn diện kiến trúc luồng dữ liệu và danh mục rủi ro.
