# Phase 04: Kiểm thử & Đảm bảo toàn vẹn dữ liệu (Verification)

## Mục tiêu
Đảm bảo các file Excel sinh ra hợp lệ, đầy đủ dữ liệu, chuẩn định dạng không lỗi mở file trên Microsoft Excel.

## File tác động
- `tests/unit/exportDataProfiler.test.ts` (mới)

## Chi tiết thực hiện
1. Viết test unit kiểm thử `buildProfilerWorkbook`:
   - Kiểm tra các sheet sinh ra đúng tên (`Tong hop Phan tich & Cutoff`, `Chi tiet chung tu loc`).
   - Kiểm tra số liệu các bảng phân tầng và 12 tháng khớp với dữ liệu mock.
2. Kiểm tra `buildReportWorkbook`:
   - Xác nhận có đủ 9 worksheet.
3. Chạy `npm run typecheck` và `npm test`.

## Tiêu chí nghiệm thu
- 100% test pass, mở file Excel sinh ra không bị báo lỗi XML/corruption.
