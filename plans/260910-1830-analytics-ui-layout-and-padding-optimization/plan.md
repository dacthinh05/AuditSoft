---
title: "Tối Ưu Bố Cục & Phân Bổ Không Gian UI Phân Hệ Phân Tích Sổ NKC (#05)"
description: "Khắc phục triệt để khoảng trắng chết >500px dưới bảng EBITDA, tách khối KQKD B02 và Chart YoY thành 2 cột ngang hàng cân xứng, đưa Bảng Cầu Nối Lợi Nhuận lên Full-Width và đồng bộ cụm đồ thị tương quan 12 tháng."
status: completed
priority: P1
effort: "2h"
branch: main
tags: [analytics, ui-ux, layout-refactor, grid-optimization, vsa520]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Tối Ưu Bố Cục & Phân Bổ Không Gian UI Phân Hệ Phân Tích Sổ NKC (#05)

## Overview

Sau khi đưa phân hệ Phân Tích Sổ NKC (#05) vào kiểm thử thực tế trên tập dữ liệu kiểm toán lớn, giao diện bộc lộ 2 điểm nghẽn nghiêm trọng về phân bổ bố cục thị giác (Visual & Space Distribution):
1. **Khoảng trắng chết khổng lồ (> 500px) dưới Bảng EBITDA (Image #1):**
   - Card bên trái (*Bóc Tách Lãi Vay & EBITDA*) chỉ có 7 dòng + ghi chú (~300px), nhưng bị lưới `gridTemplateColumns: '1fr 1fr'` kéo giãn theo Card bên phải (*KQKD B02*) vốn đang nhét cả bảng 12 dòng lẫn biểu đồ `KqkdYoYChart` (~850px).
   - Hậu quả: Card bên trái có hơn 500px khoảng trống trắng trơn vô nghĩa, trong khi bảng B02 bên phải bị bóp nghẹt 6 cột vào 50% chiều ngang màn hình.
2. **Mất cân đối tỷ lệ giữa Chart SVG và Bảng Cầu Nối Lợi Nhuận (Image #2):**
   - Lưới 2x2 gượng ép ghép `RevenueCogsComboChart` (Đồ họa SVG + 2 khối callout dày) đứng cạnh `ProfitWaterfallChart` (thực chất là một Bảng Dữ Liệu 7 cột chi tiết).
   - Hậu quả: Bảng Cầu Nối bị thiếu bề ngang để hiển thị các thanh trực quan, trong khi biểu đồ Combo Chart bị phình chiều dọc do 2 khối ghi chú vàng ở đáy.

Kế hoạch này tái cơ cấu toàn diện bố cục trang theo **Phương Án 2 (Smart Single-Page Grid)**:
- **Hàng 1 (KQKD Tổng Thể):** Tách Bảng B02 (55% width) và Biểu đồ `KqkdYoYChart` (45% width) thành 2 Card độc lập ngang hàng, tự động cân bằng chiều cao ~420px.
- **Hàng 2 (Tuân Thủ & Rủi Ro):** Ghép cặp Bảng EBITDA (7 dòng) với Khối Bên Liên Quan (VSA 550) / Pareto Khách hàng (cùng độ cao ~320px), xóa sạch 100% khoảng trắng chết.
- **Hàng 3 (Dòng Chảy Lợi Nhuận):** Đưa Bảng Cầu Nối Lợi Nhuận lên dạng Full-Width độc lập, thanh tác động trực quan bung rộng thoáng đãng.
- **Hàng 4 (Bộ 3 Đồ Thị 12 Tháng):** Gom 3 biểu đồ SVG vào cụm Dashboard trực quan đồng bộ, tinh giản khối callout vàng thành micro-alert gọn gàng.
- **Rà soát toàn diện Padding/Gap:** Chuẩn hóa gap (`16px`) và card padding (`16px 20px`), đảm bảo responsive 100% trên màn hình laptop kế toán (từ 1366x768 đến 1920x1080).

---

## Goals

| # | Goal | Priority | Effort |
|---|------|----------|--------|
| 1 | Tách Bảng KQKD B02 và Biểu đồ YoY thành 2 cột ngang hàng cân xứng (55% - 45%), chiều cao ~420px | P1 | 35m |
| 2 | Ghép cặp Bảng EBITDA NĐ 132 với Khối Bên Liên Quan VSA 550 & Pareto, triệt tiêu khoảng trắng thừa | P1 | 30m |
| 3 | Chuyển Bảng Cầu Nối Lợi Nhuận sang Full-Width và cụm 3 biểu đồ SVG thành grid đồng nhất | P1 | 35m |
| 4 | Rà soát toàn bộ Padding/Margin, kiểm thử hồi quy và đạt 100% typecheck | P1 | 20m |

---

| 1 | [Phase 1: Tái Cấu Trúc Khối KQKD B02 & Biểu Đồ YoY](./phase-01-redesign-kqkd-yoy-grid.md) | Completed | P1 | 35m |
| 2 | [Phase 2: Ghép Cặp Bảng EBITDA & Khối Đối Tượng Liên Quan](./phase-02-pair-ebitda-with-related-pareto.md) | Completed | P1 | 30m |
| 3 | [Phase 3: Bảng Cầu Nối Lợi Nhuận Full-Width & Cụm 3 Chart SVG](./phase-03-fullwidth-profit-bridge-and-chart-cluster.md) | Completed | P1 | 35m |
| 4 | [Phase 4: Rà Soát Padding Toàn Trang & Xác Thực Hoàn Thiện](./phase-04-padding-audit-and-verification.md) | Completed | P1 | 20m |
- [x] **Không còn khoảng trắng chết:** Bảng EBITDA và các card xung quanh có chiều cao khít với nội dung, không có card nào thừa khoảng trống > 40px.
- [x] **Bảng B02 thoáng đãng:** Bảng KQKD B02 có độ rộng thoải mái, hiển thị rõ ràng 6 cột (`Mã số`, `Chỉ tiêu`, `Năm nay`, `Năm trước`, `Chênh lệch`, `%`).
- [x] **Biểu đồ YoY độc lập:** `KqkdYoYChart` có card riêng ngang hàng với bảng B02, trục 0 cân đối, thanh cột hiển thị rõ nét.
- [x] **Cầu Nối Lợi Nhuận Full-Width:** Bảng Cầu Nối Lợi Nhuận chiếm toàn bộ chiều ngang, thanh tác động trực quan dài và rõ ràng.
- [x] **Cụm 3 biểu đồ SVG:** Được bố trí cân xứng, 2 callout vàng ở chân Combo Chart được thu gọn không phình card.
- [x] **Zero Regression:** Chạy `npm run typecheck` 0 lỗi, toàn bộ 335 tests pass, bundle build thành công 100%.
