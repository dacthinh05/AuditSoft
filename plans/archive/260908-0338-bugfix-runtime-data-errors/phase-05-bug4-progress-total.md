---
phase: 5
title: "BUG-4: Fix progress total — postThrottled luôn gửi total=processed"
status: completed
priority: P2
effort: "10m"
dependencies: [4]
---

# Phase 5: BUG-4 — progress total

## Overview
`reconcile.worker.ts:40`: `postThrottled` gọi `post(phase, processed, processed)` — tham số `total` luôn bằng `processed` → `percent = 100%` ngay từ đầu, progress bar không tăng dần được.

## Root Cause
```typescript
function postThrottled(phase: ProgressPhase, processed: number): void {
  if (now - lastEmit > 120) {
    post(phase, processed, processed)  // total = processed, sai
  }
}
```
`loadMatrix` trả về `{ rows, totalRows }` nhưng `postThrottled` không nhận `total`.

## Related Code Files
- Modify: `src/workers/reconcile.worker.ts` (lines 36-42, 62-67)

## Implementation Steps
1. Thêm tham số `total: number` vào signature `postThrottled`
2. Truyền `totalRows` từ `loadMatrix` vào callback `onRows`
3. Gọi `postThrottled(phase, processed, totalRows)` với đúng total

## Change (exact diff)
```typescript
// BEFORE
function postThrottled(phase: ProgressPhase, processed: number): void {
  const now = Date.now()
  if (now - lastEmit > 120) {
    lastEmit = now
    post(phase, processed, processed)  // ← sai
  }
}

// AFTER
function postThrottled(phase: ProgressPhase, processed: number, total: number): void {
  const now = Date.now()
  if (now - lastEmit > 120) {
    lastEmit = now
    post(phase, processed, total)
  }
}
```

Cập nhật call site trong `main()`:
```typescript
// BEFORE
const beforeScan = await loadMatrix(req.before.filePath, req.before.sheetName, req.beforeRows, (p) =>
  postThrottled('reading_before', p),
)
const afterScan = await loadMatrix(req.after.filePath, req.after.sheetName, req.afterRows, (p) =>
  postThrottled('reading_after', p),
)

// AFTER — cần capture totalRows trước, hoặc dùng closure
let beforeTotal = 1
const beforeScan = await loadMatrix(req.before.filePath, req.before.sheetName, req.beforeRows, (p) =>
  postThrottled('reading_before', p, beforeTotal),
)
beforeTotal = beforeScan.totalRows  // cập nhật sau khi biết

// Tương tự cho afterScan
let afterTotal = 1
const afterScan = await loadMatrix(req.after.filePath, req.after.sheetName, req.afterRows, (p) =>
  postThrottled('reading_after', p, afterTotal),
)
afterTotal = afterScan.totalRows
```

> **Note:** `loadMatrix` trả về `totalRows` TRƯỚC khi callback onRows bắt đầu gọi (vì ExcelJS stream từng row → totalRows không biết trước). Cách đơn giản hơn: dùng `beforeScan.totalRows` làm initial estimate `1`, sau đó từ row đầu tiên dùng lại. Hoặc thêm pre-scan count.
> 
> **Giải pháp thực tế nhất:** Để `loadMatrix` gọi `onTotal(n)` callback khi biết total, hoặc đơn giản pass `Infinity` → `Math.min(100, Math.round(p/total*100))` sẽ luôn trả `0` cho đến khi done. Tốt hơn current behavior (luôn 100%).

## Todo
- [ ] Thêm tham số `total` vào `postThrottled`
- [ ] Cập nhật call sites trong hàm `main()` của worker
- [ ] Chạy `npm test`

## Success Criteria
- [ ] Progress không ngay lập tức nhảy 100% khi bắt đầu đọc file
- [ ] `percent` tăng dần hoặc ít nhất không giả 100% từ đầu
