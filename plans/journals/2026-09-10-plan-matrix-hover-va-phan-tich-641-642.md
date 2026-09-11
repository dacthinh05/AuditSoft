# Journal: Plan matrix hover + phân tích 641/642 + fill G353/G453

- **Date**: 2026-09-10
- **Plan**: `plans/260910-0827-matrix-hover-641-642-analysis` (validated OK, 4 phases)
- **Duyệt**: hover-tooltip cách A (engine sinh `cellNotes`, UI CSS thuần).

## Quyết định chính

1. Bỏ pill `(!)` → tooltip CSS ≤ 2 dòng kèm % MoM; `warningNotes` giữ nguyên vì test cũ assert.
2. Xóa hộp alerts + file `SmartAuditAlerts.tsx`; nội dung sống tiếp trong hover.
3. Header 8 cột đều `min-width: 150px`; CẢ NĂM `0` → `-` (fix thiếu sót quy tắc `-`).
4. Engine `ExpenseDetailAnalyzer` tách core thuần + 2 adapter (JournalEntry cho UI, NkcTransaction cho Excel) để phase 3 tái dùng, không duplicate logic.
5. Excel: alias tên sheet + nhận diện 641/642 bằng nội dung + dò dòng theo nội dung (không row cứng); sheet vắng bỏ qua êm theo convention filler.

## Rủi ro còn lại

- Layout file G200 thật có thể lệch ảnh: chặn bằng test workbook mock + smoke cùng user ở phase 4.
- Tên sheet G353/G453 là dự kiến theo lời user; thiết kế đã miễn nhiễm bằng content-detection.
