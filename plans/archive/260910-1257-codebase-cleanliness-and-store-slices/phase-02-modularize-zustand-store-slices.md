---
title: "Phase 2: Modularize Zustand Store into Domain Slices"
description: "Tách file store.ts thành 6 Slices độc lập nằm trong src/renderer/state/slices/, tái cấu trúc store.ts theo chuẩn Zustand Slice Pattern."
status: completed
priority: P1
effort: "0.8h"
tags: ["zustand", "slices", "refactoring", "state-management"]
created: 2026-09-10
---

# Phase 2: Modularize Zustand Store into Domain Slices

## Context & Objectives

Hiện tại `src/renderer/state/store.ts` có 44 fields (~240 dòng), gồm:
- Đối chiếu NKC / CDFS (`before`, `after`, `running`, `progress`, `result`, `error`, `tab`, `excludeKetChuyen`...)
- Điều hướng phân hệ (`view`, `setView`)
- Bộ lọc Data Profiler (`profilerMonth`, `profilerTier`, `profilerOpen`...)
- Bản quyền phần mềm (`licenseModalOpen`, `trialStatus`...)
- Tự động cập nhật (`updateInfo`, `isCheckingUpdate`, `updateModalOpen`, `updateNoticeDismissed`...)
- Động cơ cơ sở dữ liệu (`dataSourceType`, `dbModalOpen`, `engineType`, `engineStats`...)

Mục tiêu là tách thành các Slice độc lập, tuân thủ nguyên tắc Single Responsibility (SRP):

## Slice Architecture

Tạo thư mục `src/renderer/state/slices/`:

### 1. `slices/reconcileSlice.ts`
- State: `before`, `after`, `running`, `progress`, `error`, `result`, `tab`, `excludeKetChuyen`, `ignoreDescription`, `accountLevel`, `detailQuery`, `workingPaperSourcePath`.
- Actions: `setMeta`, `setCfg`, `setPasted`, `setMappingPatch`, `setRunning`, `setProgress`, `setError`, `setResult`, `setTab`, `toggleExcludeKetChuyen`, `toggleIgnoreDescription`, `setAccountLevel`, `setDetailQuery`, `setWorkingPaperSourcePath`.

### 2. `slices/navigationSlice.ts`
- State: `view: 'hub' | 'b410' | 'workingpaper' | 'sampling' | 'setup' | 'results' | 'qtt03' | 'analytics'`.
- Actions: `setView(v: ViewKey): void`.

### 3. `slices/profilerSlice.ts`
- State: `profilerMonth`, `profilerTier`, `profilerOpen`.
- Actions: `setProfilerMonth`, `setProfilerTier`, `setProfilerOpen`, `clearProfilerFilter`.

### 4. `slices/licenseSlice.ts`
- State: `licenseModalOpen`, `trialStatus`.
- Actions: `setLicenseModalOpen`, `refreshTrialStatus`.

### 5. `slices/updateSlice.ts`
- State: `updateInfo`, `isCheckingUpdate`, `updateModalOpen`, `updateNoticeDismissed`.
- Actions: `setUpdateInfo`, `setIsCheckingUpdate`, `setUpdateModalOpen`, `setUpdateNoticeDismissed`, `checkAppUpdate`.

### 6. `slices/engineSlice.ts`
- State: `dataSourceType`, `dbModalOpen`, `engineType`, `engineStats`.
- Actions: `setDataSourceType`, `setDbModalOpen`, `setEngineType`, `setEngineStats`.

### 7. File `store.ts` (Tổng hợp)
- Nhập toàn bộ 6 slices và gộp vào `useApp = create<AppStore>((...a) => ({ ...createReconcileSlice(...a), ...createNavigationSlice(...a), ... }))`.
- Export đầy đủ interface `AppStore`, kiểu `ViewKey`, `TabKey`, và hàm `runReconcileNow()`.

## Verification & Backward Compatibility
- Không thay đổi bất kỳ import nào ở các components bên ngoài: `import { useApp } from '../state/store'` tiếp tục hoạt động hoàn hảo 100%.
- Không thay đổi kiểu dữ liệu của bất kỳ action hay state field nào.
