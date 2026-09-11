---
title: "Căn Chỉnh Lưới 50/50 Đồng Bộ & Tái Thiết Kế Biểu Đồ So Sánh YoY (VSA 520)"
description: "Khắc phục lỗi lệch đường viền card giữa các hàng (pad trên lệch pad dưới) bằng cách đưa Section 2 về lưới 1fr 1fr; tái thiết kế KqkdYoYChart sang dạng Biểu đồ Thanh Ngang Chênh Lệch & Tốc Độ Tăng Trưởng (Diverging Variance Bars) để triệt tiêu lỗi nuốt thang đo 75 tỷ đè 4 tỷ."
status: completed
priority: P1
effort: "1.5h"
branch: main
tags: [analytics, ui-ux, chart-redesign, grid-alignment, vsa520]
blockedBy: []
blocks: []
created: 2026-09-10
---

# Căn Chỉnh Lưới 50/50 Đồng Bộ & Tái Thiết Kế Biểu Đồ So Sánh YoY (VSA 520)

## Overview

Dựa trên phản hồi từ ảnh chụp thực tế (Image #1):
1. **Lỗi lệch hàng ("pad này bị lệch so với pad dưới"):**
   - Hàng trên (Section 2 - KQKD vs Chart) dùng lưới `1.25fr 1fr` (55.5% vs 44.5%), trong khi Hàng dưới (Section 3 - EBITDA vs Bên liên quan) dùng lưới `1fr 1fr` (50% vs 50%).
   - Hậu quả: Đường phân cách dọc của card trên bị lệch sang phải khoảng 85px so với card dưới, tạo nên đường răng cưa không đồng trục.
   - Giải pháp: Đưa Section 2 về lưới `minmax(0, 1fr) minmax(0, 1fr)` (50/50 đồng nhất). Tất cả các hàng Section 2, Section 3, Section 4 sẽ có cạnh dọc thẳng tắp 100%.

2. **Lỗi thiết kế biểu đồ ("thiết kế chart này khác đi"):**
   - Biểu đồ cột kép hiện tại thể hiện giá trị tuyệt đối, dẫn đến hiện tượng Doanh thu và Giá vốn (75 TỶ) đè bẹp Chi phí bán hàng và Chi phí QLDN (4.2 TỶ, nhỏ hơn gần 20 lần). Hai cột đầu cao đụng trần, hai cột giữa lùn tịt một mẩu không nhìn thấy biến động, còn cột LN HĐKD thì cắm sâu xuống đáy -37 tỷ.
   - Giải pháp: Tái thiết kế sang **Biểu Đồ Thanh Ngang Phân Tích Chênh Lệch & Tốc Độ Tăng Trưởng (Diverging YoY Variance & Growth Rate Chart)**. Trục 0 nằm ở giữa, thể hiện mức biến động $\Delta$ và % tăng/giảm với màu sắc nhận diện rủi ro kiểm toán (xanh: tích cực, đỏ: rủi ro).

---

## Goals

| # | Goal | Priority | Effort |
|---|------|----------|--------|
| 1 | Căn chỉnh Section 2 về lưới 50/50 (`1fr 1fr`), làm thẳng hàng tuyệt đối mép dọc của tất cả các card | P1 | 15m |
| 2 | Tái thiết kế `KqkdYoYChart.tsx` sang dạng Thanh Ngang Đối Xứng (Diverging Variance Bars) kèm % tăng trưởng | P1 | 45m |
| 3 | Tối ưu hover tooltip, phân loại màu sắc rủi ro kiểm toán VSA 520, chạy typecheck & test suite 100% | P1 | 20m |

## Phases

| # | Phase | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| 1 | [Phase 1: Căn Chỉnh Lưới 50/50 Cho Section 2](./phase-01-align-grid-50-50.md) | Completed | P1 | 15m |
| 2 | [Phase 2: Tái Thiết Kế KqkdYoYChart Dạng Thanh Ngang](./phase-02-redesign-yoy-diverging-bars.md) | Completed | P1 | 45m |
| 3 | [Phase 3: Kiểm Thử Xác Thực Hoàn Thiện](./phase-03-verification.md) | Completed | P1 | 20m |

---

## Acceptance Criteria

- [x] Đường phân cách dọc giữa 2 card ở Section 2 thẳng hàng tuyệt đối với Section 3 và Section 4 (không còn bị lệch zíc-zắc).
- [x] Biểu đồ `KqkdYoYChart` hiển thị dạng thanh ngang đối xứng qua trục 0, thấy rõ mức độ chênh lệch $\Delta$ và % tăng trưởng của cả 6 chỉ tiêu trọng yếu.
- [x] Không còn hiện tượng số 75 tỷ làm co rúm các số 4 tỷ; các chỉ tiêu chi phí và lợi nhuận đều được hiển thị rõ ràng, dễ đọc.
- [x] Bảng B02 ở tỷ lệ 50% hiển thị đầy đủ 6 cột, font monospace rõ nét, không phát sinh thanh cuộn ngang ngoài ý muốn.
- [x] `npm run typecheck` 0 lỗi, toàn bộ 354 tests pass, production build thành công.
