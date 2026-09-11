# Journal: Hoàn thành matrix hover + phân tích 641/642 + fill G353/G453

- **Date**: 2026-09-10
- **Plan**: `plans/260910-0827-matrix-hover-641-642-analysis` (4/4 phases done)

## Thay đổi

1. **Hover thay (!)**: `Trend12MAnalyzer` sinh thêm `cellNotes` theo từng ô (kèm % MoM, T01 so bình quân, gộp note dồn giá vốn vào COGS T12); `warningNotes` giữ nguyên từng ký tự nên test cũ xanh. UI `AnomalyCell` hover tooltip nền tối, ô giữ nền vàng + gạch chân chấm. Xóa hộp alerts + file `SmartAuditAlerts.tsx`.
2. **Header cân đối**: 8 cột cùng `min-width: 150px`, label + pattern căn giữa; hàng CẢ NĂM `0` → `-`.
3. **Phân tích 641/642**: engine `ExpenseDetailAnalyzer` (core thuần + adapter JournalEntry/NkcTransaction); 2 bảng UI Tháng × TK 4 số động + Tổng + Doanh thu + Tỷ lệ, DT=0 → `-`. Tính ở page, truyền qua `GlAnalyticsResult.expenseDetail?`.
4. **Excel**: `G200_ExpenseFiller` thêm mục 7-8 — alias `G353`/`G 353`/`G453`/`G 453`, nhận diện prefix bằng nội dung header, dò dòng Tháng/Cộng theo nội dung, ghi số (không công thức), sheet vắng bỏ qua êm.

## Nghiệm thu

- `typecheck` 0 lỗi · lint sạch trên mọi file của mình · `vitest` 49 files / 258 tests pass · `build` thành công.
- Grep `(!)` trong GlAnalyticsTab = 0; không còn reference `SmartAuditAlerts` trong source.
- 2 lint errors còn lại nằm ở `SetupPage.tsx` (WIP db-connector của tiến trình khác, unused vars) — ngoài scope, không đụng.
- Test mới: `expense-detail-analyzer` (5), `g353-g453-fill` (4, gồm case tráo tên sheet + sheet vắng), `cellNotes` (1).

## Follow-up

- Smoke trên file G200 thật cùng user để xác nhận tên sheet/layout (thiết kế đã chịu lệch: alias + content-detection).
- Làm rõ số hiệu G453/G353 vs G310/G410 khi smoke.
