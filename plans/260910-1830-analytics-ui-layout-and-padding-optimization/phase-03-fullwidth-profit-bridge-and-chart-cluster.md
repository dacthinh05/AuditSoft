---
title: "Phase 3: Bảng Cầu Nối Lợi Nhuận Full-Width & Cụm 3 Chart SVG"
description: "Tách Bảng Cầu Nối Lợi Nhuận thành khối Full-Width để thanh trực quan co giãn thoáng đãng; gom 3 biểu đồ SVG vào cụm Dashboard đồng bộ."
status: completed
priority: P1
effort: "35m"
tags: [analytics, waterfall, charts, svg, dashboard]
---

# Phase 3: Bảng Cầu Nối Lợi Nhuận Full-Width & Cụm 3 Chart SVG

## Mục Tiêu
Khắc phục hiện tượng ở Ảnh 2: Bảng Cầu Nối Lợi Nhuận 7 cột bị bó hẹp trong 50% màn hình, đứng cạnh 1 biểu đồ SVG có 2 khối callout dày cộm gây lệch tỷ lệ.

## Thiết Kế Kỹ Thuật
1. **Bảng Cầu Nối Dòng Chảy Lợi Nhuận (Profit Bridge Waterfall):**
   - Đưa ra làm một Card riêng **Full-Width (100% width)**.
   - Tại `ProfitWaterfallChart.tsx`:
     - Cột `#`: 40px, căn giữa.
     - Cột `Khoản Mục Dòng Chảy`: 220px, font rõ nét, phân cấp rõ dòng Kết quả chốt / Khởi điểm / Trung gian.
     - Cột `Phân Loại`: 120px, badge nhỏ gọn.
     - Cột `Số Phát Sinh`: 150px, monospace căn phải.
     - Cột `Thanh Tác Động Trực Quan`: co giãn linh hoạt (`flex: 1` hoặc `minWidth: 260px`), thanh mini-bar hiển thị trực quan rõ nét độ lớn của chi phí.
     - Cột `Lũy Kế Sau Bước`: 150px, monospace căn phải.
     - Cột `% Doanh Thu`: 90px, căn phải có badge % nhẹ nhàng.

2. **Cụm 3 Biểu Đồ SVG Tương Quan 12 Tháng:**
   - Xếp thành một Grid đồng bộ:
     ```tsx
     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
       <RevenueCogsComboChart report={correlations.grossMargin} />
       <CogsStructureStackedChart report={correlations.cogsStructure} />
       <OpexRatioAreaChart report={correlations.opexRatios} />
     </div>
     ```
   - Cả 3 biểu đồ đều là thuần SVG đồ họa, cùng chiều cao chuẩn ~320px, tạo nên một hàng Dashboard tài chính chuyên nghiệp.

3. **Thu Gọn Callout Vàng Tại `RevenueCogsComboChart.tsx`:**
   - Thay vì 2 khối `div` màu vàng dày cộp xếp chồng ở đáy chart (chiếm ~80px chiều dọc):
   - Chuyển thành một thanh cảnh báo gọn gàng 1 dòng tích hợp, hoặc micro-alert có icon info nhỏ:
     ```tsx
     {(hasOutlier || report.auditWarning) && (
       <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
         {hasOutlier && (
           <span style={{ fontSize: '11px', background: '#fef9c3', border: '1px solid #fde047', color: '#854d0e', padding: '3px 8px', borderRadius: '4px' }}>
             ℹ️ Trục biên neo [-100%, +100%] (T12: {minRawPct.toFixed(1)}%)
           </span>
         )}
         {report.auditWarning && (
           <span style={{ fontSize: '11px', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '3px 8px', borderRadius: '4px' }}>
             ⚠️ {report.auditWarning}
           </span>
         )}
       </div>
     )}
     ```
   - Giúp chiều cao của `RevenueCogsComboChart` vừa khít và đồng bộ với 2 biểu đồ còn lại.

## Files Thay Đổi
- `src/renderer/components/Analytics/charts/ProfitWaterfallChart.tsx`: Tối ưu bảng cầu nối lợi nhuận cho layout Full-Width.
- `src/renderer/components/Analytics/charts/RevenueCogsComboChart.tsx`: Thu gọn callout ở chân biểu đồ.
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`: Tách Waterfall ra full-width và gom 3 biểu đồ SVG vào 1 grid đồng dạng.

## Tiêu Chí Nghiệm Thu
- [ ] Bảng Cầu Nối Lợi Nhuận rộng rãi, thanh mini-bar hiển thị trực quan rõ ràng, không bị chèn ép.
- [ ] 3 biểu đồ SVG đứng cạnh nhau đều đặn, không có biểu đồ nào bị phình chiều cao bất thường.
- [ ] Không còn khối callout vàng thô kệch ở đáy Combo Chart.
