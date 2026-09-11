---
id: "phase-05"
name: "Kiểm thử tự động Vitest & kiểm thử trực quan trên Microsoft Excel COM"
plan: "plans/260911-1120-fix-sample-column-mapping-and-d692-d792-matrix/plan.md"
status: "pending"
priority: "P1"
effort: "30m"
files:
  - "tests/unit/counterpartExtractor.test.ts"
  - "scripts/verify-d690-d692-d792-com.ts"
---

# Pha 5: Kiểm Thử Tự Động Vitest & Kiểm Thử Trực Quan Trên Microsoft Excel COM

## 1. Mục Tiêu
Bảo đảm toàn bộ các sửa đổi về mapping cột và ma trận 12 tháng đều đạt chuẩn chất lượng cao nhất:
1. **Kiểm tra đúng vị trí cột:** Xác nhận trên `D 690` và các sheet chọn mẫu: Cột D là TK Nợ, Cột E là TK Có, Cột F là Số tiền có định dạng hàng nghìn `#,##0`.
2. **Kiểm tra ma trận 12 tháng:** Xác nhận `D 692` và `D 792` có dữ liệu đầy đủ 12 tháng, chênh lệch bằng 0.
3. **Mở thực tế qua Excel COM:** 0 lỗi repair/corrupt trên môi trường Windows.
4. **Không phát sinh hồi quy (Zero Regression):** `npm run typecheck` đạt 0 lỗi và Vitest passed 100%.

## 2. Kịch Bản Kiểm Thử Chi Tiết

### 2.1. Unit Test Engine
- Kiểm thử `extract12MonthExpenseMatrix`:
  - Kiểm tra tính toán phân bổ cho TK 242 đối ứng 627, 641, 642.
  - Kiểm tra tính toán khấu hao cho TK 214 đối ứng 627, 641, 642.
  - Tổng các tháng cộng lại phải bằng chính xác `totalYear`.

### 2.2. Kiểm thử Microsoft Excel COM
- Chạy script sinh file với dữ liệu mẫu `MAU NKC.xlsx`.
- Mở file `D600` và `D700` bằng PowerShell COM:
  - Đọc các ô `D32`, `E32`, `F32` trên `D 690`:
    - `D32`: Chứa mã TK Nợ (ví dụ: `2422`).
    - `E32`: Chứa mã TK Có (ví dụ: `331...`).
    - `F32`: Chứa số tiền có định dạng phân cách hàng nghìn.
  - Đọc các ô `B34`, `C34`, `D34`, `H34`, `K34` trên `D 692`:
    - `H34` (Chênh lệch) và `K34` (Chênh lệch) bằng `0` hoặc `-`.
  - Đọc các ô trên `D 792`:
    - `H49` và `K49` bằng `0` hoặc `-`.

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] `npm run typecheck` đạt 0 lỗi.
- [ ] Vitest test suite passed 100%.
- [ ] Excel COM mở file thành công không có hộp thoại repair.
- [ ] Khắc phục 100% hai hiện tượng trong 2 ảnh của người dùng.
