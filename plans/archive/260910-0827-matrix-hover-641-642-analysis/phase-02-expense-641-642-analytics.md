# Phase 2: Expense 641/642 Analytics

## Overview

- Priority: P1, Status: Pending
- Engine phân tích chi phí theo TK 4 số từng tháng + 2 bảng UI (CPBH 641, CPQLDN 642) kèm Tổng / Doanh thu / Tỷ lệ.

## Key Insights

- `PreliminaryAnalyticsPage` đang giữ `entries`; `GlAnalyticsTab` chỉ nhận kết quả tính sẵn nên engine chạy ở page, truyền qua `GlAnalyticsResult.expenseDetail?`.
- Lõi tính phải dùng lại được cho Excel filler (dữ liệu `NkcTransaction`, amount là number) nên tách core thuần + adapter mỏng.

## Requirements

- Với prefix 641 và 642: liệt kê TK Nợ 4 số có phát sinh (sắp xếp tăng dần), ma trận 12 tháng theo từng TK, tổng hàng, tổng cột.
- Doanh thu tháng = Có 511; Tỷ lệ = Tổng chi phí / Doanh thu (DT = 0 → null → hiện `-`, không bao giờ `#DIV/0!`).
- UI: section mới dưới ma trận, 2 bảng; cột Tháng sticky; cột TK động; ô 0 → `-`; số monospace đậm; tỷ lệ 1 số lẻ kèm `%`.
- Không TK phát sinh → bảng hiện empty-state một dòng thay vì bảng rỗng.

## Architecture

- Mới `src/domain/analytics/ExpenseDetailAnalyzer.ts`:
  - `buildDetail(rows: Array<{ account: string; month: number; amount: number }>, prefix: '641' | '642', revenueByMonth: number[]): ExpenseDetailReport`
  - `analyzeJournal(entries: JournalEntry[]): { sell: ExpenseDetailReport; admin: ExpenseDetailReport }` (adapter Money → number, Nợ 641/642, DT Có 511)
  - `analyzeTransactions(txns: NkcTransaction[]): ...` (adapter cho filler Excel, phase 3 dùng)
- `src/domain/analytics/types.ts`: `ExpenseDetailReport { prefix, accounts: string[], months: number[][], totals: number[], revenue: number[], ratios: Array<number | null> }`; `GlAnalyticsResult` thêm `expenseDetail?: { sell; admin }`.
- `PreliminaryAnalyticsPage.tsx`: gọi adapter journal sau khi có `entries`, nhét vào `setGlResult`.
- `GlAnalyticsTab.tsx`: section `ExpenseDetailTables` (nội bộ hoặc file con cùng thư mục).

## Related Code Files

- Create: `src/domain/analytics/ExpenseDetailAnalyzer.ts`, `tests/expense-detail-analyzer.test.ts`
- Modify: `src/domain/analytics/types.ts`, `src/renderer/components/Analytics/PreliminaryAnalyticsPage.tsx`, `src/renderer/components/Analytics/GlAnalyticsTab.tsx`

## Implementation Steps

1. Viết core + 2 adapter + types.
2. Test: TK6412/TK6428 mẫu theo ảnh, tháng DT=0, entries rỗng, TK 3 số gộp đúng (641 → các TK641x).
3. Page tính và truyền `expenseDetail`.
4. Render 2 bảng UI theo style SaaS của ma trận.
5. `typecheck` + test file mới xanh.

## Todo List

- [x] Core + adapters + types
- [x] Unit test (TK mẫu, DT=0, rỗng)
- [x] Page wiring + UI 2 bảng
- [x] Verify style đồng bộ ma trận

## Success Criteria

- Bảng chỉ hiện TK 4 số có phát sinh, đúng thứ tự; Tổng = cộng hàng; Tỷ lệ = Tổng/DT, DT=0 → `-`.
- Full suite không regression.

## Risk Assessment

- Sổ dùng TK 3 số (641 chung, không chi tiết): bảng chỉ có 1 cột — chấp nhận, đúng bản chất số liệu.
- Bút toán Nợ 641 nhưng tháng null: bỏ qua như engine hiện tại (entries không month bị skip ở recon).

## Security Considerations

- Không có: tính toán local thuần túy.

## Next Steps

- Phase 3 tái dùng `analyzeTransactions` cho Excel.
