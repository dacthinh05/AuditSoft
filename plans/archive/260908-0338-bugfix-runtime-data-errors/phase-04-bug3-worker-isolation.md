---
phase: 4
title: "BUG-3: Fix worker isolation — spawnWorker terminate worker đang chạy"
status: completed
priority: P1
effort: "25m"
dependencies: [3]
---

# Phase 4: BUG-3 — worker isolation

## Overview
`spawnWorker()` gọi `terminateActiveWorker()` trước khi tạo worker mới → nếu reconcile đang chạy mà user click Export, reconcile worker bị kill ngay. Promise của reconcile treo mãi vì worker đã chết không gửi `done`/`error`. `activeWorker` sau đó trỏ export worker → `cancelReconcile` IPC kill sai worker.

## Design
Tách `activeWorker` thành hai biến riêng biệt:
- `activeReconcileWorker: Worker | null`
- `activeExportWorker: Worker | null`

Mỗi loại IPC handler chỉ terminate worker của loại mình. `cancelReconcile` chỉ kill reconcile worker.

## Related Code Files
- Modify: `src/main/index.ts` (lines 15, 51-72, 106-123, 157-184)

## Implementation Steps
1. Đổi `let activeWorker` thành hai biến `activeReconcileWorker` và `activeExportWorker`
2. Tạo `terminateReconcileWorker()` và `terminateExportWorker()` riêng
3. `spawnReconcileWorker()` chỉ terminate + replace reconcile worker
4. `spawnExportWorker()` chỉ terminate + replace export worker
5. `cancelReconcile` handler gọi `terminateReconcileWorker()`
6. Cả hai `on('exit')` handler set đúng biến về `null`

## Change (exact diff)
```typescript
// BEFORE
let activeWorker: Worker | null = null

function terminateActiveWorker(): void {
  if (activeWorker) { void activeWorker.terminate(); activeWorker = null }
}

function spawnWorker(workerPath: string, workerData: unknown): Worker {
  terminateActiveWorker()
  const worker = new Worker(workerPath, { workerData })
  activeWorker = worker
  return worker
}

// AFTER
let activeReconcileWorker: Worker | null = null
let activeExportWorker: Worker | null = null

function terminateReconcileWorker(): void {
  if (activeReconcileWorker) { void activeReconcileWorker.terminate(); activeReconcileWorker = null }
}

function terminateExportWorker(): void {
  if (activeExportWorker) { void activeExportWorker.terminate(); activeExportWorker = null }
}

function spawnReconcileWorker(workerPath: string, workerData: unknown): Worker {
  terminateReconcileWorker()
  const worker = new Worker(workerPath, { workerData })
  activeReconcileWorker = worker
  return worker
}

function spawnExportWorker(workerPath: string, workerData: unknown): Worker {
  terminateExportWorker()
  const worker = new Worker(workerPath, { workerData })
  activeExportWorker = worker
  return worker
}
```

Cập nhật handlers:
- `runReconcile` → dùng `spawnReconcileWorker`, `on('exit')` → `activeReconcileWorker = null`
- `exportReport` → dùng `spawnExportWorker`, `on('exit')` → `activeExportWorker = null`
- `cancelReconcile` → gọi `terminateReconcileWorker()`

## Todo
- [ ] Thay biến `activeWorker` bằng hai biến riêng trong `src/main/index.ts`
- [ ] Tạo `terminateReconcileWorker` + `terminateExportWorker`
- [ ] Tạo `spawnReconcileWorker` + `spawnExportWorker`
- [ ] Cập nhật tất cả call sites: `runReconcile`, `exportReport`, `cancelReconcile`, exit handlers
- [ ] Xóa hàm `spawnWorker` và `terminateActiveWorker` cũ
- [ ] Chạy `npm run typecheck` + `npm test`

## Success Criteria
- [ ] Reconcile và Export có thể chạy đồng thời không bị terminate lẫn nhau
- [ ] `cancelReconcile` chỉ kill reconcile worker
- [ ] Không còn biến `activeWorker` trong code
- [ ] Test suite không regression
