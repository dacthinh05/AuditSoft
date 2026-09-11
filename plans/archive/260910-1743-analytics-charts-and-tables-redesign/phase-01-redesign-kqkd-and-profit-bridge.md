---
title: "Phase 1: Redesign KQKD YoY & Visual Profit Bridge (Image #1 & #2)"
description: "Sửa KqkdYoYChart.tsx hỗ trợ trục 0 đối xứng cho số âm, chuyển ProfitWaterfallChart.tsx thành Bảng Cầu Nối Lợi Nhuận trực quan với mini-bar ngang, khóa cận thang đo RevenueCogsComboChart.tsx."
status: completed
priority: P1
effort: "0.5h"
tags: ["kqkd-chart", "waterfall-bridge", "combo-chart", "visual-redesign"]
created: 2026-09-10
---

# Phase 1: Redesign KQKD YoY & Visual Profit Bridge (Image #1 & #2)

## Context & Objectives

1. **`KqkdYoYChart.tsx`:**
   - Hiện tại: `Math.max(0, v)` làm triệt tiêu các cột âm (Lợi nhuận gộp -6.2B, LN HĐKD -36.8B) thành 0.
   - Sửa đổi: Tính toán trục `yZero` dựa trên `minVal` và `maxVal`.
     - Giá trị dương ($v > 0$): Cột vươn lên trên trục 0 (Màu xanh dương `#0284c7` cho Năm nay, xám `#cbd5e1` cho Năm trước).
     - Giá trị âm ($v < 0$): Cột chúc xuống dưới trục 0 (Màu đỏ cam `#ef4444` cho Năm nay, đỏ nhạt `#fca5a5` cho Năm trước).
     - Đường chuẩn số 0 (`stroke="#94a3b8" strokeDasharray="3 3"`) phân định ranh giới rõ ràng.

2. **`ProfitWaterfallChart.tsx`:**
   - Hiện tại: Waterfall dạng cột đứng bị nén bẹp các bước 60 tr – 4 tỷ sát đáy 0px vì cột Doanh thu quá cao (75 tỷ).
   - Sửa đổi: Chuyển sang **Bảng Cầu Nối Lợi Nhuận Trực Quan (Visual Profit Bridge Table)**:
     - Dạng bảng thẻ tinh tế gồm 8 bước: Doanh thu thuần $\rightarrow$ Giá vốn $\rightarrow$ LN gộp $\rightarrow$ Doanh thu TC $\rightarrow$ Chi phí TC $\rightarrow$ CPBH $\rightarrow$ CPQLDN $\rightarrow$ LNTT.
     - Mỗi bước có:
       - Tên khoản mục & badge loại (`KHỞI ĐIỂM`, `GIẢM TRỪ`, `BỔ SUNG`, `KẾT QUẢ`).
       - Số tiền phát sinh (màu đỏ/xanh tương ứng).
       - Thanh **Mini-bar trực quan** thể hiện tỷ trọng so với Doanh thu thuần.
       - Số tiền lũy kế sau bước này.
       - Tỷ lệ % trên Doanh thu thuần.

3. **`RevenueCogsComboChart.tsx`:**
   - Khóa thang đo biên lợi nhuận: Giới hạn hiển thị trong dải `[-100%, +100%]`. Khi T12 nhảy xuống -1162%, đường biểu diễn chạm ngưỡng đáy -100% kèm nhãn cảnh báo đỏ `🔴 T12: -1162% (Dồn giá vốn)` thay vì kéo toàn bộ đồ thị sập xuống đáy.

## Verification
- Kiểm tra màn hình phân tích KQKD: Các cột số âm hiển thị rõ ràng bên dưới trục 0.
- Bảng Cầu Nối Lợi Nhuận: Hiển thị đầy đủ 8 bước, đọc rõ từ con số 60 triệu đến 75 tỷ.
