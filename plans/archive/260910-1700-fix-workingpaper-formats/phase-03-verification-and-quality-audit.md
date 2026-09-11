# Phase 03: Kiểm Thử Toàn Diện 12 File & Đo Lường Chất Lượng

## Mục Tiêu
Kiểm thử tự động trên toàn bộ 12 file Giấy làm việc sau khi đã áp dụng các bản vá, xác nhận không còn bất kỳ lỗi format hay lỗi công thức nào.

## Tiêu Chí Nghiệm Thu (Automated Verification)
1. Chạy test suite `tests/workingpaper.test.ts` pass 100%.
2. Chạy script audit định dạng tự động:
   - 0 công thức bị ghi đè thành số tĩnh (trừ các trường hợp cell chỉ có giá trị tĩnh ban đầu).
   - 0 ô bị lỗi `#REF!`, `#VALUE!`, `#NAME?` do quá trình sinh file gây ra.
   - 100% cell do filler ghi đều có `border` (không còn ô trắng trơn không viền).
   - Bảng thuế `E 380` có số Sổ kế toán ở cột J và khớp công thức chênh lệch.
3. `npm run typecheck` và `npm run lint` đạt 0 error.
