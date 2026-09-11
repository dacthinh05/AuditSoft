---
phase: 1
title: "Store & State: Thêm workingPaperSourcePath vào AppStore"
status: completed
priority: P1
effort: "15m"
dependencies: []
---

# Phase 1: Store & State — Quản lý đường dẫn nguồn cho Working Paper

## Overview
Mở rộng `AppStore` trong `src/renderer/state/store.ts` để lưu `workingPaperSourcePath: string | null` và action `setWorkingPaperSourcePath(path: string | null): void`. Điều này cho phép `SetupPage` truyền đường dẫn file đã nạp (Nguồn ① hoặc ②) sang `WorkingPaperPage` một cách tự nhiên và reactive.

## Requirements
- Functional:
  - `useApp` có trường `workingPaperSourcePath: string | null` (mặc định: `null`)
  - `useApp` có action `setWorkingPaperSourcePath(path: string | null): void`
  - `resetAll()` đặt lại `workingPaperSourcePath: null`
- Non-functional: Giữ nguyên type safety với TypeScript, không phá vỡ các trường state hiện có.

## Architecture
```
SetupPage (User clicks "Tạo Working Paper")
   │
   ├── Xác định path: After (nếu có) hoặc Before
   ├── useApp.getState().setWorkingPaperSourcePath(chosenPath)
   └── useApp.getState().setView('workingpaper')
         │
         ▼
WorkingPaperPage
   └── useEffect: nếu store có workingPaperSourcePath → nạp vào state sourcePath nội bộ
```

## Related Code Files
- Modify: `src/renderer/state/store.ts`

## Implementation Steps
1. Khai báo `workingPaperSourcePath: string | null` trong interface `AppStore`.
2. Khai báo `setWorkingPaperSourcePath(path: string | null): void` trong interface `AppStore`.
3. Khởi tạo giá trị ban đầu `workingPaperSourcePath: null` trong `create<AppStore>()`.
4. Viết implementation cho `setWorkingPaperSourcePath`.
5. Cập nhật `resetAll` để reset trường này về `null`.

## Success Criteria
- [ ] TypeScript compile không lỗi (`npm run typecheck`)
- [ ] Store lưu và đọc được `workingPaperSourcePath`
