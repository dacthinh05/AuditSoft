# Phase 1: Kqkd Yoy Engine

## Overview

- Priority: P1, Status: Pending
- Helper dựng dòng KQKD YoY từ B02 (ưu tiên) hoặc NKC (fallback), kèm test.

## Key Insights

- `IncomeStatementData.lines` đã có `{maSo, chiTieu, current, prior}` (Money|null); page có sẵn qua `dtoToKqkd`.
- Map TK→mã số theo `catalog.ts` + `TK_GIA_VON`: 01=Có 511; 02=Nợ 521; 10=01-02; 11=Nợ TK_GIA_VON; 25=Nợ 641; 26=Nợ 642; 30=Có 515; 31=Nợ 635; 40=Nợ 811; 51=Có 711; 60=10-11; 70=60+30-31-25-26.

## Requirements

- Mới `src/domain/analytics/KqkdYoY.ts`: `buildKqkdYoY(income: IncomeStatementData | null, entries: JournalEntry[]): KqkdYoYRow[]`, mỗi dòng `{maSo, chiTieu, current: number, prior: number | null, diff: number | null, pct: number | null}`.
- Từng mã số: lấy B02 nếu có số (current ưu tiên, prior nếu có); thiếu thì NKC; cả hai thiếu → dòng vẫn liệt kê với current=0? Không: bỏ dòng khi cả 2 nguồn đều 0/null để bảng gọn, trừ khi B02 liệt kê.
- `pct` null khi prior null hoặc =0 (hiện `-`, không chia 0).
- Types vào `src/domain/analytics/types.ts`: `KqkdYoYRow`; `GlAnalyticsResult` thêm `kqkdYoY?: KqkdYoYRow[]`.

## Architecture

- Pure function, Money→number biên trong helper; không đụng engine cũ.
- `PreliminaryAnalyticsPage.tsx`: gọi helper sau khi có entries + incomeStatement, nhét vào `setGlResult` (cạnh `expenseDetail`).

## Related Code Files

- Create: `src/domain/analytics/KqkdYoY.ts`, `tests/kqkd-yoy.test.ts`
- Modify: `src/domain/analytics/types.ts`, `src/renderer/components/Analytics/PreliminaryAnalyticsPage.tsx`

## Implementation Steps

1. Viết helper + types theo map trên.
2. Test: B02 đủ 2 năm (diff/% đúng); chỉ NKC (prior null, current từ TK, lãi vay `-`); rỗng (bảng rỗng, không throw).
3. Nối page wiring; typecheck.

## Todo List

- [x] Helper + types
- [x] Unit test 3 case
- [x] Page wiring

## Success Criteria

- Test xanh; số Năm nay từ NKC khớp logic fallback `EbitdaCalculator` (DT 511, GV 632).

## Risk Assessment

- Map 70 NKC thuần khác B02 đã điều chỉnh: mitigation là nhãn panel ghi rõ nguồn ("Số B02" / "Kết từ NKC").

## Security Considerations

- Không có.

## Next Steps

- Phase 2 vẽ panel + chart.
