---
phase: 2
title: "Tab UI Refinement & Inline Auto-Scan Checkbox"
status: completed
priority: P1
effort: "1.0h"
dependencies: ["phase-01-filter-closing-entries.md"]
---

# Phase 2: Tab UI Refinement & Inline Auto-Scan Checkbox

## Overview

Tinh chỉnh toàn diện giao diện thanh chuyển đổi chế độ xem (Card 5) theo phản hồi của KTV:
1. Đổi tên Tab 2: từ *"🔍 Duyệt toàn bộ tổng thể"* $\rightarrow$ **"Chọn mẫu đặc biệt"**.
2. Loại bỏ toàn bộ icon emoji rườm rà (📋, 🔍...) trên cả 2 nút tab, giữ giao diện phẳng, tối giản chuẩn doanh nghiệp.
3. Thêm Checkbox ngay cạnh nút Tab 2:
   `[x] Cho phần mềm tự chọn`
   - Liên kết trực tiếp với `config.includeRiskItems`.
   - Khi KTV tick chọn: Phần mềm tự động quét 22 dòng theo VSA 530 + KTV vẫn có thể tự tay tick thêm các dòng khác.
   - Khi KTV bỏ tick: Phần mềm không tự quét, chỉ lấy những dòng KTV tự tay tick chọn.
4. Điều chỉnh badge đếm: Chỉ hiển thị `(KTV chọn: K dòng)` khi `manualRiskItemIds.size > 0`, không gây nhầm lẫn với số lượng quét tự động.
5. Tại Card 4 Dòng 6: Nút bấm hiển thị chữ tối giản `+ Tự chọn mẫu đặc biệt`.

## Requirements

1. Giao diện thanh Tab (Card 5):
   ```tsx
   <div className="viewmode-toggle-group">
     <button
       type="button"
       className={`viewmode-tab-btn ${viewMode === 'SAMPLES' ? 'active' : ''}`}
       onClick={() => setViewMode('SAMPLES')}
     >
       Mẫu kiểm toán được chọn ({wpResult.samples.length})
     </button>
     <button
       type="button"
       className={`viewmode-tab-btn ${viewMode === 'POPULATION' ? 'active' : ''}`}
       onClick={() => setViewMode('POPULATION')}
     >
       Chọn mẫu đặc biệt ({filteredSectionItems.length.toLocaleString('vi-VN')} dòng)
       {manualRiskItemIds.size > 0 && (
         <span className="manual-pick-badge-count">
           KTV chọn: {manualRiskItemIds.size}
         </span>
       )}
     </button>
     <label className="auto-scan-inline-toggle" title="Cho phép phần mềm tự động quét thêm các dòng rủi ro VSA 530 (cuối kỳ 31/12, số tròn, từ khóa nhạy cảm)">
       <input
         type="checkbox"
         checked={config.includeRiskItems !== false}
         onChange={(e) => setConfig((c) => ({ ...c, includeRiskItems: e.target.checked }))}
       />
       <span>Cho phần mềm tự chọn</span>
     </label>
   </div>
   ```
2. CSS trong `src/renderer/styles.css`:
   - Định dạng `.auto-scan-inline-toggle` gọn gàng, thanh lịch, có đường kẻ ngăn cách nhẹ với 2 tab.

## Verification Gate

- Kiểm tra trực quan: 2 tab không còn emoji, Tab 2 mang tên "Chọn mẫu đặc biệt".
- Checkbox "Cho phần mềm tự chọn" bật/tắt phản hồi tức thì trên Bảng 10 bước.
