---
title: "Phase 2: Bổ Sung Thanh Tỷ Số Tài Chính Kiểm Toán VSA 520"
description: "Xây dựng thanh 4 tỷ số tài chính chuẩn mực VSA 520 (Biên lãi gộp, Khả năng trả lãi ICR, Tỷ lệ OPEX, Tập trung nguồn thu) kèm ngưỡng an toàn kiểm toán."
status: completed
priority: P1
effort: "30m"
tags: [analytics, financial-ratios, vsa520, kpi-bar]
---

# Phase 2: Bổ Sung Thanh Tỷ Số Tài Chính Kiểm Toán VSA 520

## Mục Tiêu
Cung cấp cho KTV một "Bảng đồng hồ đo sức khỏe tài chính" gồm 4 tỷ số tài chính then chốt theo chuẩn mực VSA 520, có so sánh trực tiếp với ngưỡng kiểm toán ngành để KTV đánh giá tức thì.

## Thiết Kế Kỹ Thuật

### 1. Bộ 4 Tỷ Số Tài Chính Then Chốt
1. **Biên Lợi Nhuận Gộp (Gross Profit Margin %):**
   - Công thức: `(Lợi nhuận gộp / Doanh thu thuần) * 100`
   - Ngưỡng an toàn: $\ge 15\%$. Dưới 0%: Báo động đỏ (Kinh doanh dưới giá vốn).
2. **Hệ Số Khả Năng Trả Lãi Vay (Interest Coverage Ratio - ICR):**
   - Công thức: `EBIT / Chi phí lãi vay phát sinh (TK 635)`
   - Ngưỡng an toàn: $\ge 1.5$ lần. Dưới 1.0 lần hoặc Âm: Báo động đỏ (Dòng tiền kinh doanh không đủ trả nợ vay).
3. **Tỷ Lệ Chi Phí Hoạt Động (OPEX / Doanh Thu Thuần %):**
   - Công thức: `((Chi phí bán hàng 641 + Chi phí QLDN 642) / Doanh thu thuần) * 100`
   - Ngưỡng chuẩn: $\le 10\% - 12\%$. Tăng vọt so với năm trước: Cảnh báo chi phí hoạt động kém hiệu quả.
4. **Mức Độ Tập Trung Nguồn Thu (Pareto Top 1 Khách Hàng %):**
   - Công thức: `pareto.customerConcentrationRatio1`
   - Ngưỡng an toàn: $\le 30\%$. Trên 30%: Rủi ro phụ thuộc vào một khách hàng duy nhất (VSA 315).

### 2. Giao Diện Hiển Thị (UI/UX)
- Thiết kế thanh ngang gọn gàng gồm 4 thẻ chỉ số với:
  - Tên chỉ số & Công thức vắn tắt.
  - Con số thực tế to, đậm kèm màu sắc cảnh báo:
    * 🟢 Xanh lá: Nằm trong ngưỡng an toàn.
    * 🟡 Vàng cam: Vượt ngưỡng cảnh báo nhẹ.
    * 🔴 Đỏ: Vượt ngưỡng nguy cơ cao / Âm.
  - Dòng nhận định kiểm toán 1 dòng súc tích bên dưới.

## Files Thay Đổi
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx` hoặc tạo component con `Vsa520RatiosBar.tsx`.

## Tiêu Chí Nghiệm Thu
- [ ] Tính toán đúng 4 tỷ số tài chính từ dữ liệu `GlAnalyticsResult`.
- [ ] Hiển thị màu sắc cảnh báo chuẩn xác theo từng ngưỡng giá trị.
