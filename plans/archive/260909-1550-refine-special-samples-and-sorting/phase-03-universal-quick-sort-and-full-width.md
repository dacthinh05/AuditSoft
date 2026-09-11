---
phase: 3
title: "Universal Quick Sort & Full Width Layout"
status: completed
priority: P1
effort: "1.0h"
dependencies: ["phase-01-filter-closing-entries.md", "phase-02-refine-tab-ui-and-auto-scan-toggle.md"]
---

# Phase 3: Universal Quick Sort & Full Width Layout

## Overview

1. **Sắp xếp ngày tháng chuẩn xác:**
   - Trong định dạng ngày Việt Nam `DD/MM/YYYY`: Việc so sánh chuỗi (`a.localeCompare(b)`) dẫn tới ngày `24/05/2025` xếp sau `17/01/2025` nhưng trước `29/01/2025` (sai lệch thứ tự thời gian).
   - Xây dựng helper `parseDateToNumber(dateStr: string): number`: chuyển `DD/MM/YYYY` thành `YYYYMMDD` để sắp xếp đúng 100%.
2. **Kích hoạt Quick Sort trên cả 2 bảng:**
   - Cung cấp state và hàm sort riêng cho bảng Mẫu được chọn: `sampleSortKey`, `sampleSortDirection`.
   - Cho phép click tiêu đề mọi cột: Ngày CT, Số tiền, Số CT, TK Nợ, TK Có, STT, Phân tầng.
   - Bảng Chọn mẫu đặc biệt hỗ trợ đầy đủ các cột.
3. **Lấp đầy 100% chiều ngang cho cả Tab 1:**
   - Cột Diễn giải có `flex: true` để co giãn chiếm toàn bộ phần dư còn lại.
   - Cột Tham chiếu KTV và các cột bên phải không bị cắt chữ `[Chờ...`.

## Requirements

1. Helper sắp xếp ngày trong `SamplingTab.tsx`:
   ```ts
   function parseDateToTimestamp(str: string): number {
     if (!str) return 0
     const parts = str.split('/')
     if (parts.length === 3) {
       const d = parseInt(parts[0] ?? '0', 10)
       const m = parseInt(parts[1] ?? '0', 10)
       const y = parseInt(parts[2] ?? '0', 10)
       return y * 10000 + m * 100 + d
     }
     return 0
   }
   ```
2. Sort comparator cho `displayedSamples` và `displayedPopulation`:
   - `'displayDate'`: So sánh theo `parseDateToTimestamp`.
   - `'amount'`: So sánh theo `Math.abs(amount)`.
   - `'voucher'`: So sánh tự nhiên (`localeCompare(..., { numeric: true })`).
   - `'debit'`, `'credit'`, `'description'`: So sánh chuỗi.
3. Co giãn độ rộng:
   - Đảm bảo `columns` và `populationColumns` đều có `flex: true` trên cột Diễn giải.
   - Cột Tham chiếu KTV tăng width lên `165px`.

## Verification Gate

1. `npx vitest run src/domain/sampling` $\rightarrow$ Pass 100%.
2. `npm run typecheck` $\rightarrow$ Pass 100%.
3. Kiểm tra click sort trên cột Ngày CT: Sắp xếp đúng theo năm/tháng/ngày.
4. Kiểm tra click sort trên cột Số tiền: Số tiền to nhất hiển thị trên đầu.
