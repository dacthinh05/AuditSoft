# Phase 1: Chuẩn hóa thang đo confidence trong columnMapper.ts & inspectWorkbook.ts

## Mục tiêu
Đưa `confidence` về dải chuẩn từ `0` đến `100` (integer percentage):
1. Trong `src/infrastructure/excel/columnMapper.ts`:
   - Dòng 84: đổi `confidence: matchedRoles / 6` thành:
     ```ts
     confidence: Math.min(100, Math.round((matchedRoles / 6) * 100))
     ```
   - Dòng 69: kiểm tra lại điều kiện so sánh `totalScore > (best.confidence / 100) * 6` hoặc giữ logic so sánh phù hợp.
2. Kiểm tra `SheetClassifier.ts` và `ExcelImportService.ts` để đảm bảo không bị xung đột scale.

## File tác động
- `src/infrastructure/excel/columnMapper.ts`
- `src/infrastructure/excel/inspectWorkbook.ts`
