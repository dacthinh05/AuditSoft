---
slug: align-kpi-cards-and-polish-ebitda-table
title: Đồng bộ lưới 4x4 KPI Cards và Làm nét bảng Bóc tách EBITDA NĐ 132
status: planned
created: 2026-09-11
mode: fast
---

# Kế Hoạch: Đồng bộ lưới 4x4 KPI Cards & Tinh chỉnh Bảng Bóc Tách EBITDA

## Mục tiêu (Outcome)
1. **Khắc phục tình trạng lệch mép giữa 2 hàng thẻ KPI (Ảnh #2):**
   - Chuyển cấu trúc từ (5 card hàng trên + 4 card hàng dưới) thành hệ thống lưới đồng bộ **2 hàng × 4 cột** (`gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'`).
   - Cột dọc của hàng trên và hàng dưới thẳng hàng 100%, chấm dứt hiện tượng thẻ co giãn vênh lệch.
   - Hàng 1 (NĐ 132 & Giao dịch đặc thù): *Chi phí lãi vay thuần | EBITDA HĐKD | Tỷ lệ Lãi vay/EBITDA | Bên liên quan*.
   - Hàng 2 (Chỉ số kiểm toán VSA 520): *Biên Lợi Nhuận Gộp | Khả năng trả lãi (ICR) | Tỷ lệ OPEX/Doanh thu | Mức độ tập trung khách hàng (Top 1 & Top 5 gộp súc tích)*.
2. **Làm rõ nét, dễ đọc bảng Bóc Tách Lãi Vay & EBITDA (Ảnh #1):**
   - Font số tài chính chuyên dụng với `tabular-nums`, màu sắc tương phản cao, số rõ ràng đậm nét (`font-weight: 600-700`).
   - Cố định tỷ lệ độ rộng cột (Khoản Mục: 45%, Căn Cứ: 25%, Số Tiền: 30%) để không bị ép chữ.
   - Khoảng đệm (padding) thoáng đãng, phân tách rõ ràng dòng tổng kết EBITDA và mức trần lãi vay.

## Phạm vi tác động
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx` (Grid KPI và Bảng EBITDA)
- `src/renderer/components/Analytics/Vsa520RatiosBar.tsx` (Đồng bộ tỷ lệ grid và nội dung thẻ Top khách hàng)

## Các giai đoạn thực hiện
- [phase-01-realign-kpi-grid-4x4.md](./phase-01-realign-kpi-grid-4x4.md) - Tái cấu trúc grid 4 cột đồng bộ cho cả 2 hàng thẻ KPI.
- [phase-02-polish-ebitda-table.md](./phase-02-polish-ebitda-table.md) - Căn chỉnh typography, tabular-nums, layout độ rộng cột cho bảng EBITDA.
- [phase-03-verification.md](./phase-03-verification.md) - Kiểm tra typecheck và đối soát giao diện trực quan.
