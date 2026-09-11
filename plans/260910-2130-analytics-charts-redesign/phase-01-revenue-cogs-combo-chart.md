# Phase 1: Tối ưu RevenueCogsComboChart (Doanh thu, Giá vốn & Biên lãi)

## Mục tiêu
Loại bỏ sự rối mắt của Dual-Axis và làm nổi bật ngay lập tức các tháng có biên lãi gộp âm hoặc bất thường trực tiếp trên đồ thị.

## Nhiệm vụ cụ thể
1. **Đường tham chiếu Baseline 0% rõ ràng:**
   - Vẽ một đường nét đứt màu đỏ nhạt (`#fca5a5`) tại mức 0% của trục Biên lãi gộp kèm nhãn `0%` để phân định rõ vùng lãi dương và vùng âm.
2. **Trực quan hóa điểm cảnh báo âm (Visual Alert Points):**
   - Với các tháng có `grossMarginPct < 0`:
     - Điểm nút tròn (circle) chuyển sang màu đỏ rực (`#ef4444`) với hiệu ứng vòng tròn phát sáng (ping/halo).
     - Hiển thị nhãn số liệu nhỏ trực tiếp trên đầu điểm: ví dụ `-X%` màu đỏ để kiểm toán viên nhận biết ngay tháng gãy mà không cần rê chuột.
3. **Cải thiện tỷ lệ khoảng cách các cột (Bar Spacing):**
   - Điều chỉnh độ rộng cột (`BAR_WIDTH`) và khoảng cách giữa cột Doanh thu (511) và Giá vốn (632) để cột trông thanh thoát, không dính chùm vào nhau.
4. **Cập nhật Legend & Header:**
   - Đưa chỉ báo cảnh báo tháng âm lên ngay cạnh tiêu đề hoặc trong legend thay vì chỉ nằm ở alert box cuối card.

## File liên quan
- `src/renderer/components/Analytics/charts/RevenueCogsComboChart.tsx`
