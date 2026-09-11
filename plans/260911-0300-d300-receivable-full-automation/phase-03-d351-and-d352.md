# Phase 3: Triển khai logic điền D 351.1, D 351.2 và liên kết sang D 352 (Thư xác nhận)

## Mục tiêu
1. **Sheet `D 351.1` (Đợt 1 - 30/06)**:
   - Tổng hợp số dư khách hàng 6 tháng đầu năm (từ các bút toán có tháng <= 6 và số dư đầu năm).
   - Điền từ hàng 15: Cột A (Mã KH), Cột B (Tên KH), Cột C (Dư Nợ), Cột D (Dư Có).
2. **Sheet `D 351.2` (Đợt 2 - Cả năm 31/12)**:
   - Quét toàn bộ NKC/CDFS tính số dư cuối năm theo từng khách hàng.
   - Điền từ hàng 14: Cột A (Mã KH), Cột B (Tên KH), Cột C (Số dư Nợ trước ĐC), Cột D (Số dư Có trước ĐC), Cột E (`D 352`).
3. **Sheet `D 352` (Theo dõi Thư xác nhận công nợ)**:
   - Lấy danh sách khách hàng từ `D 351.2` chuyển sang.
   - Bắt đầu từ hàng 16:
     - Cột A (1): Mã KH
     - Cột B (2): Tên KH
     - Cột C (3): Số dư Nợ cần xác nhận (lấy từ D 351.2)
     - Cột D (4): Số dư Có cần xác nhận
     - Cột F (6): Trạng thái xác nhận ("Khớp" / "Đã gửi" / "P")
     - Cột G (7): Ref (`D 352.1`, `D 352.2`...)
     - Cột H (8): Kiểm tra thanh toán sau niên độ

## File tác động
- `src/domain/workingpaper/fillers/D300_ReceivableFiller.ts`
