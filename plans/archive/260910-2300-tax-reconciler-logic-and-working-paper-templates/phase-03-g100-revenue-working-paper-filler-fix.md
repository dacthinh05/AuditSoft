---
phase: 3
title: "Sửa Chuẩn Filler Giấy Làm Việc Doanh Thu G100 (Sheet G 150)"
status: "pending"
files_modified:
  - "src/domain/workingpaper/fillers/G100_RevenueFiller.ts"
---

# Phase 3: Sửa Chuẩn Filler Giấy Làm Việc Doanh Thu G100 (Sheet G 150)

## Mục tiêu
Sửa toàn diện logic điền dữ liệu vào Sheet `G 150` (Bảng kê đối chiếu doanh thu thuế và sổ kế toán) trong tệp mẫu `G100 - Doanh thu - Mau 2025- Thinh.xlsx`, loại bỏ hoàn toàn lỗi `#DIV/0!` và điền đúng từng cột theo Mẫu Ảnh 3 của người dùng.

## Chi tiết các bước thực hiện:

1. **Trích xuất số liệu Kê khai thuế GTGT (từ `ctx.vatDeclarations`)**:
   Theo từng tháng $m \in [1..12]$:
   - Cột B (dòng 16..27): Doanh thu 0% (Chỉ tiêu [26] + [27] từ tờ khai GTGT).
   - Cột C (dòng 16..27): Doanh thu 5% (Chỉ tiêu [28] từ tờ khai GTGT).
   - Cột D (dòng 16..27): Doanh thu 10% (Chỉ tiêu [29] từ tờ khai GTGT).
   - Cột E: **TUYỆT ĐỐI KHÔNG GHI ĐÈ** — giữ nguyên công thức `=SUM(B16:D16)` sẵn có trong template để dòng 28 và 29 tự động tính toán, không bị `#DIV/0!`.

2. **Trích xuất số liệu Sổ Kế Toán (từ `ctx.nkcTransactions`)**:
   Theo từng tháng $m \in [1..12]$:
   - Cột G (dòng 16..27): `NỢ 131 / CÓ 511*` $\rightarrow$ Phát sinh Có 511 đối ứng Nợ 131, 111, 112...
   - Cột H (dòng 16..27): `521*` $\rightarrow$ Giảm trừ doanh thu: Phát sinh Nợ 521.
   - Cột I (dòng 16..27): `7112` $\rightarrow$ Thu nhập khác: Phát sinh Có 711.
   - Cột J (dòng 16..27): `3387` $\rightarrow$ Doanh thu chưa thực hiện: Phát sinh Có 3387.
   - Cột K: **TUYỆT ĐỐI KHÔNG GHI ĐÈ** — giữ nguyên công thức chênh lệch `=+E16-G16-I16-J16+H16`.

3. **Xử lý an toàn mẫu số tại dòng 29**:
   - Nếu cả năm không phát sinh doanh thu thuế (E28 = 0) hoặc không có Sổ sách (G28+I28 = 0), xóa công thức chia tại dòng 29 hoặc đặt giá trị 0 an toàn để khi mở file Excel không xuất hiện lỗi `#DIV/0!`.
