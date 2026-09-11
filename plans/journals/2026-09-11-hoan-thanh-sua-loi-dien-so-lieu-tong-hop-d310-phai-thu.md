# Nhật Ký: Hoàn Thành Sửa Lỗi Điền Số Liệu Tổng Hợp Sheet D 310 (Phải Thu Khách Hàng)

**Ngày thực hiện:** 2026-09-11  
**Vấn đề:** Sheet `D 310` (Bảng tổng hợp số liệu phải thu khách hàng) trong bộ GLV `D300 - Phai thu` bị 0 ở các dòng 12 (Phải thu), 14 (Người mua trả tiền trước), 16 (Dự phòng), và ô Doanh thu thuần dòng 20 bị bỏ trống dẫn tới lỗi `#DIV/0!` ở dòng 21 (Vòng quay nợ phải thu) và dòng 22 (Số ngày thu tiền bình quân).

## Nguyên Nhân & Giải Pháp Triệt Để

1. **Nhận diện sheet CDFS linh hoạt (`WorkingPaperGenerator.ts`)**:
   - Thay thế việc kiểm tra cố định 5 tên sheet bằng hàm `findCdfsSheet(wb)` sử dụng `normalizeForKey`, tự động khớp mọi biến thể tên: `CDFS`, `CDPS`, `CDSPS`, `BCDSPS`, `CĐSPS`, `Bảng CĐSPS`, `CanDoiPhatSinh`, `TrialBalance`...

2. **Bỏ chốt chặn lọc cứng tài khoản 131 (`D300_ReceivableFiller.ts`)**:
   - Bỏ điều kiện cứng `const acc131 = ctx.cdfsAccounts.get('131') || ... if (acc131)`.
   - Gom nhóm toàn bộ tài khoản bắt đầu bằng `131` (ưu tiên tài khoản con cấp 2 nếu có để tránh trùng lặp) và tự động fallback từ phát sinh Sổ NKC nếu file không có sheet CDFS.
   - Điền đầy đủ Số trước KT (`D12`), Số sau KT (`F12`), Số đầu kỳ (`G12`) cho Dòng 12 và Dòng 14, Dòng 16.

3. **Điền Doanh thu thuần (TK 511 - 521) vào Dòng 20**:
   - Đổ Doanh thu thuần vào các ô `D20`, `F20`, `G20` của sheet `D 310`.
   - Giúp công thức dòng 21 (`=F20/((F12+G12)/2)`) và dòng 22 (`=360/F21`) tự động tính toán ra số liệu vòng quay chuẩn xác, **triệt tiêu hoàn toàn lỗi `#DIV/0!`**.

4. **Kiểm thử nghiệm thu**:
   - `npm run typecheck`: 0 lỗi (Exit code 0).
   - `tests/d300-receivable-fill.test.ts`: Passed 100%, xác nhận các ô D12, F12, G12, F20 đều mang giá trị dương hợp lệ.
   - Toàn bộ test suite: 86/86 test files passed, 397/397 test cases passed.
