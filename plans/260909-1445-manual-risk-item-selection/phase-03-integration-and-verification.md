---
phase: 3
title: "Integration, Styling & Verification"
status: completed
priority: P1
effort: "1h"
dependencies: ["phase-01-domain-manual-risk-items.md", "phase-02-ui-population-view-and-checkboxes.md"]
---

# Phase 3: Integration, Styling & Verification

## Overview

Hoàn thiện tích hợp luồng người dùng:
1. Thêm nút lối tắt tại Dòng 6 của Bảng 10 bước (*6 - Giá trị phần tử đặc biệt*): Cho phép KTV bấm vào để tự động cuộn xuống và mở Chế độ "Duyệt toàn bộ tổng thể" nhằm chọn thêm chứng từ.
2. Tinh chỉnh CSS cho các thành phần mới: nút chuyển đổi view mode, cột checkbox, hàng được highlight khi chọn thủ công, badge `KTV chỉ định` và nút gỡ `[✕]`.
3. Kiểm tra tính toàn vẹn khi xuất file Excel Working Paper A810.
4. Chạy toàn bộ kiểm thử TypeScript và Vitest.

## Requirements

### Functional
1. **Lối tắt tại Dòng 6 (Card 4):**
   - Trong ô Giá trị tính toán của Dòng 6, hiển thị thêm:
     ```tsx
     {manualRiskItemIds.size > 0 && (
       <span className="manual-pick-count-hint"> (Trong đó có {manualRiskItemIds.size} mẫu KTV chỉ định)</span>
     )}
     ```
   - Trong ô Công thức & Hướng dẫn kiểm toán của Dòng 6, thêm nút bấm:
     ```tsx
     <button
       className="btn-link-step6"
       onClick={() => {
         setViewMode('POPULATION')
         // Cuộn xuống khu vực bảng mẫu
         document.getElementById('sampling-table-anchor')?.scrollIntoView({ behavior: 'smooth' })
       }}
     >
       + Duyệt & chỉ định thêm mẫu
     </button>
     ```
2. **Xuất Excel Working Paper (`exportSamplingWp.ts`):**
   - Dòng KTV chỉ định xuất hiện trong Sheet 2 (*Danh sach mau*) với Phân tầng = `Mẫu đặc biệt (KTV chỉ định)`, Lý do = `KTV phán đoán & chỉ định thủ công`.
   - Các công thức trên Sheet 1 (*Quy trinh chon mau*) bảo toàn chính xác.
3. **Định dạng CSS (`styles.css`):**
   - `.sampling-viewmode-toggle`: Nhóm nút bấm chuyển đổi giữa 2 chế độ hiển thị.
   - `.badge-manual-pick`: Badge màu xanh dương `#2563eb` chuyên nghiệp.
   - `.remove-manual-pick-btn`: Nút ✕ nhỏ gọn, hover màu đỏ để gỡ nhanh.
   - `.row-manual-selected`: Highlight nhẹ nền dòng chứng từ khi được KTV tick chọn trong bảng tổng thể.

## Verification Gate

1. `npm run typecheck` $\rightarrow$ Pass 100% 3 tsconfig.
2. `npx vitest run src/domain/sampling` $\rightarrow$ Pass 100% test suite.
3. Test tính năng thực tế:
   - Nạp file Excel NKC.
   - Chọn phần hành Doanh thu.
   - Bấm `[+ Duyệt & chỉ định thêm mẫu]` $\rightarrow$ Bảng tự động chuyển sang chế độ Tổng thể.
   - Tick chọn 2 hóa đơn bất kỳ $\rightarrow$ Bảng 10 bước cập nhật Dòng 6 tăng số tiền.
   - Chuyển lại Mẫu được chọn $\rightarrow$ Thấy 2 hóa đơn có badge KTV chỉ định.
   - Bấm nút ✕ gỡ 1 hóa đơn $\rightarrow$ Số tiền Dòng 6 giảm, mẫu bị loại bỏ.
   - Bấm xuất file Excel $\rightarrow$ Đọc mở bình thường, số liệu khớp.
