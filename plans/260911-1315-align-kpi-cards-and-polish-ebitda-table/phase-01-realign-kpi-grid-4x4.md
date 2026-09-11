# Giai đoạn 1: Tái cấu trúc grid 4 cột đồng bộ cho 2 hàng thẻ KPI

## Nhiệm vụ
1. Cấu hình grid đồng nhất:
   - Thay `gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))'` ở Hàng 1 thành `gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'` (có breakpoint responsive phù hợp).
   - Thay `gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'` ở Hàng 2 (`Vsa520RatiosBar`) thành `gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'` tương ứng.
2. Sắp xếp lại nội dung 4 thẻ mỗi hàng:
   - **Hàng 1 (4 thẻ):**
     1. Chi phí lãi vay thuần (TK 635 - TK 515)
     2. EBITDA hoạt động KD (LNTT + Lãi vay + Khấu hao)
     3. Tỷ lệ Lãi vay / EBITDA (So với trần 30% NĐ 132)
     4. Nghi ngờ Bên liên quan (VSA 550)
   - **Hàng 2 (4 thẻ trong Vsa520RatiosBar):**
     1. Biên Lợi Nhuận Gộp (Chuẩn ≥ 15%)
     2. Khả Năng Trả Lãi - ICR (Chuẩn ≥ 1.5 lần)
     3. Tỷ Lệ OPEX / Doanh Thu (Chuẩn ≤ 10% - 12%)
     4. Tập Trung Nguồn Thu (Hiển thị Top 1: {x}% DT, phụ đề Top 5: {y}% DT để thống nhất trọn vẹn thông tin Pareto không bị phân tán).
3. Đảm bảo styling chiều cao, padding, border của 2 hàng thẻ đồng điệu (consistent height & visual rhythm).

## File chỉnh sửa
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`
- `src/renderer/components/Analytics/Vsa520RatiosBar.tsx`
