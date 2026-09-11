# Phase 04: Kiểm Thử Tự Động & Đánh Giá Điểm Hồ Sơ (Verification)

## Mục tiêu
Kiểm tra tính chính xác của câu cú kết luận, vị trí hiển thị và sự toàn vẹn của file Excel sinh ra.

## File tác động
- `tests/unit/auditConclusions.test.ts` (mới)

## Chi tiết thực hiện
- Viết test unit kiểm thử `conclusionEngine.ts`: kiểm tra chuỗi kết luận sinh ra đúng mẫu chuẩn VACPA.
- Chạy `npm run typecheck` xác nhận 100% sạch lỗi types.
- Chạy toàn bộ test suite `npm test` xác nhận không có hồi quy.
