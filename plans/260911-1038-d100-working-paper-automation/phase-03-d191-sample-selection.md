---
id: "phase-03"
name: "Tự động bốc mẫu Sheet D191.1 & D191.2 theo Đợt 1 và Đợt 2"
plan: "plans/260911-1038-d100-working-paper-automation/plan.md"
status: "pending"
---

# Pha 3: Tự động bốc mẫu Sheet D191.1 & D191.2 theo Đợt 1 và Đợt 2

## 1. Mục Tiêu
Phân tách việc bốc mẫu kiểm tra chi tiết giao dịch phát sinh thành 2 Đợt rõ ràng:
- **Sheet `D 191.1`**: Chọn mẫu giao dịch phát sinh trong **Đợt 1 (01/01 đến 30/06)**.
- **Sheet `D 191.2`**: Chọn mẫu giao dịch phát sinh trong **Đợt 2 (01/07 đến 31/12)**.

## 2. Phân Tích Cấu Trúc Sheet
- **Sheet `D 191.1` (Kiểm tra chi tiết tiền mặt - Đợt 1)**:
  - Header bảng mẫu: Hàng 22 (Ngay, Soct, Noidung, Tkn, Tkc, Sops, Check).
  - Vùng điền dữ liệu: Hàng 23 đến hàng 60.
  - Sau đó là hàng nhận xét và kết luận kiểm toán.
- **Sheet `D 191.2` (Kiểm tra chi tiết tiền gửi ngân hàng - Đợt 2)**:
  - Header bảng mẫu: Hàng 23 (Ngay, Soct, Noidung, Tkn, Tkc, Sops, Check).
  - Vùng điền dữ liệu: Hàng 24 đến hàng 100+.
  - Sau đó là hàng kết luận kiểm toán.

## 3. Các Bước Thực Hiện
1. Xác định tháng của từng giao dịch trong `ctx.nkcTransactions`:
   - Giao dịch Đợt 1: Tháng từ 1 đến 6 (`t.month >= 1 && t.month <= 6`).
   - Giao dịch Đợt 2: Tháng từ 7 đến 12 (`t.month >= 7 && t.month <= 12`).
2. Xử lý Sheet `D 191.1` (Đợt 1 - Tiền mặt):
   - Lọc các giao dịch có `t.credit.startsWith('111')` trong Đợt 1.
   - Ưu tiên chọn:
     * Top các giao dịch giá trị lớn nhất (Key items >= 10.000.000 VNĐ).
     * Bốc mẫu đại diện phân tầng các khoản chi phí quản lý/mua sắm thông thường.
   - Điền từ Hàng 23: Ngày tháng, Số CT, Diễn giải, TK Nợ, TK Có, Số tiền, Cột Check điền `P`.
3. Xử lý Sheet `D 191.2` (Đợt 2 - Tiền gửi ngân hàng):
   - Lọc các giao dịch có `t.credit.startsWith('112')` hoặc `t.debit.startsWith('112')` trong Đợt 2.
   - Ưu tiên chọn:
     * Các giao dịch chi tiền gửi lớn (> 100.000.000 VNĐ).
     * Các giao dịch thanh toán chi phí cuối năm (tháng 12).
   - Điền từ Hàng 24: Ngày tháng, Số CT, Diễn giải, TK Nợ, TK Có, Số tiền, Cột Check điền `P`.
4. Dọn dẹp các hàng còn lại: đặt giá trị `null`, không để lại dòng trống chứa chuỗi rỗng gây lỗi file.

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Sheet `D 191.1` chỉ chứa các nghiệp vụ phát sinh từ tháng 1 đến tháng 6.
- [ ] Sheet `D 191.2` chỉ chứa các nghiệp vụ phát sinh từ tháng 7 đến tháng 12.
- [ ] Các thông tin chứng từ, diễn giải và số tiền được định dạng chuẩn mực kiểm toán.
