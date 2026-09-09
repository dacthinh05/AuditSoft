---
phase: 2
title: "UI View Mode & Manual Selection Table in SamplingTab"
status: completed
priority: P1
effort: "1.5h"
dependencies: ["phase-01-domain-manual-risk-items.md"]
---

# Phase 2: UI View Mode & Manual Selection Table in SamplingTab

## Overview

Xây dựng giao diện cho phép KTV chuyển đổi linh hoạt giữa:
1. **Chế độ xem 1:** *Mẫu kiểm toán được chọn* (`viewMode === 'SAMPLES'`) — Xem và lọc danh sách mẫu thực tế cần kiểm tra thực địa.
2. **Chế độ xem 2:** *Duyệt toàn bộ tổng thể chứng từ* (`viewMode === 'POPULATION'`) — Xem tất cả các dòng của phần hành, với cột đầu tiên là Checkbox $\boxed{\checkmark}$ để KTV tự tay tick chọn bất kỳ dòng nào làm phần tử đặc biệt.

Đồng thời, tại Chế độ xem 1 (Mẫu được chọn), các dòng do KTV chỉ định sẽ có nhãn `Mẫu đặc biệt (KTV chỉ định)` kèm nút gỡ nhanh `[✕]`.

## Requirements

### Functional
1. **State quản lý trong `SamplingTab.tsx`:**
   ```tsx
   const [manualRiskItemIds, setManualRiskItemIds] = useState<Set<string>>(new Set())
   const [viewMode, setViewMode] = useState<'SAMPLES' | 'POPULATION'>('SAMPLES')
   ```
2. **Truyền `manualRiskItemIds` vào `calculateAuditSamplingWp`:**
   ```tsx
   const wpResult = useMemo<AuditSamplingWpResult>(() => {
     return calculateAuditSamplingWp({
       // ...
       includeRiskItems: config.includeRiskItems !== false,
       manualRiskItemIds: Array.from(manualRiskItemIds),
     })
   }, [..., manualRiskItemIds])
   ```
3. **Thanh Toolbar chuyển đổi chế độ xem (Card 5 Header):**
   - Nút 1: `Mẫu kiểm toán được chọn (${wpResult.samples.length})`
   - Nút 2: `Duyệt toàn bộ tổng thể (${filteredSectionItems.length}) ${manualRiskItemIds.size > 0 ? `· Đã chỉ định ${manualRiskItemIds.size} mẫu` : ''}`
4. **Cấu hình cột cho Chế độ Duyệt tổng thể (`populationColumns`):**
   - Cột 1: **Chỉ định rủi ro** (Width 90px, Center).
     - Nếu dòng có $|amt| \ge \text{wpResult.kcm}$: Hiển thị nhãn cố định `[Lớn hơn KCM]` (không cần tick vì đã được chọn kiểm tra 100%).
     - Ngược lại: Hiển thị Checkbox có thể click. Nếu đã nằm trong `manualRiskItemIds` $\rightarrow$ `checked={true}`.
   - Cột 2: STT dòng kế toán.
   - Các cột: Ngày CT, Số CT/HĐ, Diễn giải, TK Nợ, TK Có, Số tiền VND, Ngoại tệ, Tỷ giá.
5. **Cấu hình cột cho Chế độ Mẫu được chọn (`columns`):**
   - Cột Phân tầng: Nếu `r.isManualPick === true` $\rightarrow$ hiển thị nhãn `Mẫu đặc biệt (KTV chỉ định)` màu xanh dương kèm nút bấm `✕` để KTV có thể gỡ nhanh trực tiếp từ bảng mẫu.
6. **Hàm xử lý Toggle:**
   ```tsx
   function handleToggleManualRisk(id: string): void {
     setManualRiskItemIds((prev) => {
       const next = new Set(prev)
       if (next.has(id)) next.delete(id)
       else next.add(id)
       return next
     })
   }
   ```

## Related Code Files

- `src/renderer/components/SamplingTab.tsx`
- `src/renderer/styles.css`

## Verification Gate

- Chuyển sang chế độ "Duyệt toàn bộ tổng thể": Bảng hiển thị toàn bộ $N$ dòng của phần hành.
- Click chọn 1 checkbox $\rightarrow$ Ô checkbox được đánh dấu, số lượng hiển thị trên nút tab tăng lên 1.
- Chuyển lại "Mẫu kiểm toán được chọn" $\rightarrow$ Dòng vừa chọn xuất hiện trong danh sách mẫu với nhãn KTV chỉ định.
- Bấm nút `[✕]` $\rightarrow$ Dòng biến mất khỏi danh sách mẫu và bỏ đánh dấu trong bảng tổng thể.
