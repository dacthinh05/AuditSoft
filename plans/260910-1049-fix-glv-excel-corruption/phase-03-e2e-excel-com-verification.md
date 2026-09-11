# Phase 3: E2E Excel COM Verification (Kiểm Thử Mở Bằng Microsoft Excel Thật)

## 1. Mục Tiêu
Sử dụng tiến trình Microsoft Excel thực tế trên máy trạm Windows (thông qua PowerShell COM automation) để tự động mở toàn bộ 12 file Giấy làm việc đã sinh ra, kiểm tra giá trị các ô tính quan trọng và bảo đảm 100% không còn bất kỳ thông báo lỗi "corrupt" hay "repair" nào.

## 2. Kịch Bản Kiểm Thử Tự Động
1. **Quy Trình Thực Hiện**:
   - Chạy hàm `generateAllWorkingPapers` sinh đầy đủ 12 file từ `MAU NKC.xlsx` ra thư mục `output_verify_glv/`.
   - Khởi tạo tiến trình Microsoft Excel ẩn (`New-Object -ComObject Excel.Application`).
   - Duyệt qua từng file trong danh sách 12 file:
     - Gọi `$excel.Workbooks.Open($path, 0, $true)`.
     - Xác nhận `wb.Sheets.Count` khớp chính xác với số lượng sheet của file mẫu gốc.
     - Đọc kiểm tra giá trị tại ô `ADD!C14` (Tên khách hàng kiểm toán).
     - Đọc kiểm tra số trước kiểm toán tại Sheet Lead Schedule (`D 110`, `D 510`, `G 110`, `G210`...).
     - Đóng workbook.
   - Thu thập kết quả: Xác nhận **12 / 12 PASS**.

2. **Kiểm Tra Hồi Quy Hệ Thống (Full Regression Test)**:
   - `npm test`: Đảm bảo toàn bộ 64+ test files hiện hữu trong dự án đều đạt kết quả Pass.
   - `npm run typecheck`: 0 lỗi typecheck trên toàn bộ `tsconfig.web.json`, `tsconfig.node.json`, `tsconfig.tests.json`.
   - `npm run lint`: 0 lỗi, 0 cảnh báo ESLint.
   - `npm run build`: Biên dịch Vite, Node & Workers thành công.

## 3. Tiêu Chí Nghiệm Thu
- [x] 12/12 file mở thành công trên Microsoft Excel không có lỗi, không có popup hỏi "We found a problem with some content...".
- [x] File mở ra có đầy đủ tên khách hàng, số dư tài khoản và các dòng mẫu chọn.
- [x] Tất cả các lệnh build và test suite đều pass 100%.
