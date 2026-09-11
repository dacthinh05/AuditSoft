---
title: "Phase 1: Pipeline mapping 6→10 cột optional"
description: "Mở rộng ColumnMapping/ColumnMappingLike, FIELD_SYNONYMS, standardizeSource và NormalizedEntry với 4 trường nullable."
status: completed
priority: P1
effort: "0.3h"
created: 2026-09-10
---

# Phase 1: Pipeline mapping 6→10 cột optional

## Touchpoints (đã scout, không đoán)

| File | Việc làm |
|---|---|
| `src/domain/types.ts:6` | `ColumnMapping` += `partnerCode, partnerName, exchangeRate, foreignAmount: number \| null` |
| `src/shared/ipc.ts:50` | `ColumnMappingLike` += 4 trường tương tự |
| `src/infrastructure/excel/columnMapper.ts:6` | `FIELD_SYNONYMS` += 4 roles + `ROLE_PRIORITY` giữ 6 core trước |
| `src/infrastructure/excel/columnMapper.ts:68,84` | `detectHeaderAndMapping` + `emptyMapping()` trả 10 keys |
| `src/domain/pipeline/standardize.ts:34-39,69` | Đọc 4 cột qua `cellAt` (nullable, không sinh `RowErrorCode` khi thiếu) |
| `src/domain/types.ts:24` | `NormalizedEntry` += `partnerCode: string \| null, partnerName: string \| null, exchangeRate: Money \| null, foreignAmount: Money \| null` |

## Quy tắc cứng

- 4 cột mới **không tham gia** `buildKey`, không sinh lỗi mapping thiếu,
  `isMappingComplete` chỉ xét 6 core (giữ nguyên).
- `TỶ GIÁ`/`US` parse qua `parseMoney`; ô `-`/trống → `null` (đúng thực tế file mẫu).
- Mọi chỗ dựng mapping literal 6 trường (`reconcileSlice:85`, `SetupPage:262`,
  `SamplingTab:323`, `handleApplyPaste`) thêm 4 keys `?? null`.

## Verify

- `npm run typecheck`; test mới: standardize file 10 cột giữ đủ 4 trường,
  file 6 cột ra `null` hết và kết quả đối chiếu đồng nhất.
