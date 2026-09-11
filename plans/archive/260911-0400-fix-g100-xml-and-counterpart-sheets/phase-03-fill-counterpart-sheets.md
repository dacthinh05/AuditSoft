# Phase 03: Tích Hợp Đổ Dữ Liệu Vào Sheet G 190.1 và G 190.2

## Mục tiêu
Điền đầy đủ số liệu và mã tham chiếu vào 2 sheet đối ứng của file `G100`, khử triệt để lỗi `#DIV/0!`.

## File tác động
- `src/domain/workingpaper/fillers/G100_RevenueFiller.ts`

## Chi tiết thực hiện
1. Điền Sheet `G 190.1` (Đợt 1):
   - Gọi `extractCounterpartStats` với `isPeriod1 = true` cho lần lượt `511`, `521`, `515`, `711`.
   - Điền Cột A, B, C cho vế Nợ; Cột E, F, G cho vế Có.
   - Điền dòng đánh giá kết luận (Rows 58-59).
2. Điền Sheet `G 190.2` (Cả năm):
   - Gọi `extractCounterpartStats` với `isPeriod1 = false` (cả năm).
   - Điền tương tự cho các khối dòng của `G 190.2`.
3. Kiểm tra các ô tổng cộng tự động tính toán, tỷ lệ % hiển thị chuẩn xác.
