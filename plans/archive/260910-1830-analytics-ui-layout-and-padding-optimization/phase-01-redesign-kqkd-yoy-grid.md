---
title: "Phase 1: Tái Cấu Trúc Khối Kết Quả Kinh Doanh B02 và Biểu Đồ YoY Ngang Hàng"
description: "Tách Bảng KQKD B02 và Biểu đồ KqkdYoYChart ra khỏi 1 card đơn lẻ thành cặp 2 card ngang hàng trong grid 55% - 45% cân xứng chiều cao."
status: completed
priority: P1
effort: "35m"
tags: [analytics, kqkd, yoy-chart, layout]
---

# Phase 1: Tái Cấu Trúc Khối Kết Quả Kinh Doanh B02 và Biểu Đồ YoY Ngang Hàng

## Mục Tiêu
Khắc phục hiện tượng Bảng KQKD 6 cột bị dồn ép vào 1 card cùng với biểu đồ SVG bên dưới, làm card cao tới 850px và khiến bảng B02 bị chật chội.

## Thiết Kế Kỹ Thuật
1. Trong `src/renderer/components/Analytics/GlAnalyticsTab.tsx`:
   - Tạo khu vực **"Kết Quả Kinh Doanh — Báo Cáo Tài Chính (Số B02)"** độc lập, đặt ngay dưới 5 KPI Cards.
   - Sử dụng layout Grid:
     ```tsx
     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '16px', alignItems: 'stretch' }}>
       {/* Card Trái (55%): Bảng B02 chi tiết */}
       <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
         ...
       </div>

       {/* Card Phải (45%): Biểu đồ KqkdYoYChart trực quan */}
       <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
         ...
       </div>
     </div>
     ```
2. Căn chỉnh `KqkdYoYChart.tsx`:
   - Tháo bỏ `marginTop: '14px'` và thẻ bọc thừa (nếu có), để component lấp đầy chiều cao của Card bên phải một cách tự nhiên.
   - Điều chỉnh chiều cao khung SVG (`H = 280` hoặc tỷ lệ phù hợp) để khớp với chiều cao 12 dòng của bảng B02 (~420px).
   - Card bên phải có tiêu đề rõ ràng: *"So Sánh Biến Động Các Chỉ Tiêu Trọng Yếu (YoY)"* kèm legend và trục 0 phân định lãi/lỗ.

## Files Thay Đổi
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`: Tách JSX khối KQKD và KqkdYoYChart thành 2 card riêng biệt trong grid 2 cột.
- `src/renderer/components/Analytics/charts/KqkdYoYChart.tsx`: Bỏ padding/margin bao bọc bên ngoài để tích hợp liền mạch vào card chuyên dụng.

## Tiêu Chí Nghiệm Thu
- [ ] Bảng B02 có độ rộng thoải mái (55% màn hình), 6 cột hiển thị thẳng thớm không bị xô lệch.
- [ ] Biểu đồ YoY Chart nằm ngay bên cạnh (45% màn hình), chiều cao vừa vặn với bảng B02.
- [ ] Hai card cùng hàng bằng chiều cao, không có khoảng trống trắng thừa ở đáy của card nào.
