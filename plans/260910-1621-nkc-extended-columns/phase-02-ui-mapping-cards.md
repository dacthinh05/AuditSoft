---
title: "Phase 2: UI mapping cards optional"
description: "SetupPage + SamplingTab hiển thị 4 thẻ ghép cột optional (MÃ KH, TÊN KH, TỶ GIÁ, NGOẠI TỆ) dưới 6 thẻ bắt buộc."
status: completed
priority: P1
effort: "0.2h"
created: 2026-09-10
---

# Phase 2: UI mapping cards optional

## Touchpoints

| File | Việc làm |
|---|---|
| `src/renderer/pages/SetupPage.tsx:15` | `FIELDS` giữ 6 core; thêm `OPTIONAL_FIELDS` (4 mục + desc) |
| `src/renderer/pages/SetupPage.tsx:262` | Sheet-switch `setCfg` mapping thêm 4 keys `?? null` |
| `src/renderer/components/SamplingTab.tsx:323` | Tương tự khi dựng mapping từ `suggestedMapping` |
| `src/renderer/pages/SetupPage.tsx:118` | `handleApplyPaste` auto-mapping thêm 4 keys `null` |

## Quy tắc UI

- 4 thẻ optional nằm trong block riêng dưới 6 thẻ core, nhãn "không bắt buộc".
- Option đầu mỗi select: `-- Không dùng --` (map về `null`).
- Trạng thái `is-mapped/is-unmapped` của optional **không ảnh hưởng** badge
  "Sẵn sàng" và `mappingComplete` (chỉ 6 core quyết định).
- Clipboard/DB (`side.pasted`): auto 6 core như cũ, 4 optional `null`
  (dữ liệu dán 6 cột không có gì để ghép).

## Verify

- Mở file mẫu 10 cột: 6 thẻ core xanh, 4 thẻ optional gợi ý đúng vị trí cột.
- Đổi sheet / dán clipboard: không crash, mapping 6 core giữ nguyên.
