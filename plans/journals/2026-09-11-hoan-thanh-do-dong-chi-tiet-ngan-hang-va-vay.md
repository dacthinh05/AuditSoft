# Nhật Ký Kỹ Thuật: Hoàn Thành Đổ Động Chi Tiết Từng Ngân Hàng (D 110) & Khoản Vay (E 110)

- **Ngày thực hiện:** 2026-09-11
- **Phân hệ:** Working Paper Auto-Fill Generator (Lead Schedules D 110 & E 110)
- **Quy tắc nghiệp vụ thống nhất:**
  + Các tài khoản có số lượng đối tượng lớn (131 Phải thu, 331 Phải trả, 152/156 Hàng tồn kho, 641/642 Chi phí): **Chỉ thống kê dòng tổng trên Lead Schedule** để không làm tràn vỡ cấu trúc bảng.
  + Các tài khoản có số lượng đối tượng ít và đòi hỏi kiểm tra 1:1 với thư xác nhận (**112 Tiền gửi ngân hàng, 341 Vay & nợ thuê tài chính, 1281 Tiền gửi có kỳ hạn**): **Đổ động chi tiết từng tài khoản con thực tế của khách hàng**.

## 1. Chi Tiết Thay Đổi
1. **Sheet `D 110` (Tiền & Tương đương tiền):**
   - Quét toàn bộ tài khoản con `112*` từ CDFS (loại trừ tài khoản tổng 112, 1121, 1122).
   - Đổ lần lượt các ngân hàng thực tế (`1121TCB`, `1121VCB`, `1121ACB`, `1122USD`...) kèm tên chi tiết và số dư riêng lẻ vào các dòng 14, 15, 16.
   - Xóa trắng các dòng thừa để triệt tiêu hoàn toàn tên ngân hàng cũ trong template mẫu (*HUANAN, IVB, CTCB*).
   - Đổ động chi tiết các sổ tiền gửi có kỳ hạn `1281*` vào dòng 19, 20.
   - Công thức dòng `Cộng tiền gửi ngân hàng` (`SUM(D14:D16)`) tự động tính tổng chính xác 100%.
2. **Sheet `E 110` (Vay & Nợ thuê tài chính):**
   - Phân loại các khoản vay ngắn hạn `3412*`, `3411N` và đổ động vào dòng 11, 12.
   - Phân loại các khoản vay dài hạn `3411*`, `3411D` và đổ động vào dòng 15, 16.
   - Xóa trắng dòng thừa để không dính tên mẫu cũ (*Shinhan, Thuê máy in*).

## 2. Kiểm Thử & Nghiệm Thu
- `npm run typecheck`: 0 lỗi TypeScript trên cả 3 tsconfig.
- `tests/workingpaper.test.ts`: Pass 100%, 15/15 files tạo thành công.
