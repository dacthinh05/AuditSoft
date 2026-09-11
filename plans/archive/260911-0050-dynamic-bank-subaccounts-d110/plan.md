---
title: "Đổ Chi Tiết Động Tài Khoản Ngân Hàng Thực Tế (1121TCB, 1121VCB, 1121ACB...) Vào Sheet D 110"
description: "Nâng cấp thuật toán điền Lead Schedule D 110: thay vì gom một dòng tổng '1121 - Tiền gửi VND', hệ thống tự động bóc tách từng tài khoản ngân hàng thực tế từ CDFS (1121TCB, 1121VCB, 1121ACB...) đổ đè vào các dòng chi tiết 14, 15, 16 kèm tên ngân hàng và số dư riêng lẻ, trong khi các phần hành nhiều đối tượng (131, 331) vẫn giữ nguyên dòng tổng chuẩn mực."
status: completed
priority: P1
effort: 0.5h
branch: main
tags:
  - workingpaper
  - cash-and-bank
  - d110
  - dynamic-subaccounts
  - cdfs
created: 2026-09-11
---

# Kế Hoạch: Đổ Chi Tiết Động Tài Khoản Ngân Hàng Vào Sheet D 110

## 1. Bối Cảnh & Nguyên Tắc Nghiệp Vụ
- **Nguyên tắc phân biệt:**
  + Đối với các tài khoản có số lượng đối tượng quá lớn như Phải thu (131) và Phải trả (331): Trên Lead Schedule (`D 310`, `E 210`) chỉ hiển thị **dòng tổng hợp** (ví dụ `1311`, `1312`, `331`), chi tiết từng khách hàng/NCC được bốc mẫu đưa vào sheet phụ lục chuyên trách (`D 351.2`, `E 250.2`).
  + **Riêng đối với Tiền gửi ngân hàng (TK 112):** Số lượng ngân hàng mở trong doanh nghiệp thường ít (3 đến 8 tài khoản). Kiểm toán viên **bắt buộc phải thấy rõ từng ngân hàng cụ thể** (`1121ACB`, `1121VCB`, `1121TCB`...) trên bảng tổng hợp `D 110` để đối chiếu với sổ phụ ngân hàng và thư xác nhận.
- **Hiện trạng cần khắc phục trên `D 110`:**
  + Trước đây, `D100_CashFiller.ts` gom toàn bộ vào dòng 14 là `1121` và dòng 15 là `1122`, khiến các dòng chi tiết 14, 15, 16 trong template vẫn giữ tên ngân hàng cũ của file mẫu (*HUANAN, IVB, CTCB*).

## 2. Giải Pháp Triển Khai
1. **Quét tài khoản con chi tiết `112*` từ `ctx.cdfsAccounts`:**
   - Lấy danh sách các tài khoản chi tiết (loại trừ tài khoản tổng hợp `112`, `1121`, `1122`).
   - Sắp xếp theo số dư cuối kỳ giảm dần.
2. **Đổ động vào các dòng 14, 15, 16 của `D 110`:**
   - Hàng 14: Ngân hàng thứ 1 (Mã TK thực tế, Tên ngân hàng thực tế, Số dư CK, Số dư ĐK).
   - Hàng 15: Ngân hàng thứ 2.
   - Hàng 16: Ngân hàng thứ 3 (hoặc tài khoản tiền gửi còn lại).
   - Nếu có ít hơn 3 ngân hàng: Xóa trắng hoặc điền 0 cho dòng thừa để không bị dính tên ngân hàng rác của mẫu cũ.
   - Dòng 17 (`Cộng tiền gửi ngân hàng`): Giữ nguyên công thức `=SUM(D14:D16)` tự động cộng đúng 100% tổng tiền gửi ngân hàng.
3. **Áp dụng tương tự cho khoản mục `1281` (Tiền gửi có kỳ hạn $\le 3$ tháng):**
   - Hàng 19 & 20: Đổ động các tài khoản chi tiết `1281*` nếu có.

## 3. Files Thay Đổi
- `src/domain/workingpaper/fillers/D100_CashFiller.ts`
- `tests/workingpaper.test.ts`
