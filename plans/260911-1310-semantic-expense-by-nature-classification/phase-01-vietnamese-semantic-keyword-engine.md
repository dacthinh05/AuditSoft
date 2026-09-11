# Phase 1: Xây Dựng Bộ Từ Điển Ngữ Nghĩa Kiểm Toán Tiếng Việt & Hàm Chuẩn Hóa Chuỗi

## 1. Mục Tiêu
Xây dựng hàm chuẩn hóa chuỗi tiếng Việt không dấu và bộ từ điển từ khóa đặc thù cho 5 yếu tố chi phí trong kế toán kiểm toán Việt Nam.

## 2. File Chỉnh Sửa
- `src/domain/analytics/ExpenseByNatureEngine.ts`

## 3. Các Bước Thực Hiện
1. Viết hàm `normalizeText(str: string): string`:
   - Chuyển chữ thường.
   - Loại bỏ dấu tiếng Việt (bỏ dấu thanh, `đ` -> `d`).
   - Chuẩn hóa khoảng trắng và ký tự đặc biệt.
2. Thiết lập bảng từ khóa kiểm toán cho 5 yếu tố chi phí (`EXPENSE_NATURE_KEYWORDS`):
   - **`LABOR` (Nhân công):**
     `['luong', 'nhan vien', 'cong nhan', 'tien cong', 'thuong', 'bao hiem', 'bhxh', 'bhyt', 'bhtn', 'kpcd', 'an ca', 'an trua', 'dong phuc', 'phu cap', 'thu lao', 'kiem nhiem', 'nhan su', 'tro cap']`
   - **`DEPRECIATION` (Khấu hao):**
     `['khau hao', 'hao mon', 'tscd', 'tai san co dinh']`
   - **`RAW_MATERIALS` (Nguyên vật liệu):**
     `['nguyen lieu', 'vat lieu', 'vat tu', 'phu tung', 'bao bi', 'nhan mac', 'xuat kho vl', 'nvl', 'xang dau', 'nhien lieu', 'nguyen vat lieu']`
   - **`OUTSIDE_SERVICES` (Dịch vụ mua ngoài):**
     `['dich vu', 'thue ngoai', 'thue nha', 'thue van phong', 'thue kho', 'gia cong', 'dien', 'nuoc', 'vien thong', 'internet', 'dien thoai', 'van chuyen', 'cuoc', 'sua chua', 'bao duong', 'tu van', 'quang cao', 've may bay', 'kiem toan', 'dich vu ngoai', 'gui hang', 'boc xep']`
   - **`OTHER_CASH` (Khác bằng tiền):**
     `['cong cu', 'dung cu', 'ccdc', 'phan bo', 'tiep khach', 'cong tac phi', 'le phi', 'thue mon bai', 'hoi nghi', 'tai tro', 'lai vay', 'phat', 've cau duong', 'phi duong bo', 'bang tien']`
3. Viết hàm `matchNatureKeyword(text: string): ExpenseNatureCategory | null`:
   - Ưu tiên kiểm tra các cụm từ dài trước (tránh trường hợp "chi phí nhân viên bán hàng" bị match nhầm).

## 4. Tiêu Chí Kiểm Tra
- Các chuỗi `"Chi phí ăn trưa, phụ cấp nhân viên"`, `"Lương ca 3"`, `"Bảo hiểm công nhân"` match chính xác `LABOR`.
- Các chuỗi `"Gia công thêu ngoài"`, `"Tiền điện nước xưởng"`, `"Cước viễn thông"` match chính xác `OUTSIDE_SERVICES`.
- Các chuỗi `"Khấu hao máy may Juki"` match chính xác `DEPRECIATION`.
