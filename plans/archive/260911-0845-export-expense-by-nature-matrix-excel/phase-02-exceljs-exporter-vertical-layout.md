---
phase: 2
title: "Xây Dựng Bộ Xuất ExcelJS Bố Cục Dọc - Ngang Chuẩn Kiểm Toán"
status: ready
priority: P1
effort: "45m"
files:
  - "src/infrastructure/excel/exportExpenseByNature.ts"
---

# Phase 02: Xây Dựng Bộ Xuất ExcelJS Bố Cục Dọc - Ngang Chuẩn Kiểm Toán

## 1. Mục Tiêu
Tạo module `exportExpenseByNature.ts` sinh file Excel `.xlsx` chuyên nghiệp bằng thư viện `ExcelJS`:
- Hàng dọc: 12 tháng (`Tháng 01` $\rightarrow$ `Tháng 12`) và dòng tổng `CẢ NĂM`.
- Hàng ngang: Các tài khoản chi tiết gom theo 5 cụm yếu tố chi phí, kèm cột tổng nhóm và cột tổng 5 yếu tố.
- Khối Thuyết minh BCTC: Đặt ngay cạnh bảng ma trận với công thức `=SUM()` và tính độ lệch kiểm tra.

---

## 2. Thiết Kế Bố Cục Chi Tiết

### 2.1. Cấu Trúc Header 2 Tầng
- **Dòng 1-4:**
  - `A1`: Tên Doanh Nghiệp (Khách hàng)
  - `A2`: Niên độ tài chính
  - `A3`: MA TRẬN CHI PHÍ THEO YẾU TỐ 12 THÁNG & ĐỐI CHIẾU THUYẾT MINH BCTC
  - `A4`: Chuẩn mực VAS 01 / Thông tư 200 (Mục 28) - Đơn vị tính: VNĐ
- **Dòng 6 (Tầng 1 - Cụm yếu tố):**
  - Cột A (1): `KỲ KẾ TOÁN` (merge hàng 6 & 7)
  - Cột nhóm 1: `I. NGUYÊN VẬT LIỆU` (merge các cột tài khoản con + 1 cột tổng nhóm NVL) - Màu nền: `#E2EFDA` (Xanh lá nhạt)
  - Cột nhóm 2: `II. NHÂN CÔNG` (merge các cột tài khoản con + 1 cột tổng nhóm NC) - Màu nền: `#DDEBF7` (Xanh dương nhạt)
  - Cột nhóm 3: `III. KHẤU HAO TSCĐ` (merge các cột tài khoản con + 1 cột tổng nhóm KH) - Màu nền: `#FFF2CC` (Vàng nhạt)
  - Cột nhóm 4: `IV. DỊCH VỤ MUA NGOÀI` (merge các cột tài khoản con + 1 cột tổng nhóm DV) - Màu nền: `#FCE4D6` (Cam nhạt)
  - Cột nhóm 5: `V. CHI PHÍ KHÁC BẰNG TIỀN` (merge các cột tài khoản con + 1 cột tổng nhóm Khác) - Màu nền: `#EAEAEA` (Xám nhạt)
  - Cột: `TỔNG 5 YẾU TỐ CHI PHÍ` (merge hàng 6 & 7) - Màu nền: `#C6E0B4` (Xanh lá đậm)
  - Cột Spacer: (trống, độ rộng = 3)
  - Cột Khối BCTC: `BẢNG ĐỐI CHIẾU THUYẾT MINH BCTC` (merge 2 cột: Chỉ tiêu & Số tiền)
- **Dòng 7 (Tầng 2 - Tên tài khoản):**
  - Từng cột là: `Mã TK - Tên rút gọn` (ví dụ: `621 - NVL trực tiếp`, `6272 - VL phân xưởng`...).
  - Cuối mỗi nhóm là cột `CỘNG [TÊN NHÓM]` (có công thức `=SUM()`).

### 2.2. Dữ Liệu 12 Tháng & Dòng Tổng Cả Năm
- **Hàng 8 đến 19 (12 Tháng):**
  - Cột A: `Tháng 01` $\rightarrow$ `Tháng 12`.
  - Các ô tài khoản: Điền giá trị số tiền của tháng tương ứng, định dạng `#,##0`.
  - Cột tổng nhóm: Điền công thức `=SUM(CộtĐầu:CộtCuối)`.
  - Cột Tổng 5 Yếu Tố: Điền công thức cộng 5 cột tổng nhóm `=colGroup1 + colGroup2 + colGroup3 + colGroup4 + colGroup5`.
- **Hàng 20 (CẢ NĂM):**
  - Cột A: `CẢ NĂM`.
  - Toàn bộ các cột con và cột tổng: Điền công thức `=SUM(Hàng8:Hàng19)`.
  - In đậm, đóng khung double border ở cạnh đáy.

### 2.3. Khối Đối Chiếu Thuyết Minh BCTC (Cột bên phải)
Nằm từ dòng 6 đến dòng 17 tại 2 cột bên phải:
1. `Cộng 5 yếu tố chi phí`: Link sang ô Tổng 5 Yếu Tố cả năm.
2. `(+) Chi phí SXKD dở dang đầu năm (TK 154 ĐK)`: Lấy từ CDFS.
3. `(+) Tồn kho thành phẩm đầu năm (TK 155 ĐK)`: Lấy từ CDFS.
4. `(-) Chi phí SXKD dở dang cuối năm (TK 154 CK)`: Lấy từ CDFS.
5. `(-) Tồn kho thành phẩm cuối năm (TK 155 CK)`: Lấy từ CDFS.
6. `Tổng chi phí SXKD luân chuyển trong kỳ`: Công thức tính luân chuyển.
7. `(Đối ứng sổ kế toán: Nợ 911 / Có 632, 641, 642)`: Tổng kết chuyển P&L.
8. `YẾU TỐ CHI PHÍ (ĐỘ LỆCH KIỂM TRA)`: Dòng tô màu cảnh báo đỏ/xanh, hiển thị chênh lệch.

---

## 3. Kiểm Thử
- Chạy script kiểm thử `scripts/test-export-expense-by-nature.ts` sinh file mẫu và kiểm tra:
  - File mở được bình thường trên Excel, không báo lỗi XML.
  - Các công thức `=SUM()` tự động nhảy đúng giá trị.
