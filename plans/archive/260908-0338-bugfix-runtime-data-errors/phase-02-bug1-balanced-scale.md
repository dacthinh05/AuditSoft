---
phase: 2
title: "BUG-1: Fix balanced check — so sánh raw bigint không align scale"
status: completed
priority: P1
effort: "10m"
dependencies: [1]
---

# Phase 2: BUG-1 — balanced scale alignment

## Overview
`AccountingReconciliationEngine.ts:119` so sánh `totalDebit.raw === totalCredit.raw` mà không align scale. Nếu hai bên tích lũy Money với scale khác nhau (ví dụ `{raw:1000000n,scale:0}` vs `{raw:10000000n,scale:1}`), kết quả `balanced=false` dù giá trị thực bằng nhau → `status='ERROR'` oan cho toàn bộ đối chiếu NKC↔CĐSPS.

## Root Cause
`addMoney` dùng `Math.max(a.scale, b.scale)` nên hai biến `totalDebit` / `totalCredit` có thể có scale khác nhau khi chúng tích lũy riêng biệt từ các entry có scale khác nhau.

## Related Code Files
- Modify: `src/main/accounting/AccountingReconciliationEngine.ts` (line 119)

## Implementation Steps
1. Thay `totalDebit.raw === totalCredit.raw` bằng `subtractMoney(totalDebit, totalCredit).raw === 0n`
2. `subtractMoney` align scale trước khi trừ → so sánh đúng

## Change (exact diff)
```typescript
// BEFORE — line 119
const balanced = totalDebit.raw === totalCredit.raw

// AFTER
const balanced = subtractMoney(totalDebit, totalCredit).raw === 0n
```

## Todo
- [ ] Sửa line 119 trong `AccountingReconciliationEngine.ts`
- [ ] Chạy `npm test` sau khi sửa

## Success Criteria
- [ ] `balanced` = true khi tổng Nợ = tổng Có dù scale khác nhau
- [ ] Test suite không regression
