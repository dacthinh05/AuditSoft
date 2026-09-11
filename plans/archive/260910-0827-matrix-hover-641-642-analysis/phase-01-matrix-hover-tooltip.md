# Phase 1: Matrix Hover Tooltip

## Overview

- Priority: P1, Status: Pending
- Bỏ pill `(!)`, hover hiện note ngắn. Xóa hộp `SmartAuditAlerts`. Cân 8 header. CẢ NĂM `0` → `-`.

## Key Insights

- `momGrowth` và `anomalyMonths` đã có trong `MonthlyTrendRow`; chỉ thiếu câu note gắn từng ô.
- Test cũ assert `warningNotes` chứa 'Tháng 12' nên giữ nguyên mảng đó.

## Requirements

- Ô đột biến: số liệu bình thường + nền vàng nhạt + gạch chân chấm; hover hiện tooltip tối (≤ 2 dòng): `% MoM so với tháng trước + câu kiểm toán ngắn`.
- Tháng 1 đột biến (không có MoM): note dạng `Gấp X lần bình quân tháng`.
- Ô COGS Tháng 12 khi có note dồn giá vốn: tooltip gộp cả note Matching Principle.
- Header 8 cột cùng `min-width: 150px`, label + pattern căn giữa thống nhất.
- Hàng CẢ NĂM: total = 0 hiện `-` (đồng bộ quy tắc ô).
- Xóa import + usage `SmartAuditAlerts` trong `GlAnalyticsTab.tsx` và xóa file component.

## Architecture

- `src/domain/analytics/types.ts`: `MonthlyTrendRow` thêm `cellNotes?: Record<number, string>` (key = tháng 1–12).
- `src/domain/analytics/Trend12MAnalyzer.ts`: sinh `cellNotes` cùng vòng lặp phát hiện đột biến; `warningNotes` giữ nguyên từng ký tự.
- `src/renderer/components/Analytics/GlAnalyticsTab.tsx`: component nội bộ `CellNote` (span bọc số + div tooltip CSS `:hover`, không state, không lib).

## Related Code Files

- Modify: `src/domain/analytics/types.ts`, `src/domain/analytics/Trend12MAnalyzer.ts`, `src/renderer/components/Analytics/GlAnalyticsTab.tsx`
- Delete: `src/renderer/components/Analytics/SmartAuditAlerts.tsx` (sau khi grep xác nhận không còn import)
- Modify (tests): `tests/accounting-analytics-engines.test.ts` hoặc test mới cho `cellNotes`

## Implementation Steps

1. Thêm field `cellNotes?` vào `MonthlyTrendRow`.
2. Trong `Trend12MAnalyzer.analyze`, khi push `anomalyMonths`, đồng thời ghi `cellNotes[m]` với câu ngắn kèm % MoM (tháng 1: so bình quân).
3. Gộp note dồn giá vốn vào `cellNotes[12]` của hàng COGS khi điều kiện khớp.
4. Viết `CellNote` CSS hover trong `GlAnalyticsTab.tsx`; thay nhánh render `(!)` bằng `CellNote`.
5. Đồng đều header 8 cột; CẢ NĂM total 0 → `-`.
6. Xóa usage + file `SmartAuditAlerts.tsx`.
7. Mở rộng test: `cellNotes` tồn tại đúng tháng đột biến; `warningNotes` cũ không đổi.

## Todo List

- [x] Field `cellNotes` + sinh note trong engine
- [x] `CellNote` hover + thay pill `(!)`
- [x] Header cân đối + CẢ NĂM `-`
- [x] Xóa alerts box + file chết
- [x] Test engine + `typecheck`

## Success Criteria

- Grep `(!)` trong `GlAnalyticsTab.tsx` rỗng; hover ô vàng thấy note ngắn có % MoM.
- Test `warningNotes` cũ vẫn xanh; test mới cho `cellNotes` xanh.

## Risk Assessment

- Câu note máy sinh có thể cụt ý: mitigation là giữ ≤ 2 dòng, chi tiết vẫn có trong chứng từ gốc.
- CSS tooltip tràn mép phải ở cột cuối: mitigation `right: 0` cho 2 cột cuối hoặc `white-space: normal; max-width: 240px`.

## Security Considerations

- Không có: text nội bộ, không input người dùng, không network.

## Next Steps

- Phase 2 (section 641/642) sau khi phase này xong vì cùng sửa `GlAnalyticsTab.tsx`.
