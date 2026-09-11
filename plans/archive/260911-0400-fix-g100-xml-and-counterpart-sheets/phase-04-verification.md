# Phase 04: Kiểm Thử Với Excel COM & Unit Tests (Verification)

## Mục tiêu
Đảm bảo file `G100` hoàn toàn sạch lỗi, mở bằng Microsoft Excel không có bất kỳ popup hay cảnh báo repair nào, và tất cả test cases đều pass.

## File tác động
- `tests/workingpaper.test.ts`
- `scripts/test-excel-open.ps1`

## Chi tiết thực hiện
1. Viết unit test kiểm thử bóc tách đối ứng và điền `G 190.1`, `G 190.2`.
2. Chạy script PowerShell mở file bằng Excel COM thật.
3. Xác nhận đủ 16 sheet hiển thị đầy đủ, nguyên vẹn, không có ô `#DIV/0!`.
4. Chạy `npm run typecheck` và toàn bộ test suite.
