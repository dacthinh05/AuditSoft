---
phase: 1
title: "Domain Engine & Sampling Algorithm (Tùy chọn Phần tử đặc biệt)"
status: completed
priority: P1
effort: "1.5h"
dependencies: []
---

# Phase 1: Domain Engine & Sampling Algorithm (Tùy chọn Phần tử đặc biệt)

## Overview

Mở rộng hàm tính toán chọn mẫu 10 bước `calculateAuditSamplingWp` trong `src/domain/sampling/auditSamplingWp.ts` để tiếp nhận cờ `includeRiskItems?: boolean`. Hiện tại, hàm luôn gọi cứng `checkSpecificRisk(...)` mà không có cách nào tắt được. 

Khi `includeRiskItems === false`:
- Không phân loại các khoản mục vào nhóm `riskItems`.
- Dòng 6: *Giá trị phần tử đặc biệt (2)* được gán bằng `0 đ`, số lượng mẫu bằng `0`.
- Toàn bộ các dòng giao dịch (trừ các khoản mục vượt KCM kiểm tra 100%) được giữ lại trong `remainingItems`.
- Dòng 7: *Cỡ mẫu còn lại* $= (\text{Tổng thể} - \text{Giá trị > KCM} - 0) / \text{KCM}$ và Dòng 10: *Bước nhảy* $= \text{Số nghiệp vụ còn lại} / \text{Cỡ mẫu còn lại}$ tự động tính toán lại chính xác trên toàn bộ phần còn lại này.
- Danh sách mẫu đầu ra `samples` không còn phần tử mang nhãn `SPECIFIC_RISK`.

## Requirements

### Functional
1. Cập nhật interface `AuditSamplingWpInput` tại `src/domain/sampling/auditSamplingWp.ts`:
   ```ts
   export interface AuditSamplingWpInput {
     // ...
     includeRiskItems?: boolean // Mặc định true
   }
   ```
2. Cập nhật logic phân loại khoản mục trong `calculateAuditSamplingWp`:
   ```ts
   const shouldCheckRisk = includeRiskItems !== false
   for (const it of items) {
     const amt = Math.abs(it.amount)
     if (amt >= kcm) {
       highValueItems.push(it)
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
3. Đảm bảo cấu trúc kết quả `wpResult.steps.riskItems` và `wpResult.steps.riskCount` hiển thị đúng giá trị 0 khi tắt.
4. Đảm bảo file xuất Excel `src/domain/sampling/exportSamplingWp.ts` không bị lỗi chia cho 0 hay công thức bị `#VALUE!` khi giá trị Dòng 6 bằng 0.
5. Viết unit tests bổ sung trong `src/domain/sampling/auditSamplingWp.test.ts` kiểm chứng cả 2 trường hợp `includeRiskItems: true` và `includeRiskItems: false`.

## Related Code Files

- `src/domain/sampling/auditSamplingWp.ts`
- `src/domain/sampling/auditSamplingWp.test.ts`
- `src/domain/sampling/types.ts`
- `src/domain/sampling/exportSamplingWp.ts`

## Implementation Steps

1. Thêm trường `includeRiskItems?: boolean` vào `AuditSamplingWpInput`.
2. Áp dụng cờ kiểm tra trong vòng lặp phân loại phần tử của `calculateAuditSamplingWp`.
3. Kiểm tra công thức Excel tại `exportSamplingWp.ts`:
   - Dòng 31 (Row 7): `ROUND((E21-E27-E29)/E26,0)` trong đó `E29` là Dòng 6 (0 đ), công thức vẫn hoàn toàn chính xác.
4. Viết test case mới trong `auditSamplingWp.test.ts`:
   - Test 1: Mặc định hoặc `includeRiskItems: true` $\rightarrow$ có `riskCount > 0`.
   - Test 2: `includeRiskItems: false` $\rightarrow$ `riskCount === 0`, `riskItems === 0`, `remainingSampleSize` tăng lên tương ứng.
5. Chạy `npx vitest run src/domain/sampling` xác nhận 100% test pass.

## Verification Gate

```bash
npx vitest run src/domain/sampling
```
Tất cả các bài kiểm tra phải pass với thời gian chạy $< 2$ giây.
