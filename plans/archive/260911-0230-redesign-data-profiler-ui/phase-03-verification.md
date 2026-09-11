# Phase 03: Kiểm thử & Đánh giá hiển thị trực quan (Verification)

## Mục tiêu
Đảm bảo mã nguồn biên dịch thành công, không phát sinh lỗi kiểu (TypeScript), và kiểm tra tính nhất quán trực quan của toàn bộ thanh Profiler.

## File kiểm tra
- Toàn bộ component trong `src/renderer/components/DataProfiler/`
- `src/renderer/styles.css`

## Các bước kiểm tra
1. Chạy TypeScript type-checking:
   - Chạy lệnh kiểm tra type compiler để đảm bảo không lỗi interface hay props.
2. Kiểm tra tương tác lọc:
   - Click chọn thẻ phân tầng -> kiểm tra bảng lọc theo tier.
   - Click chọn tháng T09, T12 -> kiểm tra bảng lọc theo tháng.
   - Click chọn cột 31/12 hoặc pill cảnh báo Cutoff -> kiểm tra bảng lọc đúng bút toán 31/12.
   - Click nút "✕ Xóa lọc" -> xóa trạng thái lọc thành công.
3. Kiểm tra responsive & hiển thị:
   - Đảm bảo độ rộng của 2 cột Profiler cân đối, chữ số không bị tràn hoặc che khuất.
