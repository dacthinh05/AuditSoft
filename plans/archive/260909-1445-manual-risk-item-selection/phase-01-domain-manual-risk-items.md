---
phase: 1
title: "Domain Engine Support for Manual Risk Items"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Domain Engine Support for Manual Risk Items

## Overview

Nâng cấp hàm tính toán chọn mẫu 10 bước `calculateAuditSamplingWp` (`src/domain/sampling/auditSamplingWp.ts`) để hỗ trợ tham số `manualRiskItemIds?: readonly string[]`. 

Khi KTV chủ động chọn các ID chứng từ:
1. Thuật toán duyệt qua từng dòng giao dịch `it`:
   - Nếu $|amt| \ge \text{KCM}$ $\rightarrow$ vẫn ưu tiên xếp vào `highValueItems` (Dòng 5: Lớn hơn KCM kiểm tra 100%).
   - Nếu $|amt| < \text{KCM}$ và `it.id` nằm trong `manualRiskItemIds` $\rightarrow$ xếp vào `riskItems` (Dòng 6: Giá trị phần tử đặc biệt).
   - Nếu không nằm trong `manualRiskItemIds` nhưng `includeRiskItems !== false` và thỏa mãn `checkSpecificRisk` $\rightarrow$ xếp vào `riskItems`.
   - Các dòng còn lại $\rightarrow$ xếp vào `remainingItems` (Dòng 7: Cỡ mẫu còn lại).
2. Đối với các dòng do KTV chỉ định thủ công:
   - Gán `categoryLabel = 'Mẫu đặc biệt (KTV chỉ định)'`.
   - Gán `riskNote = 'KTV phán đoán & chỉ định thủ công'`.
   - Có thêm cờ boolean `isManualPick: true` trong `SelectedWpSample` để UI phân biệt và hiển thị nút gỡ nhanh `[✕]`.

## Requirements

### Functional
1. Cập nhật `SelectedWpSample` trong `auditSamplingWp.ts`:
   ```ts
   export interface SelectedWpSample extends SampleableItem {
     stt: number
     category: 'KCM_HIGH_VALUE' | 'SPECIFIC_RISK' | 'STEP_JUMP'
     categoryLabel: string
     riskNote: string
     isManualPick?: boolean // Đánh dấu dòng do KTV tự tay tick chọn
   }
   ```
2. Cập nhật `AuditSamplingWpInput`:
   ```ts
   export interface AuditSamplingWpInput {
     // ...
     includeRiskItems?: boolean
     manualRiskItemIds?: readonly string[] // Danh sách ID do KTV chọn thủ công
   }
   ```
3. Cập nhật vòng lặp phân loại trong `calculateAuditSamplingWp`:
   ```ts
   const manualIdsSet = new Set(manualRiskItemIds ?? [])
   const shouldCheckRisk = includeRiskItems !== false

   for (const it of items) {
     const amt = Math.abs(it.amount)
     if (amt >= kcm) {
       highValueItems.push(it)
     } else if (manualIdsSet.has(it.id)) {
       riskItems.push(it)
     } else {
       const riskCheck = shouldCheckRisk ? checkSpecificRisk(it, clearlyTrivial) : { isRisk: false, note: '' }
       if (riskCheck.isRisk) {
         riskItems.push(it)
       } else {
         remainingItems.push(it)
       }
     }
   }
   ```
4. Khi tạo danh sách `riskSamples`:
   ```ts
   const riskSamples: SelectedWpSample[] = riskItems.map((it) => {
     const isManual = manualIdsSet.has(it.id)
     return {
       ...it,
       stt: sttCounter++,
       category: 'SPECIFIC_RISK',
       categoryLabel: isManual ? 'Mẫu đặc biệt (KTV chỉ định)' : 'Mẫu đặc biệt (Hệ thống quét)',
       riskNote: isManual ? 'KTV phán đoán & chỉ định thủ công' : (checkSpecificRisk(it, clearlyTrivial).note || 'Phần tử rủi ro đặc biệt'),
       isManualPick: isManual,
     }
   })
   ```
5. Viết unit tests trong `src/domain/sampling/auditSamplingWp.test.ts`.

## Related Code Files

- `src/domain/sampling/auditSamplingWp.ts`
- `src/domain/sampling/auditSamplingWp.test.ts`
- `src/domain/sampling/exportSamplingWp.ts`

## Verification Gate

```bash
npx vitest run src/domain/sampling
```
Phải vượt qua 100% các bài test hiện tại và test case mới cho `manualRiskItemIds`.
