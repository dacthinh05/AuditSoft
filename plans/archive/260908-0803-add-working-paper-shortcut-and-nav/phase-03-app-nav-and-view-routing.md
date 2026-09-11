---
phase: 3
title: "App & Nav: Đăng ký route WorkingPaperPage và tab điều hướng trên Header"
status: completed
priority: P1
effort: "25m"
dependencies: [1, 2]
---

# Phase 3: App & Nav — Mở route WorkingPaperPage và bổ sung Tab trên Header

## Overview
Hiện tại `App.tsx` chỉ hiển thị 3 views: `setup`, `results`, `sampling`. Dù `WorkingPaperPage.tsx` đã được code sẵn 600 dòng hoàn chỉnh, người dùng không thể truy cập vì:
1. `App.tsx` chưa render `<WorkingPaperPage />` khi `view === 'workingpaper'`.
2. Header segmented-nav chưa có nút tab "12 Giấy Làm Việc".

Phase này sẽ mở view trong `App.tsx`, bổ sung tab trên header để người dùng có thể chủ động chuyển qua lại giữa Đối chiếu NKC, Kết quả, Chọn mẫu VSA 530, và Lập 12 Giấy làm việc. Đồng thời cập nhật `WorkingPaperPage.tsx` để tự động nhận `workingPaperSourcePath` từ store.

## Requirements
- Functional:
  - Header segmented-nav có thêm nút tab "12 Giấy Làm Việc (GLV)".
  - `App.tsx` render `<WorkingPaperPage />` khi `view === 'workingpaper'`.
  - `WorkingPaperPage.tsx` đọc `workingPaperSourcePath` từ `useApp`:
    - Khi mount hoặc khi path thay đổi: nếu có path từ store, tự động gọi `handleLoadPath(path)`.
    - Tự động bóc tách năm tài chính (`2024`, `2025`, `2026`) từ tên file để gợi ý `fiscalYearEnd`.
- Non-functional:
  - Giữ header responsive và không tràn trên màn hình nhỏ.
  - Type-safe hoàn toàn.

## Architecture
```
Top Header Segmented Navigation:
[ 1. Đối Chiếu 2 Sổ NKC ]  [ 2. Kết Quả (nếu có) ]  [ 3. Chọn Mẫu VSA 530 ]  [ 4. 12 Giấy Làm Việc (GLV) ]

Main Content Router:
{view === 'setup' && <SetupPage />}
{view === 'results' && <ResultsPage />}
{view === 'sampling' && <SamplingTab />}
{view === 'workingpaper' && <WorkingPaperPage />}
```

## Related Code Files
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/pages/WorkingPaperPage.tsx`

## Implementation Steps
1. Import `WorkingPaperPage` vào `src/renderer/App.tsx`.
2. Trong `App.tsx`:
   - Thêm nút tab trong `.segmented-nav`:
     ```tsx
     <button
       type="button"
       className={`segmented-btn ${view === 'workingpaper' ? 'active' : ''}`}
       onClick={() => useApp.getState().setView('workingpaper')}
     >
       <span className="step-badge">4</span>
       <span className="btn-label">12 Giấy Làm Việc</span>
     </button>
     ```
   - Trong `<main className="app-main">`, thêm `{view === 'workingpaper' && <WorkingPaperPage />}`.
3. Trong `src/renderer/pages/WorkingPaperPage.tsx`:
   - Lấy `workingPaperSourcePath` từ `useApp((s) => s.workingPaperSourcePath)`.
   - Dùng `useEffect` để khi `workingPaperSourcePath` có giá trị và khác `sourcePath` hiện tại, tự động cập nhật `sourcePath` và parse `fiscalYearEnd`.

## Success Criteria
- [ ] Header hiển thị tab "12 Giấy Làm Việc"
- [ ] Bấm tab chuyển mượt mà sang `WorkingPaperPage`
- [ ] Khi đi từ nút shortcut ở `SetupPage`, `sourcePath` trong `WorkingPaperPage` được điền sẵn chính xác file nguồn đã chọn
