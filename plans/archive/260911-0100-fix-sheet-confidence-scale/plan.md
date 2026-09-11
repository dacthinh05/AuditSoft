# Plan: Chuẩn Hóa Thang Đo Confidence & Khắc Phục Lỗi Hiển Thị "Cần kiểm tra (1.3333333333333333%)"

## 1. Bối Cảnh & Nguyên Nhân (Problem & Root Cause)
- **Vấn đề hiển thị:** Nhãn cảnh báo hiển thị chuỗi số thập phân vô tận: `⚠ Cần kiểm tra (1.3333333333333333%)` và dropdown hiển thị `chưa khớp`.
- **Nguyên nhân cốt lõi:**
  1. Trong `src/infrastructure/excel/columnMapper.ts`: `confidence: matchedRoles / 6`. Khi file khớp nhiều vai trò (ví dụ 8 vai trò), kết quả là `8 / 6 = 1.3333333333333333` (thang đo `0.0 -> 1.0`).
  2. Trong `src/renderer/pages/SetupPage.tsx`:
     ```tsx
     {sheet.confidence >= 70 ? `✓ Khớp ${sheet.confidence}% TT200` : `⚠ Cần kiểm tra (${sheet.confidence}%)`}
     ```
     Code ở frontend đang giả định `sheet.confidence` nằm trong thang đo phần trăm `0 -> 100` (ngưỡng `>= 70`). Vì `1.33 < 70`, hệ thống coi file chuẩn TT200 này là "chưa khớp" và gắn nhãn cảnh báo đỏ với chuỗi số thập phân chưa format.

## 2. Mục Tiêu (Outcome)
- Chuẩn hóa toàn diện thang đo `confidence` về số nguyên từ `0` đến `100` (Percentage Scale 0 - 100%).
- Hiển thị nhãn trạng thái nhận diện cấu trúc trực quan, chuyên nghiệp và đúng mức độ theo chuẩn kiểm toán:
  - `confidence >= 80%`: `✓ Chuẩn cấu trúc TT200 (X%)` (Màu xanh Emerald)
  - `50% <= confidence < 80%`: `⚡ Khớp cơ bản (X%) — Cần rà soát cột` (Màu vàng Amber)
  - `confidence < 50%`: `⚠ Cần kiểm tra cấu trúc (X%)` (Màu đỏ Rose)
- Loại bỏ hoàn toàn lỗi hiển thị số thập phân dài ngoằng trên giao diện.

## 3. Các Giai Đoạn Triển Khai (Phases)

- [x] **Phase 1: Chuẩn hóa thang đo `confidence` trong `columnMapper.ts` & `inspectWorkbook.ts`**
  - Chuyển đổi `confidence` thành số nguyên 0 - 100: `Math.min(100, Math.round((matchedRoles / 6) * 100))`.
  - Đảm bảo tính nhất quán trên toàn bộ pipeline nhận diện cột.

- [x] **Phase 2: Nâng cấp hiển thị Badges & Dropdown Options trên `SetupPage.tsx`**
  - Làm tròn số khi hiển thị: `const conf = Math.round(sheet.confidence)`.
  - Cập nhật màu sắc, icon và text badge tương ứng với 3 mức độ (>=80%, >=50%, <50%).
  - Cập nhật text trong `<select>` options để hiển thị phần trăm chuẩn xác: `NKC (25 dòng — 100% TT200)`.

- [x] **Phase 3: Kiểm thử tự động & Typecheck**
  - Cập nhật và chạy unit test liên quan (`excel.test.ts`, `smart-sheet-picker.test.ts`).
  - Đảm bảo `npx tsc -p tsconfig.web.json --noEmit` đạt 100% không có lỗi.
