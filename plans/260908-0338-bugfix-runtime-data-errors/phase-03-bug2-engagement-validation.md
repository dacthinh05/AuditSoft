---
phase: 3
title: "BUG-2: Fix generateWorkingPapers IPC — thiếu validation engagement"
status: completed
priority: P1
effort: "15m"
dependencies: [2]
---

# Phase 3: BUG-2 — engagement IPC validation

## Overview
`main/index.ts:206` cast `rawReq as GenerateWorkingPapersRequest` không qua Zod. Nếu renderer gửi object thiếu `engagement`, `extractAccountingContext` nhận `undefined` → mọi filler khi đọc `ctx.engagement.clientName` throw `TypeError: Cannot read properties of undefined`. Crash không có error message có nghĩa.

## Related Code Files
- Modify: `src/main/index.ts` (lines 205-220, handler `generateWorkingPapers`)

## Implementation Steps
1. Thêm guard kiểm tra `req.sourcePath` và `req.engagement` đầy đủ trước khi gọi `extractAccountingContext`
2. Throw `Error` rõ ràng bằng tiếng Việt cho từng trường thiếu
3. Không cần Zod schema đầy đủ — guard đơn giản là đủ vì interface đã có ở compile time

## Change (exact diff)
```typescript
// BEFORE — line 206-207
const req = rawReq as GenerateWorkingPapersRequest
if (!req || !req.sourcePath) throw new Error('Vui lòng chọn file dữ liệu kế toán nguồn')

// AFTER
const req = rawReq as GenerateWorkingPapersRequest
if (!req || !req.sourcePath) throw new Error('Vui lòng chọn file dữ liệu kế toán nguồn')
if (!req.engagement) throw new Error('Thiếu thông tin hợp đồng kiểm toán (engagement)')
if (!req.engagement.clientName?.trim()) throw new Error('Vui lòng nhập tên khách hàng kiểm toán')
```

## Todo
- [ ] Sửa handler `generateWorkingPapers` trong `src/main/index.ts`
- [ ] Chạy `npm run typecheck` sau khi sửa

## Success Criteria
- [ ] Gọi handler thiếu `engagement` → throw message rõ ràng, không crash với `TypeError`
- [ ] Test suite không regression
