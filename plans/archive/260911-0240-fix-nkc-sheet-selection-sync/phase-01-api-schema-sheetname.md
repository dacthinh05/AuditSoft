# Phase 1: Mở rộng auditAnalyze API & Schemas hỗ trợ sheetName

## Mục tiêu
Cho phép frontend chỉ định rõ ràng sheet cụ thể cần phân tích trong file Excel:
1. **`src/shared/schemas.ts`**:
   - Mở rộng `auditAnalyzeSchema`:
     ```ts
     export const auditAnalyzeSchema = z.object({
       filePath: z.string().min(1),
       sheetName: z.string().optional(),
       overall: z.number().nonnegative().optional(),
       performance: z.number().nonnegative().optional(),
       clearlyTrivial: z.number().nonnegative().optional(),
       fiscalYear: z.number().int().optional(),
       journalsCap: z.number().int().positive().optional(),
     })
     ```
2. **`src/main/AnalysisPipeline.ts`**:
   - Thêm `sheetName?: string` vào `RunAnalysisOptions`.
   - Trong `runFullAnalysis`: nếu có `opts.sheetName`, xây dựng mảng overrides:
     ```ts
     const overrides: ManualSheetOverride[] = opts.sheetName
       ? [{ type: 'GENERAL_LEDGER', sheetName: opts.sheetName }]
       : []
     const imp = await new ExcelImportService().importWorkbook(opts.filePath, overrides)
     ```

## File tác động
- `src/shared/schemas.ts`
- `src/shared/types/analytics.ts`
- `src/main/AnalysisPipeline.ts`
