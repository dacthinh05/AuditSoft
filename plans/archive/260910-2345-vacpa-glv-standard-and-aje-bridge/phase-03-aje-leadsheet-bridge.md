# Phase 3: AJE Bridge — Cập Nhật Cột Điều Chỉnh Thuần Trên Các Leadsheet (*10)

## Mục Tiêu
- Xây dựng hàm helper `computeAccountAdjustment(adjustingEntries, accountPrefix, normalBalance)`:
  + Đối với tài khoản Dư Nợ (Tài sản: 111, 112, 131, 152, 156, 211...):
    * Điều chỉnh thuần = Tổng phát sinh Nợ điều chỉnh - Tổng phát sinh Có điều chỉnh.
  + Đối với tài khoản Dư Có (Nợ phải trả & Vốn: 331, 334, 338, 341, 411...):
    * Điều chỉnh thuần = Tổng phát sinh Có điều chỉnh - Tổng phát sinh Nợ điều chỉnh.
- Cập nhật các Lead schedule tương ứng:
  + `D 110` (Tiền mặt, TGNH)
  + `D 310` (Phải thu khách hàng)
  + `D 510` (Hàng tồn kho)
  + `E 110` (Vay ngắn/dài hạn)
  + `E 210` (Phải trả người bán)
  + `E 310` (Thuế phải nộp)
  + `E 410` (Phải trả người lao động)
  + `G 110` (Doanh thu bán hàng)
- Cột F (`Số dư sau kiểm toán`) tự động tính `= D + E` chính xác theo công thức Excel.
