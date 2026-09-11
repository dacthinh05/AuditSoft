---
phase: 2
title: "Pipeline & Working Paper Fillers Integration"
status: pending
effort: "1.5h"
files:
  - src/domain/workingpaper/WorkingPaperGenerator.ts
  - src/domain/workingpaper/fillers/D600_PrepaidFiller.ts
  - src/domain/workingpaper/fillers/D700_FixedAssetFiller.ts
  - src/domain/workingpaper/fillers/E300_TaxFiller.ts
  - src/domain/workingpaper/fillers/E400_PayrollFiller.ts
  - src/domain/workingpaper/fillers/F100_EquityFiller.ts
  - src/domain/workingpaper/fillers/G200_ExpenseFiller.ts
  - src/shared/ipc.ts
  - src/main/index.ts
---

# Phase 2: Pipeline & Working Paper Fillers Integration

## Mục tiêu
Tích hợp tự động hóa từ đầu vào (nhận đường dẫn file NKC Sau Điều Chỉnh) qua khâu trích xuất ngữ cảnh kế toán đến toàn bộ 15 bộ filler điền số vào Lead Schedules.

## Chi tiết công việc
1. Mở rộng giao diện IPC `src/shared/ipc.ts`:
   - Bổ sung trường `adjustedSourcePath?: string` vào `GenerateWorkingPapersRequest`.
2. Cập nhật `src/main/index.ts`:
   - Nhận `adjustedSourcePath` từ giao diện và truyền vào `extractAccountingContext`.
3. Cập nhật `src/domain/workingpaper/WorkingPaperGenerator.ts`:
   - Trong `extractAccountingContext`, nếu có `adjustedSourcePath`:
     * Đọc và chuẩn hóa cả 2 file Trước và Sau qua `reconcileSources`.
     * Chạy `AjeDerivationEngine` để sinh ra `ctx.adjustingEntries`.
4. Hoàn thiện các fillers còn lại:
   - `D600_PrepaidFiller`: Điền Cột 5 cho TK 242 (`adj242`).
   - `D700_FixedAssetFiller`: Điền Cột 5 cho TK 211, 214 (`adj211`, `adj214`).
   - `E300_TaxFiller`: Điền Cột 5 cho TK 133, 3331, 3334...
   - `E400_PayrollFiller`: Điền Cột 5 cho TK 334, 338.
   - `F100_EquityFiller`: Điền Cột 5 cho TK 411, 421.
   - `G200_ExpenseFiller`: Điền Cột 5 cho TK 632, 641, 642.
