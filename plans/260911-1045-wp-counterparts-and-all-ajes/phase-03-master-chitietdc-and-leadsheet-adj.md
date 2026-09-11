---
id: "phase-03"
name: "Đổ 100% AJE vào Master CHITIETDC và liên kết Cột 5/6 cho các Leadsheet *10"
plan: "plans/260911-1045-wp-counterparts-and-all-ajes/plan.md"
status: "pending"
priority: "P1"
effort: "45m"
files:
  - "src/domain/workingpaper/fillers/ABH_MasterFiller.ts"
  - "src/domain/workingpaper/fillers/D300_ReceivableFiller.ts"
  - "src/domain/workingpaper/fillers/E200_PayableFiller.ts"
  - "src/domain/workingpaper/fillers/E300_TaxFiller.ts"
  - "src/domain/workingpaper/fillers/E400_PayrollFiller.ts"
  - "src/domain/workingpaper/openxml/OpenXmlPackageEditor.ts"
---

# Pha 3: Đổ 100% AJE Vào Master CHITIETDC & Liên Kết Cột 5/6 Cho Các Leadsheet `*10`

## 1. Mục Tiêu
1. Đổ danh sách toàn bộ các bút toán AJE của mọi phần hành vào sheet trung tâm `CHITIETDC` trong tệp Master `A - B - H` (Tệp tổng hợp hồ sơ kiểm toán).
2. Tính số điều chỉnh thuần (Net Adjustment) theo từng tài khoản và điền vào **Cột 5 (Điều chỉnh thuần)** trên các bảng Leadsheet `*10` (`D 310`, `E 210`, `E 310`, `E 410`).
3. Kích hoạt giá trị **Cột 6 (Số sau kiểm toán)** để phản ánh chính xác số liệu báo cáo tài chính sau kiểm toán (`Số sau KT = Số trước KT + Điều chỉnh thuần`).

---

## 2. Đặc Tả Tọa Độ & Cấu Trúc Sheet Master `CHITIETDC`

- Tệp: `A - B - H - Mau 2025 - Thinh.xlsx`
- Sheet: `CHITIETDC`
- Header: Dòng 3.
  - Cột A: STT
  - Cột B: STC GIẤY ĐC (Số tham chiếu giấy điều chỉnh: `D341`, `E241`, `E341`...)
  - Cột C: DIỄN GIẢI
  - Cột D: TK NỢ @ CĐKT (Mã tài khoản bảng cân đối kế toán)
  - Cột E: TK CÓ @ CĐKT
  - Cột F: Số tiền điều chỉnh
  - Cột G: TK NỢ @ KQKD (Nếu ảnh hưởng KQKD)
  - Cột H: TK CÓ @ KQKD
- Dòng bắt đầu dữ liệu: Dòng 4 trở đi.
- Dòng Tổng cộng: Tự động cập nhật hàm `=SUM(F4:F...)` hoặc tính tổng giá trị số tiền điều chỉnh.

---

## 3. Quy Tắc Tính Điều Chỉnh Thuần (Cột 5 Leadsheet)

Với mỗi tài khoản trên Leadsheet (ví dụ: `131`, `2293` trên `D 310`; `331`, `338` trên `E 210`; `333` trên `E 310`; `334` trên `E 410`):

1. **Đối với tài khoản dư Nợ (Tài sản - Loại 1, 2):**
   $$\text{NetAdj} = \sum \text{AJE Debit} - \sum \text{AJE Credit}$$
   - Nếu AJE ghi Nợ tài khoản tài sản $\rightarrow$ Giá trị tài sản tăng (dương).
   - Nếu AJE ghi Có tài khoản tài sản $\rightarrow$ Giá trị tài sản giảm (âm).

2. **Đối với tài khoản dư Có (Nợ phải trả, Vốn chủ sở hữu - Loại 3, 4):**
   $$\text{NetAdj} = \sum \text{AJE Credit} - \sum \text{AJE Debit}$$
   - Nếu AJE ghi Có nợ phải trả $\rightarrow$ Nợ phải trả tăng (dương).
   - Nếu AJE ghi Nợ nợ phải trả $\rightarrow$ Nợ phải trả giảm (âm).

3. **Cập nhật ô Leadsheet:**
   - Điền giá trị `NetAdj` vào Cột 5 (Cột E trên `D 310`, `E 210`...).
   - Nếu ô Cột 6 đã có sẵn công thức Excel (ví dụ: `=D12+E12`): giữ nguyên công thức để Excel tự tính; nếu chưa có thì gán giá trị trực tiếp `= D + E`.

---

## 4. Các Bước Triển Khai

1. **Triển khai `fillMasterChiTietDc` trong `ABH_MasterFiller.ts`:**
   - Kiểm tra sheet `CHITIETDC` trong `editor`.
   - Nếu danh sách AJE có phần tử: Đổ lần lượt từng dòng từ dòng 4.
   - Nếu rỗng: Điền dòng chữ `"Không phát sinh bút toán điều chỉnh."` tại `C4`.
   - Cập nhật thông tin người lập và ngày tháng.

2. **Cập nhật hàm fill Leadsheet trong các Filler:**
   - Trong `D300_ReceivableFiller.ts`: Tính `netAdj` cho `131` và cập nhật vào ô `E12` của `D 310`.
   - Trong `E200_PayableFiller.ts`: Tính `netAdj` cho `331` và cập nhật vào Cột 5 của `E 210`.
   - Trong `E300_TaxFiller.ts`: Tính `netAdj` cho `333` và cập nhật vào Cột 5 của `E 310`.
   - Trong `E400_PayrollFiller.ts`: Tính `netAdj` cho `334` và cập nhật vào Cột 5 của `E 410`.

---

## 5. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Tệp `A - B - H` sinh ra có sheet `CHITIETDC` chứa toàn bộ 100% bút toán AJE đã gom từ các phần hành.
- [ ] Các bảng Leadsheet `D 310`, `E 210`, `E 310`, `E 410` có Cột 5 nhảy số điều chỉnh tương ứng; Cột 6 phản ánh số liệu sau điều chỉnh.
- [ ] Số liệu khớp chéo giữa `CHITIETDC` và tổng số điều chỉnh trên các Leadsheet.
- [ ] Mở tệp Master `A - B - H` bằng Microsoft Excel đạt 0 lỗi XML.
