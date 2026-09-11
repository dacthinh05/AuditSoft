# Phase 3: Tự Động Phân Tích & Gợi Ý Tên Công Ty + Đợt Kiểm Từ File Nguồn

## 1. Mục Tiêu
Khi Kiểm toán viên kéo thả hoặc chọn file Excel nguồn (ví dụ: `LONG RICH 2025 - D2 - sau dc.xlsx`):
- Hệ thống tự động bóc tách:
  - **Tên công ty:** `LONG RICH`
  - **Đợt kiểm toán:** `D2`
  - **Năm tài chính:** `2025`
- Tự động điền vào các ô tương ứng trên form, KTV không cần gõ lại thủ công.

## 2. File Chỉnh Sửa
- `src/renderer/pages/WorkingPaperPage.tsx` (hàm `handleLoadPath`)

## 3. Các Bước Thực Hiện
1. Trong `handleLoadPath(filePath)`:
   - Lấy `baseName = filePath.split(/[/\\]/).pop() ?? ''`
   - Bóc tách Đợt kiểm toán (`auditRound`):
     - Nếu có mẫu `\b(D1|Dot\s*1|Interim)\b` (không phân biệt hoa thường) $\rightarrow$ Set `auditRound = 'D1'`.
     - Nếu có mẫu `\b(D2|Dot\s*2|Final)\b` (không phân biệt hoa thường) $\rightarrow$ Set `auditRound = 'D2'`.
   - Bóc tách Năm (`year`):
     - Khớp `\b(20\d{2})\b` $\rightarrow$ Set `fiscalYearEnd = '31/12/' + year`.
   - Bóc tách Tên công ty rút gọn (`companyShortName`):
     - Lấy phần chuỗi đứng trước Năm hoặc trước dấu `-` hoặc trước từ `D1/D2`.
     - Ví dụ: `"LONG RICH 2025 - D2 - sau dc.xlsx"`:
       - Phần trước `2025` là `"LONG RICH "` $\rightarrow$ Trim thành `"LONG RICH"`.
     - Set `companyShortName = 'LONG RICH'`.
     - Đồng bộ vào store `setEngagement`.

## 4. Tiêu Chí Kiểm Tra
- File `LONG RICH 2025 - D2 - sau dc.xlsx` $\rightarrow$ Nhận diện `LONG RICH`, đợt `D2`, năm `2025`.
- File `MAU NKC.xlsx` $\rightarrow$ Fallback an toàn, không sinh lỗi hay ký tự rác.
