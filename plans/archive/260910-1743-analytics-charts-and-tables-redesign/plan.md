---
title: "Tối Ưu Toàn Diện Biểu Đồ & Bảng Phân Tích Tài Chính (KQKD, Waterfall, Ma Trận Giá Vốn & 12M Matrix)"
description: "Khắc phục triệt để lỗi ép số âm về 0 trên chart KQKD, chuyển Waterfall sang dạng Bảng Cầu Nối Lợi Nhuận trực quan, tinh giản cảnh báo Ma trận Giá vốn và xóa bỏ lỗi ố vàng khi hover bảng 12 tháng."
status: completed
priority: P1
effort: "1.5h"
tags: ["analytics", "charts", "waterfall", "cogs-matrix", "12m-trend", "ui-ux-refactor"]
created: 2026-09-10
---

# Tối Ưu Toàn Diện Biểu Đồ & Bảng Phân Tích Tài Chính (KQKD, Waterfall, Ma Trận Giá Vốn & 12M Matrix)

## Overview

Sau khi đưa phân hệ Phân Tích Sổ NKC (#05) vào thực tế kiểm toán, người dùng phản ánh 4 điểm nghẽn nghiêm trọng về hiển thị thị giác (Visual & UX):
1. **Chart phân tích KQKD dưới bảng B02 chưa ổn (Image #1):** Cột Doanh thu (73B) quá lớn làm bẹp các chi phí (4B); các chỉ tiêu lợi nhuận âm (LN gộp -6.2B, LN HĐKD -36.8B) bị hàm `Math.max(0, v)` ép phẳng về 0 (không có cột).
2. **"Cầu Nối Dòng Chảy Lợi Nhuận (Waterfall)" và 4 chart khó xem (Image #2):**
   - Thang đo 75 tỷ làm cho các bước chi phí 60 triệu – 4 tỷ bị co rúm thành lát mỏng 0.3 pixel dưới đáy, không đọc được số liệu.
   - Biểu đồ Doanh thu - Giá vốn 12M bị tháng 12 dồn 75 tỷ giá vốn làm biên lợi nhuận tụt xuống -1162%, phá vỡ toàn bộ tỷ lệ trục Y.
3. **Bảng Ma trận Giá vốn bị dài và lặp text (Image #3):** Cột cảnh báo VSA 520 lặp lại cả đoạn văn 2 dòng ở 11 tháng liên tiếp (`Treo chi phí dở dang...`), làm bảng rất dài và choáng ngợp; các cột bằng 0 cả năm vẫn chưa được ẩn triệt để.
4. **Bảng Biến động 12M hover bị vàng cả vùng (Image #4):** Tô màu vàng lên toàn bộ thẻ `<td>` và số tiền khiến nửa bảng bị loang màu vàng ố; câu chữ tooltip so sánh bị nhầm lẫn tháng.

Kế hoạch này giải quyết dứt điểm cả 4 vấn đề:
- Chart KQKD: Chuyển sang biểu đồ có trục 0 cân bằng, cột âm đi xuống rõ ràng (màu đỏ).
- Waterfall: Chuyển sang **Bảng Cầu Nối Lợi Nhuận Trực Quan (Visual Profit Bridge Table)** với thanh mini-bar ngang, đọc rõ từ 60 triệu đến 75 tỷ.
- Combo Chart 12M: Khóa biên độ biên lãi gộp [-100%, +100%] tránh vỡ thang đo.
- Ma trận Giá vốn: Dùng **Micro Badge tinh gọn** (`🟠 Treo CPSX`, `✓ Khớp`), ẩn triệt để cột 0 cả năm.
- Ma trận 12M: Bỏ màu nền `<td>`, chỉ chấm cam nhẹ số tiền đột biến, tooltip chỉ rõ kỳ so sánh.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Sửa `KqkdYoYChart.tsx`: Hiển thị chuẩn xác số âm với trục 0 rõ ràng (cột đỏ đi xuống), cân bằng thị giác | P1 |
| 2 | Sửa `ProfitWaterfallChart.tsx`: Chuyển sang Bảng Cầu Nối Lợi Nhuận Trực Quan có thanh mini-bar ngang | P1 |
| 3 | Sửa `RevenueCogsComboChart.tsx`: Khóa cận thang đo biên lãi gộp [-100%, +100%] kèm cờ ghi chú T12 | P1 |
| 4 | Sửa `CogsMatrix12MTable.tsx`: Thay 11 dòng cảnh báo dài bằng Micro Badge nhỏ gọn, ẩn triệt để cột rỗng cả năm | P1 |
| 5 | Sửa `GlAnalyticsTab.tsx`: Bỏ màu vàng thẻ `<td>`, chỉ làm nổi bật con số, sửa tooltip so sánh đúng tháng | P1 |
| 6 | Đảm bảo 100% typecheck (0 lỗi), 290+ tests pass, đóng gói production thành công | P1 |

## Phases

| # | Phase | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| 1 | [Phase 1: Redesign KQKD YoY & Visual Profit Bridge (Image #1 & #2)](./phase-01-redesign-kqkd-and-profit-bridge.md) | Completed | P1 | 0.5h |
| 2 | [Phase 2: Streamline 12M COGS Cost Matrix (Image #3)](./phase-02-streamline-cogs-matrix.md) | Completed | P1 | 0.4h |
| 3 | [Phase 3: Clean Anomaly Highlighting in 12M Trend Matrix (Image #4)](./phase-03-clean-anomaly-highlighting.md) | Completed | P1 | 0.4h |
| 4 | [Phase 4: Full Verification & Regression Testing](./phase-04-verification-and-regression.md) | Completed | P1 | 0.2h |

## Acceptance Criteria

- [x] Chart KQKD B02: Hiển thị đầy đủ cột dương (xanh) và cột âm (đỏ) qua đường trục 0, không bị ép về 0.
- [x] Bảng Cầu Nối Lợi Nhuận: Hiển thị mạch lạc 8 bước từ Doanh thu thuần về LNTT, có thanh mini-bar ngang thể hiện mức độ tác động, số tiền hiển thị chuẩn xác cả khoản 60 triệu lẫn 75 tỷ.
- [x] Biểu đồ Doanh thu - Giá vốn 12M: Đường biên lãi gộp không rơi thủng sàn, trục Y cân đối.
- [x] Bảng Ma trận Giá vốn: Không còn 11 khối văn bản cam lặp lại; các cột rỗng cả năm (như 621, 154) được ẩn sạch khi bật nút ẩn cột rỗng.
- [x] Bảng Biến động 12M: Không còn hiện tượng loang màu vàng cả thẻ `<td>`, chỉ có chấm cam cảnh báo số tiền đột biến, tooltip hiển thị rõ kỳ và số tiền so sánh.
- [x] `npm run typecheck` đạt 0 lỗi, toàn bộ test suite vượt qua 100%, `npm run build` thành công.
