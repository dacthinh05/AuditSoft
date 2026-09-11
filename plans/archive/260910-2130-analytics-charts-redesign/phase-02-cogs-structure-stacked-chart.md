# Phase 2: Nâng Cấp CogsStructureStackedChart (Cơ Cấu Chi Phí Giá Vốn)

## Mục tiêu
Khắc phục tình trạng biểu đồ phẳng lì (flat chart) do cố định 100% Stacked Bar, cung cấp góc nhìn về cả quy mô chi phí thực tế (VNĐ) lẫn tỷ trọng chi phí (%).

## Nhiệm vụ cụ thể
1. **Thêm nút gạt View Mode (Toggle: Giá trị thực VNĐ vs Tỷ trọng %):**
   - Chế độ mặc định: **Giá trị thực (VNĐ/Tỷ đồng)** dạng Stacked Bar. Giúp người dùng nhìn rõ tháng nào phát sinh chi phí sản xuất/giá vốn cao vọt (như T2, T8).
   - Chế độ phụ: **Tỷ trọng (%) 100% Stacked Bar** để soi biến động cấu trúc nếu cần.
2. **Cải tiến màu sắc & độ tương phản:**
   - Điều chỉnh tone màu của 4 thành phần: NVL 621 (Emerald), Nhân công 622 (Blue), SXC 627 (Amber), Dở dang/Mua ngoài 154/156 (Indigo) để không bị 1 màu tím áp đảo hoàn toàn.
3. **Thêm đường hoặc nhãn đánh dấu tháng đỉnh chi phí:**
   - Tháng có tổng chi phí cao nhất năm có badge hoặc viền highlight tinh tế.
4. **Cải thiện tooltip & tương tác:**
   - Hiển thị song song cả số tiền tuyệt đối và % cấu phần khi rê chuột qua bất kỳ cột nào.

## File liên quan
- `src/renderer/components/Analytics/charts/CogsStructureStackedChart.tsx`
