---
title: "Phase 2: Ghép Cặp Bảng EBITDA Với Khối Đối Tượng Liên Quan & Pareto"
description: "Ghép cặp Bảng Bóc Tách EBITDA (7 dòng) với Khối Bên Liên Quan VSA 550 và Khách hàng trọng yếu để triệt tiêu khoảng trắng chết >500px."
status: completed
priority: P1
effort: "30m"
tags: [analytics, ebitda, pareto, related-parties]
---

# Phase 2: Ghép Cặp Bảng EBITDA Với Khối Đối Tượng Liên Quan & Pareto

## Mục Tiêu
Khắc phục triệt để khoảng trắng chết >500px ở Ảnh 1. Đưa Bảng EBITDA (chỉ có 7 dòng ~300px) ghép cặp với các nội dung có chiều cao tương đồng (~300-340px).

## Thiết Kế Kỹ Thuật
1. Trong `src/renderer/components/Analytics/GlAnalyticsTab.tsx`:
   - Tạo khu vực **"Tuân Thủ Thuế (NĐ 132/2020) & Rà Soát Bên Liên Quan (VSA 550)"**:
     ```tsx
     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
       {/* Card Trái: Bóc Tách Lãi Vay & EBITDA */}
       <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
         {/* Title + Pill cảnh báo B4 */}
         {/* Table 7 dòng */}
         {/* Note NĐ 132 */}
       </div>

       {/* Card Phải: Bên Liên Quan (VSA 550) & Cảnh Báo Trọng Yếu */}
       <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
         {/* Khối Giao Dịch Bên Liên Quan (VSA 550) - hiển thị danh sách các bên nghi ngờ */}
         {/* Tóm tắt cảnh báo rủi ro tập trung nguồn thu/chi */}
       </div>
     </div>
     ```
2. Khối **"Phân Tích Tập Trung Pareto (Khách Hàng & Nhà Cung Cấp)"**:
   - Đặt ngay sau khối EBITDA & Bên liên quan:
   - 2 Card song song: Top Khách Hàng (TK 511) và Top Nhà Cung Cấp (Mua hàng/CP).
   - Mỗi bảng có 5 dòng (Top 5) + thanh tích lũy + tỷ trọng %, chiều cao đồng đều ~300px.

## Files Thay Đổi
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`: Điều chỉnh vị trí của Panel EBITDA và kết nối với Panel Bên Liên Quan / Pareto.

## Tiêu Chí Nghiệm Thu
- [ ] Bảng EBITDA không còn bị kéo dài chiều cao vô lý; card chỉ cao đúng bằng nội dung (~320px).
- [ ] Khối bên phải chứa thông tin Bên Liên Quan (VSA 550) có chiều cao khớp tương đương, tạo sự cân đối thị giác hoàn hảo.
- [ ] Khối Pareto Top Khách Hàng và Nhà Cung Cấp đứng thành 1 hàng ngang đồng đều 50/50.
