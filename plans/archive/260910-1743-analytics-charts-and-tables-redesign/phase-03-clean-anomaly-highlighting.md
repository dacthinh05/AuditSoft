---
title: "Phase 3: Clean Anomaly Highlighting in 12M Trend Matrix (Image #4)"
description: "Sửa GlAnalyticsTab.tsx: loại bỏ màu nền vàng thẻ <td>, chỉ làm nổi bật con số đột biến, sửa câu chữ tooltip hiển thị đúng kỳ so sánh."
status: completed
priority: P1
effort: "0.4h"
tags: ["table-styling", "anomaly-cell", "tooltip-fix", "clean-ui"]
created: 2026-09-10
---

# Phase 3: Clean Anomaly Highlighting in 12M Trend Matrix (Image #4)

## Context & Objectives

1. **Khắc phục lỗi "hover cả vùng vàng" (Image #4):**
   - Hiện tại: Tại `GlAnalyticsTab.tsx:769`, khi `isAnomaly` là true, cả thẻ `<td>` được gán `background: #fffbeb`, và con số bên trong lại được bọc thêm một `<span>` có `background: #fef3c7`.
   - Kết quả: Khi bảng có 7-8 ô đột biến, toàn bộ mặt bảng loang lổ các mảng vàng rộng. Khi người dùng rê chuột qua, họ cảm giác như "bị hover cả một vùng vàng lớn".
   - Sửa đổi:
     - Xóa bỏ `background: #fffbeb` ở thẻ `<td>`. Giữ nền bảng trắng hoặc xám xen kẽ sạch sẽ (`#ffffff` / `#f8fafc`).
     - Tinh giản `<AnomalyCell>`: Chỉ hiển thị một chấm cam cảnh báo nhỏ bên cạnh con số hoặc viền cam nhẹ (`border-bottom: 2px dashed #f59e0b`), không tô nền vàng to choáng ngợp.
     - Khi rê chuột vào con số: Chỉ con số đó sáng lên kèm tooltip nổi tinh tế.

2. **Khắc phục câu chữ Tooltip so sánh bị nhầm lẫn tháng:**
   - Trong `Trend12MAnalyzer.ts:166`: Khi ở Tháng 05, tooltip cần hiển thị rõ:
     `Tháng 05: 285.4 tr (Tăng 68.4% so với Tháng 04: 179.8 tr) — rà soát chứng từ phát sinh lớn / cut-off.`
   - Tránh câu chữ cụt ngủn hoặc làm người dùng hiểu lầm là đang so sánh với chính tháng đó.

## Verification
- Kiểm tra bảng Ma trận Biến động 12 tháng:
  - Toàn bộ bảng trắng sạch sẽ, không còn các mảng vàng loang lổ.
  - Các ô có đột biến chỉ có chỉ báo nhẹ nhàng, hover vào ô nào thì tooltip của ô đó hiện ra đúng kỳ đối chiếu.
