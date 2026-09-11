# Phase 01: Tự Động Bóc Tách Chi Phí Lương 12 Tháng Cho Sheet `E 490`

## Mục Tiêu
Cập nhật `src/domain/workingpaper/fillers/E400_PayrollFiller.ts` để trích xuất đầy đủ và chính xác chi phí lương 12 tháng từ Sổ Nhật ký chung vào Bảng `C.1.a` (Hàng 42-53 của sheet `E 490`).

## Chi Tiết Công Việc

1. **Chuẩn hoá nhận diện tháng và tài khoản chi phí lương**:
   - Duyệt qua `ctx.nkcTransactions`:
     - Tài khoản Có bắt đầu bằng `334` (hoặc `3341`, `3342`, `3348`).
     - Xác định tháng chính xác: `m = t.month >= 1 && t.month <= 12 ? t.month : deriveMonth(t.dateVal)`.
     - Phân bổ số tiền vào 4 mảng 12 tháng:
       - `622`: `t.debit.startsWith('622')` (Công nhân trực tiếp).
       - `627`: `t.debit.startsWith('627')` (Quản lý phân xưởng).
       - `641`: `t.debit.startsWith('641')` (Bán hàng).
       - `642`: `t.debit.startsWith('642')` (Quản lý doanh nghiệp).

2. **Điền số liệu vào Sheet `E 490`**:
   - Hàng 42 đến 53 (Tháng 1 đến 12):
     - Cột B (2): TK 622
     - Cột C (3): TK 627
     - Cột D (4): TK 641
     - Cột E (5): TK 642
   - Cột F (`=SUM(B42:E42)`), Hàng 54 (`=SUM`), Hàng 55 (`=B54/$F$54`): Giữ nguyên công thức template.
   - Thêm viền mỏng (`THIN_BORDER`) và định dạng `#,##0` cho các ô số liệu.

## Tiêu Chí Nghiệm Thu
- Cả 12 tháng tại hàng 42-53 đều có số liệu lương thực tế từ NKC.
- Hàng 55 tự tính tỷ lệ phần trăm phân bổ hợp lệ, không còn xuất hiện lỗi `#DIV/0!`.
