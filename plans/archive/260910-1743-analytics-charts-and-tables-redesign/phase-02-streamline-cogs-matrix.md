---
title: "Phase 2: Streamline 12M COGS Cost Matrix (Image #3)"
description: "Sửa CogsMatrix12MTable.tsx: thay 11 khối text cảnh báo lặp lại bằng Micro Badge tinh gọn kèm tooltip, ẩn triệt để các cột cả năm bằng 0."
status: completed
priority: P1
effort: "0.4h"
tags: ["cogs-matrix", "table-refactor", "ui-cleanup", "micro-badges"]
created: 2026-09-10
---

# Phase 2: Streamline 12M COGS Cost Matrix (Image #3)

## Context & Objectives

1. **Khắc phục lặp lại văn bản cảnh báo 11 lần:**
   - Hiện tại: Tại cột "Cảnh báo VSA 520", các tháng T02 $\rightarrow$ T12 đều render một khối card màu cam 2 dòng: `🟠 Treo chi phí dở dang: Có phát sinh chi phí SX & doanh thu nhưng không ghi nhận giá vốn.`
   - Sửa đổi: Chuyển sang **Micro Badge siêu gọn**:
     - Khi có cảnh báo dồn/treo giá vốn: Hiển thị viên thuốc nhỏ gọn `🟠 Treo CPSX (Chưa ghi 632)` hoặc `🔴 Dồn giá vốn T12`.
     - Khi bình thường: `✓ Khớp`.
     - Rê chuột (hover) vào viên thuốc sẽ bung tooltip chi tiết giải thích nghiệp vụ.
     - Giữ nguyên khối cảnh báo vĩ mô ở dưới chân bảng (`⚠️ Phát hiện trọng yếu từ Ma trận Giá vốn: ...`) để KTV nắm bắt tổng quan.

2. **Ẩn triệt để cột rỗng cả năm:**
   - Trong hàm `colActivity`: Kiểm tra tổng tiền cả năm của từng cột.
   - Nếu `directMaterials621 === 0n` ở tất cả 12 tháng, khi bật `hideEmpty = true`, cột NVL (621) phải hoàn toàn biến mất khỏi bảng (không hiển thị các dấu gạch `-` thừa thãi).
   - Tương tự cho các cột Dở dang (154), Mua 156, Khác...

## Verification
- Kiểm tra bảng Ma trận Giá vốn 12 tháng:
  - Cột cảnh báo chỉ hiển thị các chip nhỏ gọn, không còn 11 khối text dài.
  - Bật/tắt nút "Ẩn cột rỗng": Các cột không phát sinh cả năm được ẩn sạch sẽ, bảng thu gọn vừa vặn màn hình.
