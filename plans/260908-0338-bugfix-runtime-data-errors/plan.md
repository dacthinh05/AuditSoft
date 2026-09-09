---
title: "Bugfix: Runtime Data Errors — AuditSoft NKC"
description: "Fix 6 runtime bugs tìm thấy khi audit toàn bộ phần mềm: scale alignment, IPC validation, worker isolation, progress reporting, error codes, CDFS column mapping."
status: completed
priority: P1
effort: "4h"
tags: [bugfix, data-correctness, runtime]
created: 2026-09-08
---

# Bugfix: Runtime Data Errors — AuditSoft NKC

## Overview

Audit toàn bộ codebase tìm thấy 6 bug ảnh hưởng trực tiếp đến tính chính xác dữ liệu khi chạy. Kế hoạch fix theo thứ tự ưu tiên: crash trước → data sai sau → UX sai cuối.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Fix crash khi `engagement` undefined trong Working Papers | P1 |
| 2 | Fix Promise orphan khi spawn worker chồng nhau | P1 |
| 3 | Fix kết quả `balanced` sai do so sánh raw bigint không align | P1 |
| 4 | Fix Working Papers đọc cột CDFS sai vị trí | P2 |
| 5 | Fix progress bar luôn hiển thị 100% | P2 |
| 6 | Fix RowErrorCode THIEU_TK_NO/CO/LOI_TIEN không bao giờ set | P3 |

## Phases

| # | Phase | Bug | File | Status |
|---|-------|-----|------|--------|
| 1 | Setup / confirm baseline | — | — | ✅ Completed |
| 2 | BUG-1: balanced scale alignment | AccountingReconciliationEngine.ts:119 | `src/main/accounting/` | ✅ Completed |
| 3 | BUG-2: engagement IPC validation | index.ts:206 | `src/main/` | ✅ Completed |
| 4 | BUG-3: worker isolation | index.ts:67-72 | `src/main/` | ✅ Completed |
| 5 | BUG-4: progress total | reconcile.worker.ts:40 | `src/workers/` | ✅ Completed |
| 6 | BUG-5: unused RowErrorCodes | standardize.ts | `src/domain/pipeline/` | ✅ Completed |
| 7 | BUG-6/7: CDFS column mapping + tentk fallback | WorkingPaperGenerator.ts:65-72 | `src/domain/workingpaper/` | ✅ Completed |
| 8 | Verify: toàn bộ test + typecheck | — | — | ✅ Completed |

## Success Criteria

- [x] `npm test` 153/153 pass (không regression)
- [x] `npm run typecheck` clean
- [x] `balanced` trả đúng khi TK Nợ=Có có scale khác nhau
- [x] `generateWorkingPapers` throw message rõ ràng khi thiếu `engagement`
- [x] Hai worker chạy song song không terminate lẫn nhau
- [x] Progress bar tăng dần từ 0% → 100% khi đọc file lớn
- [x] Working Papers đọc đúng số dư CDFS khi có cột STT đầu

<!-- slug: bugfix-runtime-data-errors -->
