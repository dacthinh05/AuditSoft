---
title: "Phase 3: Analytics wiring + verification"
description: "Nối NormalizedEntry vào JournalEntry (objectCode/customerName), kiểm tra Pareto + soát tỷ giá trên dữ liệu thật, full verification."
status: completed
priority: P1
effort: "0.3h"
created: 2026-09-10
---

# Phase 3: Analytics wiring + verification

## Touchpoints

| File | Việc làm |
|---|---|
| Nơi convert `NormalizedEntry` → `JournalEntry` (kiểm tra lúc làm: `IAuditDataEngine` converter / `AccountingReconciliationEngine`) | Map `partnerCode → objectCode`, `partnerName → customerName` |
| `ConcentrationAnalyzer` | Không đổi logic — nhận tên thật thay vì `KH_LE`; kiểm tra Pareto với file mẫu |
| Soát tỷ giá | Rule mới mức INFO: bút toán có `exchangeRate != null` và `foreignAmount != null` nhưng `amount ≠ rate × foreign` (sai số làm tròn cho phép) → gắn cờ "kiểm tra tỷ giá hạch toán". Bút toán thiếu 1 trong 2 → bỏ qua, không báo |

## Quy tắc

- Không có tỷ giá tham chiếu thị trường trong phạm vi này — chỉ kiểm tra
  **nhất quán nội tại** (`SỐ TIỀN ≈ TỶ GIÁ × US`); so với tỷ giá NHNN để sau.
- Cột trống toàn file (như ảnh mẫu: TỶ GIÁ=0, TÊN KH trống) → analytics im lặng,
  không sinh cảnh báo rác.

## Verify

- `npm run typecheck` 0 lỗi; `npm run test` 248 + tests mới xanh;
  `npm run build` thành công.
- Test hồi quy: file 6 cột cũ ra `DiffRow` đồng nhất byte với trước refactor.
