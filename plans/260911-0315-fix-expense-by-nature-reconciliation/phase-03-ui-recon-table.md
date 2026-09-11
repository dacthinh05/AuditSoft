# Phase 3: Cập nhật UI ExpenseByNatureTable.tsx & PreliminaryAnalyticsPage.tsx

## Mục tiêu
1. **`PreliminaryAnalyticsPage.tsx`**:
   - Chuyển `res.trialBalance` sang `cdfsMap` qua `dtoToCdfsMap(res.trialBalance)`.
   - Truyền `cdfsMap` vào `FinancialCorrelationEngine.analyze(entries, incomeStatement, cdfsMap)`.
2. **`ExpenseByNatureTable.tsx`**:
   - Hiển thị đầy đủ số tiền `wipOpening154`, `wipClosing154`, `finishedOpening155`, `finishedClosing155`.
   - Nếu `recon.isBalanced` hoặc `Math.abs(recon.difference) < 1000`:
     - Badge chuyển sang màu xanh ngọc: `✓ Cân đối Thuyết minh (0 đ)`.
     - Cảnh báo vàng biến mất hoặc chuyển thành dòng thông báo xác nhận số liệu đã đối chiếu khớp với Thuyết minh BCTC.

## File tác động
- `src/renderer/components/Analytics/PreliminaryAnalyticsPage.tsx`
- `src/renderer/components/Analytics/ExpenseByNatureTable.tsx`
